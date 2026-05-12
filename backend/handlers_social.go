package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func UserHistoryHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	
	var predictions []Prediction
	if err := DB.Where("user_id = ?", user.ID).Order("timestamp DESC").Find(&predictions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch predictions"})
		return
	}

	var assessments []Assessment
	if err := DB.Where("user_id = ?", user.ID).Order("timestamp DESC").Find(&assessments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assessments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"predictions": predictions,
		"assessments": assessments,
	})
}

func UserProfileGetHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	
	var followerCount int64
	DB.Model(&Follow{}).Where("following_id = ?", user.ID).Count(&followerCount)

	var followingCount int64
	DB.Model(&Follow{}).Where("follower_id = ?", user.ID).Count(&followingCount)

	c.JSON(http.StatusOK, gin.H{
		"id": user.ID,
		"username": user.Username,
		"nama": user.Nama,
		"bio": user.Bio,
		"profile_pic": user.ProfilePic,
		"follower_count": followerCount,
		"following_count": followingCount,
	})
}

func UserProfilePutHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	var input struct {
		Username   string `json:"username"`
		Password   string `json:"password"`
		Bio        string `json:"bio"`
		ProfilePic string `json:"profile_pic"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{
		"bio": input.Bio,
	}

	if input.ProfilePic != "" {
		updates["profile_pic"] = input.ProfilePic
	}

	authChanged := false

	if input.Username != "" && input.Username != user.Username {
		var count int64
		DB.Model(&User{}).Where("username = ?", input.Username).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username already taken"})
			return
		}
		updates["username"] = input.Username
		authChanged = true
	}

	if input.Password != "" {
		hashedPassword, _ := HashPassword(input.Password)
		updates["password_hash"] = hashedPassword
		authChanged = true
	}

	if err := DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success", 
		"message": "Profile updated",
		"auth_changed": authChanged,
	})
}

func NetworkUsersHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	var users []User
	// Exclude current user and admins
	DB.Where("id != ? AND role != ?", user.ID, "admin").Find(&users)

	type NetworkUserDTO struct {
		ID         uint   `json:"id"`
		Nama       string `json:"nama"`
		Username   string `json:"username"`
		Bio        string `json:"bio"`
		ProfilePic string `json:"profile_pic"`
		IsFollowed bool   `json:"is_followed"`
		Affinity   string `json:"affinity"`
	}

	var results []NetworkUserDTO
	for _, u := range users {
		// Check if current user follows this user
		var count int64
		DB.Model(&Follow{}).Where("follower_id = ? AND following_id = ?", user.ID, u.ID).Count(&count)
		
		// Check affinity
		var affinity Affinity
		affinityType := ""
		if err := DB.Where("user_id = ? AND target_user_id = ?", user.ID, u.ID).First(&affinity).Error; err == nil {
			affinityType = affinity.Type
		}

		results = append(results, NetworkUserDTO{
			ID:         u.ID,
			Nama:       u.Nama,
			Username:   u.Username,
			Bio:        u.Bio,
			ProfilePic: u.ProfilePic,
			IsFollowed: count > 0,
			Affinity:   affinityType,
		})
	}

	c.JSON(http.StatusOK, gin.H{"users": results})
}

func NetworkFollowHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	targetID := c.Param("id")

	var targetUser User
	if err := DB.First(&targetUser, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target user not found"})
		return
	}

	var follow Follow
	result := DB.Where("follower_id = ? AND following_id = ?", user.ID, targetUser.ID).First(&follow)
	
	if result.Error == nil {
		// Already following, so unfollow
		DB.Delete(&follow)
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Unfollowed", "is_followed": false})
	} else {
		// Follow
		newFollow := Follow{FollowerID: user.ID, FollowingID: targetUser.ID}
		DB.Create(&newFollow)
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Followed", "is_followed": true})
	}
}

func NetworkAffinityHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	targetID := c.Param("id")

	var targetUser User
	if err := DB.First(&targetUser, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target user not found"})
		return
	}

	var input struct {
		Type string `json:"type" binding:"required"` // teman, pacar, saudara, or empty to remove
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var affinity Affinity
	result := DB.Where("user_id = ? AND target_user_id = ?", user.ID, targetUser.ID).First(&affinity)

	if input.Type == "" || input.Type == "none" {
		if result.Error == nil {
			DB.Delete(&affinity)
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Affinity removed", "affinity": ""})
		return
	}

	if result.Error == nil {
		// Update
		affinity.Type = input.Type
		DB.Save(&affinity)
	} else {
		// Create
		affinity = Affinity{UserID: user.ID, TargetUserID: targetUser.ID, Type: input.Type}
		DB.Create(&affinity)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Affinity updated", "affinity": affinity.Type})
}

func GosipGetHandler(c *gin.Context) {
	var curhats []Curhat
	DB.Preload("Replies").Order("timestamp desc").Limit(20).Find(&curhats)
	c.JSON(http.StatusOK, gin.H{"curhats": curhats})
}

func NetworkConversationsHandler(c *gin.Context) {
	user := c.MustGet("user").(User)

	type ConvResult struct {
		ID         uint
		Nama       string
		Username   string
		ProfilePic string
		LastText   string
		LastTime   time.Time
		PartnerID  uint
	}

	var convs []ConvResult
	// MySQL-compatible query: use subquery instead of LATERAL
	DB.Raw(`
		SELECT u.id, u.nama, u.username, u.profile_pic,
			COALESCE(
				(SELECT text FROM messages
				 WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
				 ORDER BY timestamp DESC LIMIT 1
				), ''
			) AS last_text,
			COALESCE(
				(SELECT timestamp FROM messages
				 WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
				 ORDER BY timestamp DESC LIMIT 1
				), u.created_at
			) AS last_time,
			u.id AS partner_id
		FROM users u
		WHERE u.id != ?
		  AND u.deleted_at IS NULL
		  AND EXISTS (
			  SELECT 1 FROM messages m
			  WHERE (m.sender_id = ? AND m.receiver_id = u.id)
			     OR (m.sender_id = u.id AND m.receiver_id = ?)
		  )
		ORDER BY last_time DESC
		LIMIT 30
	`, user.ID, user.ID, user.ID, user.ID, user.ID, user.ID, user.ID).Scan(&convs)

	type ConversationDTO struct {
		ID          uint      `json:"id"`
		Nama        string    `json:"nama"`
		Username    string    `json:"username"`
		ProfilePic  string    `json:"profile_pic"`
		LastMessage string    `json:"last_message"`
		LastTime    time.Time `json:"last_time"`
	}

	var results []ConversationDTO
	for _, conv := range convs {
		results = append(results, ConversationDTO{
			ID:          conv.ID,
			Nama:        conv.Nama,
			Username:    conv.Username,
			ProfilePic:  conv.ProfilePic,
			LastMessage: conv.LastText,
			LastTime:    conv.LastTime,
		})
	}

	if results == nil {
		results = []ConversationDTO{}
	}
	c.JSON(http.StatusOK, gin.H{"conversations": results})
}

func NetworkMessagesHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	targetID := c.Param("userId")

	var target User
	if err := DB.First(&target, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var messages []Message
	DB.Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		user.ID, targetID, targetID, user.ID,
	).Order("timestamp ASC").Limit(100).Find(&messages)

	if messages == nil {
		messages = []Message{}
	}

	c.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"partner": gin.H{
			"id":          target.ID,
			"nama":        target.Nama,
			"username":    target.Username,
			"profile_pic": target.ProfilePic,
		},
	})
}

func NetworkSendMessageHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	targetID := c.Param("userId")

	var input struct {
		Text string `json:"text" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pesan tidak boleh kosong"})
		return
	}

	var target User
	if err := DB.First(&target, targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	msg := Message{
		SenderID:   user.ID,
		ReceiverID: target.ID,
		Text:       input.Text,
	}

	if err := DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengirim pesan"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": msg})
}
