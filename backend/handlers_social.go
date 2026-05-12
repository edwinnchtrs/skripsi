package main

import (
	"net/http"

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
