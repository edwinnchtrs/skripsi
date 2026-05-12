package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func UserDashboardHandler(c *gin.Context) {
	user := c.MustGet("user").(User)

	var prediction Prediction
	err := DB.Where("user_id = ?", user.ID).Order("timestamp desc").First(&prediction).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"prediction": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"prediction": prediction})
}

func AssessmentGetHandler(c *gin.Context) {
	questions, dateKey := getDailyQuestions()
	hash := md5.Sum([]byte(dateKey))
	c.JSON(http.StatusOK, gin.H{"questions": questions, "order_type": hex.EncodeToString(hash[:])})
}

func AssessmentSubmitHandler(c *gin.Context) {
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

	// Create notification for user
	var riskMsg string
	switch risk {
	case "High", "Crisis":
		riskMsg = "tinggi — segera lakukan tindakan pencegahan"
	case "Medium":
		riskMsg = "sedang — pantau kondisi Anda secara berkala"
	default:
		riskMsg = "rendah — kondisi Anda baik"
	}
	notification := Notification{
		UserID:  user.ID,
		Type:    "assessment",
		Message: fmt.Sprintf("Hasil kuisioner Anda telah dianalisis. Risiko burnout: %s. Skor: %.1f/10.", riskMsg, bScore),
	}
	DB.Create(&notification)

	// Create therapy recommendation if high risk
	if risk == "High" || risk == "Crisis" {
		therapy := TherapyRecommendation{
			UserID:       user.ID,
			PredictionID: prediction.ID,
			ModuleName:   "Modul Relaksasi & Manajemen Stres",
			Status:       "pending",
		}
		DB.Create(&therapy)
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success", 
		"prediction_id": prediction.ID, 
		"risk_level": risk,
		"burnout_score": bScore,
		"psychosomatic_score": pScore,
	})
}

func NotificationsUnreadHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	var notifications []Notification
	DB.Where("user_id = ? AND is_read = ?", user.ID, false).Order("created_at desc").Find(&notifications)
	c.JSON(http.StatusOK, gin.H{"notifications": notifications})
}

func NotificationsReadHandler(c *gin.Context) {
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
}

func UserNotificationsHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	var recommendations []TherapyRecommendation
	DB.Where("user_id = ?", user.ID).Order("created_at desc").Find(&recommendations)
	c.JSON(http.StatusOK, gin.H{"notifications": recommendations})
}
