package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func CurhatSubmitHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	config := getSystemConfig()
	if userActionBlockedByMaintenance(user, config) {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Sistem sedang dalam mode pemeliharaan"})
		return
	}
	var input struct {
		Text string `json:"text" binding:"required"`
		Mode string `json:"mode"`
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
	aiResponse := "Respon otomatis sedang dinonaktifkan oleh admin. Pesan Anda tetap tersimpan dengan aman."
	aiMode := normalizeCurhatAIMode(input.Mode)
	analysis := analyzeCurhatClinicalSignals(input.Text, history, initialStress)
	if config.AIResponseEnabled {
		aiResponse, analysis = generateCurhatClinicalResponse(input.Text, history, initialStress, aiMode)
	}

	redFlagsJSON, _ := json.Marshal(analysis.RedFlags)
	recommendationsJSON, _ := json.Marshal(analysis.Recommendations)
	userNextStepsJSON, _ := json.Marshal(analysis.UserNextSteps)
	curhat := Curhat{
		UserID:              user.ID,
		Text:                input.Text,
		StressScore:         analysis.StressScore,
		BurnoutScore:        analysis.BurnoutScore,
		PsychosomaticScore:  analysis.PsychosomaticScore,
		RiskLevel:           analysis.RiskLevel,
		AnalysisConfidence:  analysis.Confidence,
		CrisisFlag:          analysis.CrisisFlag,
		AdminPriority:       analysis.AdminPriority,
		AdminStatus:         "new",
		AdminSummary:        analysis.AdminSummary,
		RedFlagsJSON:        string(redFlagsJSON),
		RecommendationsJSON: string(recommendationsJSON),
		UserNextStepsJSON:   string(userNextStepsJSON),
		AnalysisSource:      analysis.Source,
		AIMode:              aiMode,
		IsAnonymous:         true,
		AIResponse:          aiResponse,
	}
	DB.Create(&curhat)
	notifyAdminsForCurhatAnalysis(user, curhat, analysis)
	createCurhatTreatmentIfNeeded(user, curhat, analysis)

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

func AdminCurhatAnalysisHandler(c *gin.Context) {
	status := strings.TrimSpace(c.Query("status"))
	priority := strings.TrimSpace(c.Query("priority"))
	risk := strings.TrimSpace(c.Query("risk"))

	query := DB.Model(&Curhat{}).Where("risk_level <> ''")
	if status != "" && status != "all" {
		query = query.Where("admin_status = ?", status)
	}
	if priority != "" && priority != "all" {
		query = query.Where("admin_priority = ?", priority)
	}
	if risk != "" && risk != "all" {
		query = query.Where("risk_level = ?", risk)
	}

	var curhats []Curhat
	if err := query.Order("created_at DESC").Limit(120).Find(&curhats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat analisis curhat"})
		return
	}

	type AdminCurhatDTO struct {
		ID                 uint     `json:"id"`
		UserID             uint     `json:"user_id"`
		UserName           string   `json:"user_name"`
		Username           string   `json:"username"`
		Text               string   `json:"text"`
		AIResponse         string   `json:"ai_response"`
		StressScore        float64  `json:"stress_score"`
		BurnoutScore       float64  `json:"burnout_score"`
		PsychosomaticScore float64  `json:"psychosomatic_score"`
		RiskLevel          string   `json:"risk_level"`
		Confidence         float64  `json:"confidence"`
		CrisisFlag         bool     `json:"crisis_flag"`
		AdminPriority      string   `json:"admin_priority"`
		AdminStatus        string   `json:"admin_status"`
		AdminSummary       string   `json:"admin_summary"`
		RedFlags           []string `json:"red_flags"`
		Recommendations    []string `json:"recommendations"`
		AnalysisSource     string   `json:"analysis_source"`
		AIMode             string   `json:"ai_mode"`
		CreatedAt          string   `json:"created_at"`
	}

	result := []AdminCurhatDTO{}
	for _, item := range curhats {
		var user User
		DB.First(&user, item.UserID)
		redFlags := []string{}
		recommendations := []string{}
		_ = json.Unmarshal([]byte(item.RedFlagsJSON), &redFlags)
		_ = json.Unmarshal([]byte(item.RecommendationsJSON), &recommendations)
		result = append(result, AdminCurhatDTO{
			ID:                 item.ID,
			UserID:             item.UserID,
			UserName:           user.Nama,
			Username:           user.Username,
			Text:               item.Text,
			AIResponse:         item.AIResponse,
			StressScore:        item.StressScore,
			BurnoutScore:       item.BurnoutScore,
			PsychosomaticScore: item.PsychosomaticScore,
			RiskLevel:          item.RiskLevel,
			Confidence:         item.AnalysisConfidence,
			CrisisFlag:         item.CrisisFlag,
			AdminPriority:      item.AdminPriority,
			AdminStatus:        item.AdminStatus,
			AdminSummary:       item.AdminSummary,
			RedFlags:           redFlags,
			Recommendations:    recommendations,
			AnalysisSource:     item.AnalysisSource,
			AIMode:             item.AIMode,
			CreatedAt:          item.CreatedAt.Format(time.RFC3339),
		})
	}

	c.JSON(http.StatusOK, gin.H{"curhats": result})
}

func AdminCurhatAnalysisStatusHandler(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status wajib diisi"})
		return
	}
	status := strings.ToLower(strings.TrimSpace(input.Status))
	if status != "new" && status != "reviewing" && status != "actioned" && status != "resolved" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid"})
		return
	}

	var curhat Curhat
	if err := DB.First(&curhat, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Analisis curhat tidak ditemukan"})
		return
	}
	curhat.AdminStatus = status
	DB.Save(&curhat)
	c.JSON(http.StatusOK, gin.H{"status": "success", "curhat": curhat})
}

func notifyAdminsForCurhatAnalysis(user User, curhat Curhat, analysis CurhatClinicalAnalysis) {
	if analysis.RiskLevel != "High" && analysis.RiskLevel != "Crisis" && !analysis.CrisisFlag {
		return
	}
	var admins []User
	DB.Where("role = ?", "admin").Find(&admins)
	for _, admin := range admins {
		DB.Create(&Notification{
			UserID:  admin.ID,
			Type:    "curhat_analysis",
			Message: fmt.Sprintf("Curhat %d memerlukan monitoring: risiko %s, prioritas %s, user %s.", curhat.ID, analysis.RiskLevel, analysis.AdminPriority, user.Nama),
		})
	}
}

func createCurhatTreatmentIfNeeded(user User, curhat Curhat, analysis CurhatClinicalAnalysis) {
	if analysis.RiskLevel != "High" && analysis.RiskLevel != "Crisis" {
		return
	}
	module := fmt.Sprintf("Monitoring curhat AI: %s\n\n%s", analysis.AdminSummary, strings.Join(analysis.Recommendations, "\n"))
	priority := "high"
	if analysis.CrisisFlag || analysis.RiskLevel == "Crisis" {
		priority = "urgent"
	}
	DB.Create(&TherapyRecommendation{
		UserID:     user.ID,
		ModuleName: truncateString(module, 1200),
		Category:   "konseling",
		Priority:   priority,
		Duration:   "1_week",
		Status:     "pending",
	})
	DB.Create(&Notification{
		UserID:  user.ID,
		Type:    "curhat_analysis",
		Message: "Analisis curhat terbaru menunjukkan kamu perlu tindak lanjut. Admin akan memantau dan saran sudah disiapkan.",
	})
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
