package main

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username               string `gorm:"uniqueIndex"`
	PasswordHash           string
	Nama                   string
	Role                   string `gorm:"default:user"`
	Assessments            []Assessment
	Curhats                []Curhat
	Predictions            []Prediction
	TherapyRecommendations []TherapyRecommendation
}

type Assessment struct {
	gorm.Model
	UserID            uint
	OrderType         string
	ResponsesJSON     string
	InterferenceScore float64
	FatigueScore      float64
	CynicismScore     float64
	EfficacyScore     float64
	Timestamp         time.Time `gorm:"autoCreateTime"`
}

type Curhat struct {
	gorm.Model
	UserID      uint
	IsAnonymous bool `gorm:"default:true"`
	Text        string
	StressScore float64
	Timestamp   time.Time `gorm:"autoCreateTime"`
}

type GossipReact struct {
	gorm.Model
	CurhatID  uint
	UserID    uint
	ReactType string
}

type Prediction struct {
	gorm.Model
	UserID                 uint
	BurnoutScore           float64
	PsychosomaticScore     float64
	RiskLevel              string
	Timestamp              time.Time `gorm:"autoCreateTime"`
	TherapyRecommendations []TherapyRecommendation
}

type TherapyRecommendation struct {
	gorm.Model
	UserID       uint
	PredictionID uint
	ModuleName   string
	Status       string `gorm:"default:pending"`
}
