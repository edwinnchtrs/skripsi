package main

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// ============================================================
// Grup Chat DPA — satu grup per DPA berisi DPA + seluruh
// mahasiswa bimbingannya. Proteksi scope ketat:
//   - DPA hanya melihat grup miliknya sendiri.
//   - Student hanya melihat grup DPA pembimbingnya.
// ============================================================

const dpaMessageLimit = 200

func DpaChatMessagesHandler(c *gin.Context) {
	user := c.MustGet("user").(User)

	var dpaID uint
	switch normalizeRole(user.Role) {
	case RoleDPA:
		dpaID = user.ID
	case RoleStudent:
		if user.DpaID == 0 {
			c.JSON(http.StatusOK, gin.H{"messages": []gin.H{}, "dpa": nil, "students": []gin.H{}})
			return
		}
		dpaID = user.DpaID
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Grup chat hanya untuk DPA dan mahasiswa bimbingannya"})
		return
	}

	after := 0
	if raw := c.Query("after"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			after = parsed
		}
	}

	query := DB.Where("dpa_id = ?", dpaID).Order("id ASC")
	if after > 0 {
		query = query.Where("id > ?", after)
	}
	var messages []DpaMessage
	query.Limit(dpaMessageLimit).Find(&messages)

	// Nama pengirim untuk rendering bubble.
	senderNames := map[uint]string{}
	senderRoles := map[uint]string{}
	students := dpaAdvisees(dpaID)
	var dpa User
	DB.First(&dpa, dpaID)
	senderNames[dpa.ID] = dpa.Nama
	senderRoles[dpa.ID] = RoleDPA
	for _, student := range students {
		senderNames[student.ID] = student.Nama
		senderRoles[student.ID] = RoleStudent
	}

	type ChatMessage struct {
		ID         uint      `json:"id"`
		SenderID   uint      `json:"sender_id"`
		SenderName string    `json:"sender_name"`
		SenderRole string    `json:"sender_role"`
		Body       string    `json:"body"`
		Timestamp  time.Time `json:"timestamp"`
	}
	items := make([]ChatMessage, 0, len(messages))
	for _, message := range messages {
		items = append(items, ChatMessage{
			ID:         message.ID,
			SenderID:   message.SenderID,
			SenderName: senderNames[message.SenderID],
			SenderRole: message.SenderRole,
			Body:       message.Body,
			Timestamp:  message.Timestamp,
		})
	}

	// Roster anggota grup (dipakai rail kanan DPA & header student).
	type Member struct {
		ID       uint   `json:"id"`
		Nama     string `json:"nama"`
		Nim      string `json:"nim"`
		Role     string `json:"role"`
		Online   bool   `json:"-"`
	}
	members := []Member{{ID: dpa.ID, Nama: dpa.Nama, Role: RoleDPA}}
	for _, student := range students {
		members = append(members, Member{ID: student.ID, Nama: student.Nama, Nim: student.Nim, Role: RoleStudent})
	}

	// Well-being snapshot per mahasiswa untuk DPA (chip status di roster).
	wellbeing := map[uint]gin.H{}
	if normalizeRole(user.Role) == RoleDPA {
		config := getSystemConfig()
		for _, student := range students {
			snapshot := gin.H{}
			if burnout, ok := latestBurnoutFor(student.ID); ok {
				snapshot["burnout"] = round2(burnout.BurnoutScore)
				snapshot["burnout_category"] = burnoutCategoryLabel(burnout.BurnoutScore, config)
			}
			if happiness, ok := latestHappinessFor(student.ID); ok {
				snapshot["happiness"] = round2(happiness.HappinessIndex)
				snapshot["happiness_category"] = happiness.Category
			}
			if len(snapshot) > 0 {
				wellbeing[student.ID] = snapshot
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"dpa":       gin.H{"id": dpa.ID, "nama": dpa.Nama},
		"messages":  items,
		"members":   members,
		"wellbeing": wellbeing,
		"me":        gin.H{"id": user.ID, "nama": user.Nama, "role": user.Role},
	})
}

func DpaChatSendHandler(c *gin.Context) {
	user := c.MustGet("user").(User)

	var dpaID uint
	var senderRole string
	switch normalizeRole(user.Role) {
	case RoleDPA:
		dpaID = user.ID
		senderRole = RoleDPA
	case RoleStudent:
		if user.DpaID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Anda belum dipetakan ke DPA pembimbing"})
			return
		}
		dpaID = user.DpaID
		senderRole = RoleStudent
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "Grup chat hanya untuk DPA dan mahasiswa bimbingannya"})
		return
	}

	var input struct {
		Body string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pesan tidak boleh kosong"})
		return
	}
	body := truncateString(input.Body, 2000)

	message := DpaMessage{
		DpaID:      dpaID,
		SenderID:   user.ID,
		SenderRole: senderRole,
		Body:       body,
		Timestamp:  time.Now(),
	}
	if err := DB.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengirim pesan"})
		return
	}

	// Notifikasi: pesan DPA → semua mahasiswa bimbingan;
	// pesan student → DPA-nya.
	recipients := []uint{}
	if senderRole == RoleDPA {
		for _, student := range dpaAdvisees(dpaID) {
			recipients = append(recipients, student.ID)
		}
	} else {
		recipients = append(recipients, dpaID)
	}
	for _, recipientID := range recipients {
		DB.Create(&Notification{
			UserID:  recipientID,
			Type:    "dpa_chat",
			Message: fmt.Sprintf("Pesan baru di grup chat bimbingan dari %s.", user.Nama),
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": gin.H{
			"id":          message.ID,
			"sender_id":   message.SenderID,
			"sender_name": user.Nama,
			"sender_role": senderRole,
			"body":        message.Body,
			"timestamp":   message.Timestamp,
		},
	})
}
