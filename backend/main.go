package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := ValidateJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		var user User
		if err := DB.Where("username = ?", claims.Username).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		c.Set("user", user)
		c.Next()
	}
}

func main() {
	ConnectDatabase()

	r := gin.Default()

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		api.POST("/register", func(c *gin.Context) {
			var input struct {
				Username string `json:"username" binding:"required"`
				Password string `json:"password" binding:"required"`
				Nama     string `json:"nama" binding:"required"`
			}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			var count int64
			DB.Model(&User{}).Where("username = ?", input.Username).Count(&count)
			if count > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Username already taken"})
				return
			}

			hashedPassword, _ := HashPassword(input.Password)
			user := User{Username: input.Username, PasswordHash: hashedPassword, Nama: input.Nama}
			DB.Create(&user)

			c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
		})

		api.POST("/login", func(c *gin.Context) {
			var input struct {
				Username string `json:"username" binding:"required"`
				Password string `json:"password" binding:"required"`
			}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			var user User
			if err := DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
				return
			}

			if !CheckPasswordHash(input.Password, user.PasswordHash) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
				return
			}

			token, err := GenerateJWT(user.Username)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
				return
			}

			c.JSON(http.StatusOK, gin.H{"token": token, "user": gin.H{"username": user.Username, "nama": user.Nama, "role": user.Role}})
		})

		api.POST("/google-login", func(c *gin.Context) {
			var input struct {
				AccessToken string `json:"access_token" binding:"required"`
			}
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Access token is required"})
				return
			}

			// Verify token with Google
			req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
			req.Header.Add("Authorization", "Bearer "+input.AccessToken)
			resp, err := http.DefaultClient.Do(req)
			if err != nil || resp.StatusCode != 200 {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token"})
				return
			}
			defer resp.Body.Close()

			body, _ := io.ReadAll(resp.Body)
			var googleUser struct {
				Email string `json:"email"`
				Name  string `json:"name"`
			}
			json.Unmarshal(body, &googleUser)

			if googleUser.Email == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to get email from Google"})
				return
			}

			var user User
			if err := DB.Where("username = ?", googleUser.Email).First(&user).Error; err != nil {
				// Create user if not exists
				user = User{Username: googleUser.Email, Nama: googleUser.Name, PasswordHash: "google-oauth-dummy", Role: "user"}
				DB.Create(&user)
			}

			token, err := GenerateJWT(user.Username)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate internal token"})
				return
			}

			c.JSON(http.StatusOK, gin.H{"token": token, "user": gin.H{"username": user.Username, "nama": user.Nama, "role": user.Role}})
		})

		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		{
			protected.GET("/dashboard", func(c *gin.Context) {
				user := c.MustGet("user").(User)

				var prediction Prediction
				err := DB.Where("user_id = ?", user.ID).Order("timestamp desc").First(&prediction).Error
				if err != nil {
					c.JSON(http.StatusOK, gin.H{"prediction": nil})
					return
				}

				c.JSON(http.StatusOK, gin.H{"prediction": prediction})
			})

			protected.GET("/assessment", func(c *gin.Context) {
				questions, orderType := getQuestions()
				c.JSON(http.StatusOK, gin.H{"questions": questions, "order_type": orderType})
			})

			protected.POST("/assessment/submit", func(c *gin.Context) {
				user := c.MustGet("user").(User)

				var input struct {
					OrderType string     `json:"order_type"`
					Responses []Response `json:"responses"`
				}
				if err := c.ShouldBindJSON(&input); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}

				fScore, cScore, eScore, iScore := calculateQuantumParameters(input.Responses)

				responsesJSON, _ := json.Marshal(input.Responses)
				assessment := Assessment{
					UserID:            user.ID,
					OrderType:         input.OrderType,
					ResponsesJSON:     string(responsesJSON),
					InterferenceScore: iScore,
					FatigueScore:      fScore,
					CynicismScore:     cScore,
					EfficacyScore:     eScore,
				}
				DB.Create(&assessment)

				var recentCurhats []Curhat
				DB.Where("user_id = ?", user.ID).Order("timestamp desc").Limit(5).Find(&recentCurhats)

				avgStress := 0.0
				if len(recentCurhats) > 0 {
					for _, curhat := range recentCurhats {
						avgStress += curhat.StressScore
					}
					avgStress /= float64(len(recentCurhats))
				}

				bScore, pScore, risk := predictBurnout(fScore, cScore, eScore, iScore, avgStress)

				prediction := Prediction{
					UserID:             user.ID,
					BurnoutScore:       bScore,
					PsychosomaticScore: pScore,
					RiskLevel:          risk,
				}
				DB.Create(&prediction)

				c.JSON(http.StatusOK, gin.H{
					"status": "success", 
					"prediction_id": prediction.ID, 
					"risk_level": risk,
					"burnout_score": bScore,
					"psychosomatic_score": pScore,
				})
			})

			protected.GET("/gosip", func(c *gin.Context) {
				var curhats []Curhat
				DB.Preload("Replies").Order("timestamp desc").Limit(20).Find(&curhats)
				c.JSON(http.StatusOK, gin.H{"curhats": curhats})
			})

			protected.POST("/curhat/submit", func(c *gin.Context) {
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
			})

			protected.POST("/curhat/:id/reply", func(c *gin.Context) {
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
			})

			protected.GET("/notifications/unread", func(c *gin.Context) {
				user := c.MustGet("user").(User)
				var notifications []Notification
				DB.Where("user_id = ? AND is_read = ?", user.ID, false).Order("created_at desc").Find(&notifications)
				c.JSON(http.StatusOK, gin.H{"notifications": notifications})
			})

			protected.POST("/notifications/:id/read", func(c *gin.Context) {
				user := c.MustGet("user").(User)
				notifID := c.Param("id")

				var notification Notification
				if err := DB.Where("id = ? AND user_id = ?", notifID, user.ID).First(&notification).Error; err != nil {
					c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
					return
				}

				notification.IsRead = true
				DB.Save(&notification)

				c.JSON(http.StatusOK, gin.H{"status": "success"})
			})

			protected.GET("/user/curhat", func(c *gin.Context) {
				user := c.MustGet("user").(User)
				var curhats []Curhat
				DB.Where("user_id = ?", user.ID).Order("timestamp asc").Find(&curhats)
				c.JSON(http.StatusOK, gin.H{"curhats": curhats})
			})

			protected.GET("/user/notifications", func(c *gin.Context) {
				user := c.MustGet("user").(User)
				var recommendations []TherapyRecommendation
				DB.Where("user_id = ?", user.ID).Order("created_at desc").Find(&recommendations)
				c.JSON(http.StatusOK, gin.H{"notifications": recommendations})
			})
			
			protected.GET("/terapi", func(c *gin.Context) {
				user := c.MustGet("user").(User)

				var prediction Prediction
				err := DB.Where("user_id = ?", user.ID).Order("timestamp desc").First(&prediction).Error
				riskLevel := "Low"
				if err == nil {
					riskLevel = prediction.RiskLevel
				}

				c.JSON(http.StatusOK, gin.H{"risk_level": riskLevel})
			})

			protected.GET("/responden", func(c *gin.Context) {
				var users []User
				if err := DB.Preload("Predictions", func(db *gorm.DB) *gorm.DB {
					return db.Order("timestamp DESC")
				}).Find(&users).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch respondents"})
					return
				}

				type RespondenDTO struct {
					ID                 uint      `json:"id"`
					Nama               string    `json:"nama"`
					Username           string    `json:"username"`
					LatestBurnout      float64   `json:"latest_burnout"`
					LatestRisk         string    `json:"latest_risk"`
					LatestPsychosomatic float64   `json:"latest_psychosomatic"`
					LastActivity       time.Time `json:"last_activity"`
				}

				var result []RespondenDTO
				for _, u := range users {
					if u.Role == "admin" {
						continue
					}
					
					dto := RespondenDTO{
						ID:       u.ID,
						Nama:     u.Nama,
						Username: u.Username,
					}
					
					if len(u.Predictions) > 0 {
						latest := u.Predictions[0]
						dto.LatestBurnout = latest.BurnoutScore
						dto.LatestRisk = latest.RiskLevel
						dto.LatestPsychosomatic = latest.PsychosomaticScore
						dto.LastActivity = latest.Timestamp
					}
					
					result = append(result, dto)
				}

				c.JSON(http.StatusOK, gin.H{"respondents": result})
			})

			protected.GET("/responden/:id/history", func(c *gin.Context) {
				id := c.Param("id")
				var predictions []Prediction
				if err := DB.Where("user_id = ?", id).Order("timestamp DESC").Find(&predictions).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
					return
				}

				var assessments []Assessment
				if err := DB.Where("user_id = ?", id).Order("timestamp DESC").Find(&assessments).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assessments"})
					return
				}

				c.JSON(http.StatusOK, gin.H{
					"predictions": predictions,
					"assessments": assessments,
				})
			})

			protected.GET("/user/history", func(c *gin.Context) {
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
			})

			// --- New Profile & Network Endpoints ---

			protected.GET("/user/profile", func(c *gin.Context) {
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
			})

			protected.PUT("/user/profile", func(c *gin.Context) {
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
			})

			protected.GET("/network/users", func(c *gin.Context) {
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
			})

			protected.POST("/network/follow/:id", func(c *gin.Context) {
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
			})

			protected.POST("/network/affinity/:id", func(c *gin.Context) {
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
			})

			protected.GET("/admin/analytics", func(c *gin.Context) {
				user := c.MustGet("user").(User)
				if user.Role != "admin" {
					c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
					return
				}

				var users []User
				if err := DB.Preload("Predictions", func(db *gorm.DB) *gorm.DB {
					return db.Order("timestamp DESC")
				}).Find(&users).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
					return
				}

				totalRespondents := 0
				var sumBurnout float64
				highRiskCount := 0
				
				burnoutCounts := map[string]int{"Rendah": 0, "Sedang": 0, "Tinggi": 0}
				psychoCounts := map[string]int{"Rendah": 0, "Sedang": 0, "Tinggi": 0}

				type ScatterPoint struct {
					X float64 `json:"x"`
					Y float64 `json:"y"`
				}
				var scatterData []ScatterPoint

				for _, u := range users {
					if u.Role == "admin" {
						continue
					}
					totalRespondents++
					if len(u.Predictions) > 0 {
						latest := u.Predictions[0]
						sumBurnout += latest.BurnoutScore
						if latest.RiskLevel == "High" {
							highRiskCount++
						}
						
						if latest.BurnoutScore < 34 {
							burnoutCounts["Rendah"]++
						} else if latest.BurnoutScore < 67 {
							burnoutCounts["Sedang"]++
						} else {
							burnoutCounts["Tinggi"]++
						}

						if latest.PsychosomaticScore < 34 {
							psychoCounts["Rendah"]++
						} else if latest.PsychosomaticScore < 67 {
							psychoCounts["Sedang"]++
						} else {
							psychoCounts["Tinggi"]++
						}

						scatterData = append(scatterData, ScatterPoint{
							X: latest.PsychosomaticScore,
							Y: latest.BurnoutScore,
						})
					}
				}

				var avgBurnout float64
				if totalRespondents > 0 {
					avgBurnout = sumBurnout / float64(totalRespondents)
				}

				var totalPredictions int64
				DB.Model(&Prediction{}).Count(&totalPredictions)

				// Trend calculation
				var allPreds []Prediction
				DB.Order("timestamp ASC").Find(&allPreds)
				
				dateGroups := make(map[string][]float64)
				var orderedDates []string
				for _, p := range allPreds {
					dateStr := p.Timestamp.Format("02 Jan")
					if len(dateGroups[dateStr]) == 0 {
						orderedDates = append(orderedDates, dateStr)
					}
					dateGroups[dateStr] = append(dateGroups[dateStr], p.BurnoutScore)
				}

				type TrendDay struct {
					Date      string  `json:"date"`
					Semua     float64 `json:"semua"`
					Mahasiswa float64 `json:"mahasiswa"`
					Karyawan  float64 `json:"karyawan"`
				}
				var trendData []TrendDay
				
				for _, d := range orderedDates {
					scores := dateGroups[d]
					sum := 0.0
					for _, s := range scores { sum += s }
					avg := sum / float64(len(scores))
					
					trendData = append(trendData, TrendDay{
						Date: d,
						Semua: avg,
						Mahasiswa: avg + 5.0, // Mocked offset for UI
						Karyawan: avg - 3.0,  // Mocked offset for UI
					})
				}

				if len(trendData) > 10 {
					trendData = trendData[len(trendData)-10:] // Keep last 10 days
				}

				c.JSON(http.StatusOK, gin.H{
					"totalRespondents": totalRespondents,
					"avgBurnout": avgBurnout,
					"highRiskCount": highRiskCount,
					"totalPredictions": totalPredictions,
					"burnoutDist": burnoutCounts,
					"psychoDist": psychoCounts,
					"scatterData": scatterData,
					"trendData": trendData,
				})
			})

		}
	}

	r.Run(":8080")
}
