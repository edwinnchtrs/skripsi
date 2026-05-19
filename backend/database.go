package main

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "3306")
	user := getEnv("DB_USER", "root")
	pass := getEnv("DB_PASS", "")
	name := getEnv("DB_NAME", "nexusmind")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, pass, host, port, name)

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to MySQL database!", err)
	}

	log.Println("Connected to MySQL database:", name)

	err = database.AutoMigrate(
		&User{},
		&Assessment{},
		&MBTIResult{},
		&Curhat{},
		&CurhatReply{},
		&Notification{},
		&GossipReact{},
		&Prediction{},
		&TherapyRecommendation{},
		&TreatmentReply{},
		&Follow{},
		&Affinity{},
		&Message{},
		&SystemConfig{},
		&Post{},
		&PostLike{},
		&PostComment{},
		&UserFilm{},
		&FilmWatchEvent{},
		&FilmRecommendation{},
	)
	if err != nil {
		log.Fatal("Failed to auto migrate database!", err)
	}

	DB = database

	SeedAdmin()
	NormalizeSystemConfig()
	backfillLegacyQuantumMetrics()
}

func SeedAdmin() {
	var admin User
	if err := DB.Where("username = ?", "admin").First(&admin).Error; err != nil {
		// Admin not found, let's create one
		hashedPassword, _ := HashPassword("admin123")
		newAdmin := User{
			Username:     "admin",
			PasswordHash: hashedPassword,
			Nama:         "Administrator",
			Role:         "admin",
		}
		DB.Create(&newAdmin)
		log.Println("Admin user created successfully (username: admin, password: admin123).")
	} else {
		// Admin exists, update password and role to ensure it works
		hashedPassword, _ := HashPassword("admin123")
		DB.Model(&admin).Updates(map[string]interface{}{
			"password_hash": hashedPassword,
			"role":          "admin",
			"user_type":     "karyawan",
		})
		log.Println("Admin user updated to ensure login works (username: admin, password: admin123).")
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func NormalizeSystemConfig() {
	var config SystemConfig
	if err := DB.First(&config).Error; err != nil {
		DB.Create(&SystemConfig{
			BurnoutThresholdLow:    4,
			BurnoutThresholdMedium: 6,
			PsychoThresholdLow:     4,
			PsychoThresholdMedium:  6,
		})
		return
	}

	if config.BurnoutThresholdLow > 10 || config.BurnoutThresholdMedium > 10 ||
		config.PsychoThresholdLow > 10 || config.PsychoThresholdMedium > 10 {
		DB.Model(&config).Updates(map[string]interface{}{
			"burnout_threshold_low":    4,
			"burnout_threshold_medium": 6,
			"psycho_threshold_low":     4,
			"psycho_threshold_medium":  6,
		})
	}
}
