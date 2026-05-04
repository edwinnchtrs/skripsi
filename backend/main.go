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
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

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
				DB.Order("timestamp desc").Limit(20).Find(&curhats)
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

				stressScore := analyzeStressLevel(input.Text)

				curhat := Curhat{
					UserID:      user.ID,
					Text:        input.Text,
					StressScore: stressScore,
					IsAnonymous: true,
				}
				DB.Create(&curhat)

				c.JSON(http.StatusOK, gin.H{"status": "success", "curhat": curhat})
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
		}
	}

	r.Run(":8080")
}
