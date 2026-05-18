package main

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username               string `gorm:"uniqueIndex;size:191"`
	PasswordHash           string
	Nama                   string
	Role                   string `gorm:"default:user"`
	UserType               string `gorm:"size:32;default:mahasiswa"`
	Bio                    string
	ProfilePic             string
	Assessments            []Assessment
	Curhats                []Curhat
	Predictions            []Prediction
	TherapyRecommendations []TherapyRecommendation
}

type Follow struct {
	gorm.Model
	FollowerID  uint `gorm:"index"`
	FollowingID uint `gorm:"index"`
}

type Affinity struct {
	gorm.Model
	UserID       uint   `gorm:"index"`
	TargetUserID uint   `gorm:"index"`
	Type         string // teman, saudara, pacar
}

type Assessment struct {
	gorm.Model
	UserID                   uint
	OrderType                string
	ResponsesJSON            string
	InterferenceScore        float64
	OrderEffectScore         float64
	CognitiveDissonanceScore float64
	FatigueScore             float64
	CynicismScore            float64
	EfficacyScore            float64
	NLPStressScore           float64
	Timestamp                time.Time `gorm:"autoCreateTime"`
}

type Curhat struct {
	gorm.Model
	UserID      uint
	User        User `gorm:"foreignKey:UserID"`
	IsAnonymous bool `gorm:"default:true"`
	Text        string
	Image       string
	StressScore float64
	AIResponse  string
	Timestamp   time.Time `gorm:"autoCreateTime"`
	Replies     []CurhatReply
}

type GossipReact struct {
	gorm.Model
	CurhatID  uint
	UserID    uint
	ReactType string
}

type Prediction struct {
	gorm.Model
	AssessmentID           uint `gorm:"index"`
	UserID                 uint
	BurnoutScore           float64
	PsychosomaticScore     float64
	RiskLevel              string
	ModelVersion           string
	Timestamp              time.Time `gorm:"autoCreateTime"`
	TherapyRecommendations []TherapyRecommendation
}

type TherapyRecommendation struct {
	gorm.Model
	UserID       uint
	PredictionID uint
	ModuleName   string
	Category     string `gorm:"default:general"`
	Priority     string `gorm:"default:medium"`
	Duration     string `gorm:"default:1_week"`
	FollowUpDate *time.Time
	Status       string `gorm:"default:pending"`
	Replies      []TreatmentReply
}

type TreatmentReply struct {
	gorm.Model
	TherapyRecommendationID uint
	UserID                  uint
	Text                    string
	Mood                    string
	AdminSeen               bool `gorm:"default:false"`
}

type CurhatReply struct {
	gorm.Model
	CurhatID uint
	UserID   uint // if 0, maybe anonymous? We will keep it but still anonymous display
	Text     string
}

type Notification struct {
	gorm.Model
	UserID  uint
	Type    string
	Message string
	IsRead  bool `gorm:"default:false"`
}

type Message struct {
	gorm.Model
	SenderID   uint      `json:"SenderID"`
	ReceiverID uint      `json:"ReceiverID"`
	Text       string    `json:"Text"`
	Timestamp  time.Time `gorm:"autoCreateTime" json:"Timestamp"`
}

type Post struct {
	gorm.Model
	UserID    uint `gorm:"index"`
	Text      string
	Image     string
	Timestamp time.Time `gorm:"autoCreateTime"`
	Likes     []PostLike
	Comments  []PostComment
}

type PostLike struct {
	gorm.Model
	PostID uint `gorm:"index"`
	UserID uint `gorm:"index"`
}

type PostComment struct {
	gorm.Model
	PostID    uint `gorm:"index"`
	UserID    uint `gorm:"index"`
	Text      string
	Timestamp time.Time `gorm:"autoCreateTime"`
}

type SystemConfig struct {
	gorm.Model
	BurnoutThresholdLow    float64 `gorm:"default:4"`
	BurnoutThresholdMedium float64 `gorm:"default:6"`
	PsychoThresholdLow     float64 `gorm:"default:4"`
	PsychoThresholdMedium  float64 `gorm:"default:6"`
	InterferenceWeight     float64 `gorm:"default:1.0"`
	EarlyWarningEnabled    bool    `gorm:"default:true"`
	EarlyWarningThreshold  float64 `gorm:"default:0.7"`
	MaintenanceMode        bool    `gorm:"default:false"`
	MaxAssessmentPerDay    int     `gorm:"default:3"`
	AIResponseEnabled      bool    `gorm:"default:true"`
	NotificationRetention  int     `gorm:"default:30"`
	DataRetentionDays      int     `gorm:"default:365"`
	ModelVersion           string  `gorm:"default:1.0.0"`
	AppName                string  `gorm:"default:QC Analytics"`
}
