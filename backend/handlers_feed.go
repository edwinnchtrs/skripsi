package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GET /feed — returns posts from followed users + own posts
func FeedGetHandler(c *gin.Context) {
	currentUser := c.MustGet("user").(User)

	// Get list of following IDs
	var followingIDs []uint
	DB.Model(&Follow{}).
		Where("follower_id = ?", currentUser.ID).
		Pluck("following_id", &followingIDs)

	// Include own posts
	authorIDs := append(followingIDs, currentUser.ID)

	// Fetch posts ordered by newest first
	var posts []Post
	DB.Where("user_id IN ?", authorIDs).
		Order("created_at DESC").
		Limit(50).
		Find(&posts)

	type CommentDTO struct {
		ID         uint   `json:"id"`
		UserID     uint   `json:"user_id"`
		Username   string `json:"username"`
		Nama       string `json:"nama"`
		ProfilePic string `json:"profile_pic"`
		Text       string `json:"text"`
		Timestamp  string `json:"timestamp"`
	}

	type PostDTO struct {
		ID           uint         `json:"id"`
		Text         string       `json:"text"`
		Image        string       `json:"image"`
		Timestamp    string       `json:"timestamp"`
		UserID       uint         `json:"user_id"`
		Username     string       `json:"username"`
		Nama         string       `json:"nama"`
		ProfilePic   string       `json:"profile_pic"`
		LikeCount    int64        `json:"like_count"`
		CommentCount int64        `json:"comment_count"`
		IsLiked      bool         `json:"is_liked"`
		Comments     []CommentDTO `json:"comments"`
	}

	result := []PostDTO{}
	for _, p := range posts {
		// Fetch author
		var author User
		DB.First(&author, p.UserID)

		// Like count
		var likeCount int64
		DB.Model(&PostLike{}).Where("post_id = ?", p.ID).Count(&likeCount)

		// Is liked by current user
		var isLiked int64
		DB.Model(&PostLike{}).Where("post_id = ? AND user_id = ?", p.ID, currentUser.ID).Count(&isLiked)

		// Comment count
		var commentCount int64
		DB.Model(&PostComment{}).Where("post_id = ?", p.ID).Count(&commentCount)

		// Latest 3 comments
		var comments []PostComment
		DB.Where("post_id = ?", p.ID).Order("created_at DESC").Limit(3).Find(&comments)

		commentDTOs := []CommentDTO{}
		for _, cm := range comments {
			var cmAuthor User
			DB.First(&cmAuthor, cm.UserID)
			commentDTOs = append(commentDTOs, CommentDTO{
				ID:         cm.ID,
				UserID:     cm.UserID,
				Username:   cmAuthor.Username,
				Nama:       cmAuthor.Nama,
				ProfilePic: cmAuthor.ProfilePic,
				Text:       cm.Text,
				Timestamp:  cm.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
			})
		}

		result = append(result, PostDTO{
			ID:           p.ID,
			Text:         p.Text,
			Image:        p.Image,
			Timestamp:    p.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
			UserID:       author.ID,
			Username:     author.Username,
			Nama:         author.Nama,
			ProfilePic:   author.ProfilePic,
			LikeCount:    likeCount,
			CommentCount: commentCount,
			IsLiked:      isLiked > 0,
			Comments:     commentDTOs,
		})
	}

	c.JSON(http.StatusOK, gin.H{"feed": result})
}

// POST /post/:id/like — toggle like
func PostLikeHandler(c *gin.Context) {
	currentUser := c.MustGet("user").(User)
	idStr := c.Param("id")
	postID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var existing PostLike
	err = DB.Where("post_id = ? AND user_id = ?", postID, currentUser.ID).First(&existing).Error
	if err == nil {
		// Already liked — unlike
		DB.Delete(&existing)
		c.JSON(http.StatusOK, gin.H{"liked": false})
	} else {
		// Not liked — like
		DB.Create(&PostLike{PostID: uint(postID), UserID: currentUser.ID})
		c.JSON(http.StatusOK, gin.H{"liked": true})
	}
}

// GET /post/:id/comments — get all comments for a post
func PostCommentsGetHandler(c *gin.Context) {
	currentUser := c.MustGet("user").(User)
	_ = currentUser

	idStr := c.Param("id")
	postID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var comments []PostComment
	DB.Where("post_id = ?", postID).Order("created_at ASC").Find(&comments)

	type CommentDTO struct {
		ID         uint   `json:"id"`
		UserID     uint   `json:"user_id"`
		Username   string `json:"username"`
		Nama       string `json:"nama"`
		ProfilePic string `json:"profile_pic"`
		Text       string `json:"text"`
		Timestamp  string `json:"timestamp"`
	}

	result := []CommentDTO{}
	for _, cm := range comments {
		var author User
		DB.First(&author, cm.UserID)
		result = append(result, CommentDTO{
			ID:         cm.ID,
			UserID:     cm.UserID,
			Username:   author.Username,
			Nama:       author.Nama,
			ProfilePic: author.ProfilePic,
			Text:       cm.Text,
			Timestamp:  cm.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, gin.H{"comments": result})
}

// POST /post/:id/comment — add comment
func PostCommentCreateHandler(c *gin.Context) {
	currentUser := c.MustGet("user").(User)
	idStr := c.Param("id")
	postID, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post ID"})
		return
	}

	var input struct {
		Text string `json:"text" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cm := PostComment{
		PostID: uint(postID),
		UserID: currentUser.ID,
		Text:   input.Text,
	}
	DB.Create(&cm)

	c.JSON(http.StatusOK, gin.H{"comment": gin.H{
		"id":          cm.ID,
		"user_id":     currentUser.ID,
		"username":    currentUser.Username,
		"nama":        currentUser.Nama,
		"profile_pic": currentUser.ProfilePic,
		"text":        cm.Text,
		"timestamp":   cm.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
	}})
}

// POST /post/create — create a new post (also used in handlers_social.go but put here for feed)
// (this is already in handlers_social.go — skip if duplicate)
