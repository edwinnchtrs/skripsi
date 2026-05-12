package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CurhatSubmitHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	var input struct {
		Text string `json:"text" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch last 5 messages for memory
	var history []Curhat
	DB.Where("user_id = ?", user.ID).Order("id desc").Limit(5).Find(&history)
	// Reverse history to be chronological
	for i, j := 0, len(history)-1; i < j; i, j = i+1, j-1 {
		history[i], history[j] = history[j], history[i]
	}

	initialStress := analyzeStressLevel(input.Text)
	aiResponse, finalStress := generateAIResponse(input.Text, history, initialStress)

	curhat := Curhat{
		UserID:      user.ID,
		Text:        input.Text,
		StressScore: finalStress,
		IsAnonymous: true,
		AIResponse:  aiResponse,
	}
	DB.Create(&curhat)

	c.JSON(http.StatusOK, gin.H{"status": "success", "curhat": curhat})
}

func CurhatReplyHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	curhatID := c.Param("id")

	var input struct {
		Text string `json:"text" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var curhat Curhat
	if err := DB.First(&curhat, curhatID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Curhat not found"})
		return
	}

	reply := CurhatReply{
		CurhatID: curhat.ID,
		UserID:   user.ID,
		Text:     input.Text,
	}
	DB.Create(&reply)

	if curhat.UserID != user.ID {
		notification := Notification{
			UserID:  curhat.UserID,
			Type:    "reply",
			Message: "Seseorang membalas curhatan anonim Anda.",
		}
		DB.Create(&notification)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "reply": reply})
}

func UserCurhatHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	var curhats []Curhat
	DB.Where("user_id = ?", user.ID).Order("timestamp asc").Find(&curhats)
	c.JSON(http.StatusOK, gin.H{"curhats": curhats})
}

func PostCreateHandler(c *gin.Context) {
	user := c.MustGet("user").(User)

	var input struct {
		Text  string `json:"text"`
		Image string `json:"image"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Text == "" && input.Image == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Text atau gambar harus diisi"})
		return
	}

	post := Post{
		UserID: user.ID,
		Text:   input.Text,
		Image:  input.Image,
	}
	if err := DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat postingan"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status": "success",
		"post": gin.H{
			"id":        post.ID,
			"text":      post.Text,
			"image":     post.Image,
			"timestamp": post.Timestamp,
		},
	})
}
