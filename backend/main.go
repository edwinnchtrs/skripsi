package main

import (
	"log"
	"net"
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}
	ConnectDatabase()

	r := gin.Default()

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		c.Writer.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		origin := c.Request.Header.Get("Origin")
		allowedOrigins := strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5175"), ",")
		originAllowed := isOriginAllowed(origin, allowedOrigins)

		if origin != "" && originAllowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		api.GET("/health", HealthHandler)
		api.GET("/public/overview", PublicOverviewHandler)

		// Auth Routes
		api.POST("/register", RegisterHandler)
		api.POST("/login", LoginHandler)
		api.POST("/google-login", GoogleLoginHandler)
		api.POST("/forgot-password", ForgotPasswordHandler)

		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		protected.Use(ActivityLogMiddleware())
		{
			// User Dashboard & Assessment
			protected.GET("/dashboard", UserDashboardHandler)
			protected.GET("/assessment", AssessmentGetHandler)
			protected.POST("/assessment/submit", AssessmentSubmitHandler)
			protected.GET("/mbti/questions", MBTIQuestionsHandler)
			protected.POST("/mbti/submit", MBTISubmitHandler)
			protected.GET("/user/mbti/latest", UserLatestMBTIHandler)
			protected.GET("/assistant/context", AssistantContextHandler)
			protected.POST("/assistant/chat", AssistantChatHandler)
			protected.POST("/assistant/schedule/optimize", AssistantScheduleOptimizeHandler)
			protected.GET("/cinema/discovery", CinemaDiscoveryHandler)
			protected.GET("/user/films", UserFilmsGetHandler)
			protected.POST("/user/films", UserFilmsCreateHandler)
			protected.PATCH("/user/films/:id", UserFilmsUpdateHandler)
			protected.DELETE("/user/films/:id", UserFilmsDeleteHandler)
			protected.POST("/user/films/:id/watch", UserFilmWatchEventHandler)
			protected.POST("/user/film-recommendations", UserFilmRecommendationCreateHandler)

			// Social & Profile
			protected.GET("/user/history", UserHistoryHandler)
			protected.GET("/user/risk-timeline", UserRiskTimelineHandler)
			protected.GET("/user/daily-brief", UserDailyBriefHandler)
			protected.GET("/user/recovery-plan", UserRecoveryPlanHandler)
			protected.GET("/user/checkins", UserCheckInsHandler)
			protected.POST("/user/checkins", UserCheckInCreateHandler)
			protected.GET("/user/profile", UserProfileGetHandler)
			protected.PUT("/user/profile", UserProfilePutHandler)
			protected.GET("/network/users", NetworkUsersHandler)
			protected.POST("/network/follow/:id", NetworkFollowHandler)
			protected.POST("/network/affinity/:id", NetworkAffinityHandler)
			protected.GET("/network/conversations", NetworkConversationsHandler)
			protected.GET("/network/messages/:userId", NetworkMessagesHandler)
			protected.POST("/network/messages/:userId", NetworkSendMessageHandler)
			protected.GET("/network/user/:username", NetworkUserProfileHandler)

			// Curhat & Gossip
			protected.GET("/gosip", GosipGetHandler)
			protected.POST("/curhat/submit", CurhatSubmitHandler)
			protected.POST("/curhat/:id/reply", CurhatReplyHandler)
			protected.POST("/post/create", PostCreateHandler)
			protected.GET("/user/curhat", UserCurhatHandler)

			// Feed & Post Interactions
			protected.GET("/feed", FeedGetHandler)
			protected.POST("/post/:id/like", PostLikeHandler)
			protected.GET("/post/:id/comments", PostCommentsGetHandler)
			protected.POST("/post/:id/comment", PostCommentCreateHandler)

			// Notifications
			protected.GET("/notifications/unread", NotificationsUnreadHandler)
			protected.POST("/notifications/:id/read", NotificationsReadHandler)
			protected.GET("/user/notifications", UserNotificationsHandler)
			protected.PATCH("/user/treatment/:id/status", UserTreatmentStatusHandler)
			protected.GET("/user/treatment/:id/replies", UserTreatmentRepliesHandler)
			protected.POST("/user/treatment/:id/replies", UserTreatmentReplyCreateHandler)

			// Therapy Recommendation
			protected.GET("/terapi", UserDashboardHandler) // Same output logic as dashboard for prediction

			// Admin Routes
			admin := protected.Group("/")
			admin.Use(RequireRole("admin"))
			admin.GET("/responden", RespondenGetHandler)
			admin.GET("/responden/:id/history", RespondenHistoryHandler)

			admin.GET("/admin/users", AdminUsersGetHandler)
			admin.POST("/admin/users", AdminUsersCreateHandler)
			admin.GET("/admin/users/:id", AdminUsersGetByIDHandler)
			admin.PUT("/admin/users/:id", AdminUsersPutHandler)
			admin.DELETE("/admin/users/:id", AdminUsersDeleteHandler)
			admin.POST("/admin/users/:id/treatment", AdminUsersTreatmentHandler)
			admin.GET("/admin/users/:id/treatments", AdminUserTreatmentsHandler)
			admin.GET("/admin/treatment-replies", AdminTreatmentRepliesHandler)
			admin.PATCH("/admin/treatment-replies/:id/read", AdminTreatmentReplyReadHandler)
			admin.GET("/admin/curhat-analysis", AdminCurhatAnalysisHandler)
			admin.PATCH("/admin/curhat-analysis/:id/status", AdminCurhatAnalysisStatusHandler)
			admin.GET("/admin/command-center", AdminCommandCenterHandler)
			admin.GET("/admin/launch-readiness", AdminLaunchReadinessHandler)
			admin.GET("/admin/risk-center", AdminRiskCenterHandler)
			admin.GET("/admin/users/:id/timeline", AdminUserTimelineHandler)
			admin.GET("/admin/users/:id/case-summary", AdminUserCaseSummaryHandler)
			admin.GET("/admin/users/:id/report", AdminUserReportExportHandler)
			admin.PATCH("/admin/triage/:type/:id/status", AdminTriageStatusHandler)

			admin.GET("/admin/analytics", AdminAnalyticsHandler)
			admin.GET("/admin/config", AdminConfigGetHandler)
			admin.PUT("/admin/config", AdminConfigPutHandler)
			admin.GET("/admin/quantum", AdminQuantumHandler)
			admin.GET("/admin/model-evaluation", AdminModelEvaluationV2Handler)
			admin.GET("/admin/activity-logs", AdminActivityLogsHandler)
			admin.GET("/admin/system-health", AdminSystemHealthHandler)
		}
	}

	port := getEnv("PORT", "8080")
	if !strings.HasPrefix(port, ":") {
		port = ":" + port
	}
	if err := r.Run(port); err != nil {
		_, _ = os.Stderr.WriteString(err.Error())
	}
}

func isOriginAllowed(origin string, allowedOrigins []string) bool {
	if origin == "" {
		return true
	}
	for _, allowedOrigin := range allowedOrigins {
		allowedOrigin = strings.TrimSpace(allowedOrigin)
		if allowedOrigin == "*" || allowedOrigin == origin {
			return true
		}
	}
	parsed, err := url.Parse(origin)
	if err != nil {
		return false
	}
	host := parsed.Hostname()
	if host == "localhost" || host == "127.0.0.1" || host == "::1" {
		return true
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}
	return ip.IsPrivate() || ip.IsLoopback()
}
