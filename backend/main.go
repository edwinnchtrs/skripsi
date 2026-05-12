package main

import (
	"github.com/gin-gonic/gin"
)

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
		// Auth Routes
		api.POST("/register", RegisterHandler)
		api.POST("/login", LoginHandler)
		api.POST("/google-login", GoogleLoginHandler)

		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		{
			// User Dashboard & Assessment
			protected.GET("/dashboard", UserDashboardHandler)
			protected.GET("/assessment", AssessmentGetHandler)
			protected.POST("/assessment/submit", AssessmentSubmitHandler)
			
			// Social & Profile
			protected.GET("/user/history", UserHistoryHandler)
			protected.GET("/user/profile", UserProfileGetHandler)
			protected.PUT("/user/profile", UserProfilePutHandler)
			protected.GET("/network/users", NetworkUsersHandler)
			protected.POST("/network/follow/:id", NetworkFollowHandler)
			protected.POST("/network/affinity/:id", NetworkAffinityHandler)
			
			// Curhat & Gossip
			protected.GET("/gosip", GosipGetHandler)
			protected.POST("/curhat/submit", CurhatSubmitHandler)
			protected.POST("/curhat/:id/reply", CurhatReplyHandler)
			protected.GET("/user/curhat", UserCurhatHandler)
			
			// Notifications
			protected.GET("/notifications/unread", NotificationsUnreadHandler)
			protected.POST("/notifications/:id/read", NotificationsReadHandler)
			protected.GET("/user/notifications", UserNotificationsHandler)
			
			// Therapy Recommendation
			protected.GET("/terapi", UserDashboardHandler) // Same output logic as dashboard for prediction

			// Admin Routes
			protected.GET("/responden", RespondenGetHandler)
			protected.GET("/responden/:id/history", RespondenHistoryHandler)
			
			protected.GET("/admin/users", AdminUsersGetHandler)
			protected.GET("/admin/users/:id", AdminUsersGetByIDHandler)
			protected.PUT("/admin/users/:id", AdminUsersPutHandler)
			protected.DELETE("/admin/users/:id", AdminUsersDeleteHandler)
			protected.POST("/admin/users/:id/treatment", AdminUsersTreatmentHandler)
			
			protected.GET("/admin/analytics", AdminAnalyticsHandler)
			protected.GET("/admin/config", AdminConfigGetHandler)
			protected.PUT("/admin/config", AdminConfigPutHandler)
			protected.GET("/admin/quantum", AdminQuantumHandler)
			protected.GET("/admin/model-evaluation", AdminModelEvaluationHandler)
		}
	}

	r.Run(":8080")
}
