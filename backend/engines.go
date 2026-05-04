package main

import (
	"crypto/md5"
	"encoding/hex"
	"math"
	"regexp"
	"strings"
)

// --- NLP Engine ---
var stressLexicon = map[string]float64{
	"lelah": 0.8, "capek": 0.7, "pusing": 0.6, "muak": 0.9, "benci": 0.8,
	"burnout": 1.0, "stres": 0.9, "gila": 0.7, "hancur": 0.8, "nangis": 0.7,
	"beban": 0.6, "berat": 0.5, "resign": 0.9, "malas": 0.5, "bosan": 0.4,
}

var positiveLexicon = map[string]float64{
	"senang": 0.8, "bahagia": 0.9, "semangat": 0.8, "bisa": 0.5,
	"selesai": 0.4, "aman": 0.5, "lancar": 0.6,
}

func analyzeStressLevel(text string) float64 {
	if text == "" {
		return 0.0
	}
	text = strings.ToLower(text)
	re := regexp.MustCompile(`\b\w+\b`)
	words := re.FindAllString(text, -1)
	if len(words) == 0 {
		return 0.0
	}

	var stressWeight, positiveWeight float64
	for _, word := range words {
		if val, ok := stressLexicon[word]; ok {
			stressWeight += val
		}
		if val, ok := positiveLexicon[word]; ok {
			positiveWeight += val
		}
	}

	totalWords := float64(len(words))
	stressDensity := stressWeight / totalWords
	positiveDensity := positiveWeight / totalWords

	score := (stressDensity * 2.5) - positiveDensity
	if score > 1.0 {
		return 1.0
	} else if score < 0.0 {
		return 0.0
	}
	return score
}

// --- Quantum Engine ---
type Question struct {
	ID            string `json:"id"`
	Text          string `json:"text"`
	ConstructType string `json:"construct_type"`
}

type Response struct {
	ID             string `json:"id"`
	ConstructType  string `json:"construct_type"`
	Value          int    `json:"value"`
	ReactionTimeMs int    `json:"reaction_time_ms"`
}

// We won't strictly randomize in backend if frontend fetches it, but we can provide the list
func getQuestions() ([]Question, string) {
	questions := []Question{
		{ID: "q1", Text: "Saya merasa lelah secara emosional karena pekerjaan/kuliah.", ConstructType: "fatigue"},
		{ID: "q2", Text: "Saya merasa kurang peduli dengan rekan kerja/teman.", ConstructType: "cynicism"},
		{ID: "q3", Text: "Saya merasa mampu menyelesaikan masalah dengan baik.", ConstructType: "efficacy"},
		{ID: "q4", Text: "Terbayang bayang kegagalan sebelumnya.", ConstructType: "fatigue"},
		{ID: "q5", Text: "Terkadang saya merasa ragu pada kemampuan saya sendiri.", ConstructType: "efficacy"},
	}
	// order_type string
	hash := md5.Sum([]byte("default-order"))
	return questions, hex.EncodeToString(hash[:])
}

func calculateQuantumParameters(responses []Response) (float64, float64, float64, float64) {
	if len(responses) == 0 {
		return 0, 0, 0, 0
	}

	var fatigueSum, cynicismSum, efficacySum, rTimeSum float64
	var fCount, cCount, eCount float64

	var reactionTimes []float64

	for _, r := range responses {
		val := float64(r.Value)
		switch r.ConstructType {
		case "fatigue":
			fatigueSum += val
			fCount++
		case "cynicism":
			cynicismSum += val
			cCount++
		case "efficacy":
			efficacySum += (6.0 - val) // reverse score
			eCount++
		}
		rt := float64(r.ReactionTimeMs)
		if rt == 0 {
			rt = 1000
		}
		reactionTimes = append(reactionTimes, rt)
		rTimeSum += rt
	}

	fScore := 0.0
	if fCount > 0 {
		fScore = fatigueSum / fCount
	}
	cScore := 0.0
	if cCount > 0 {
		cScore = cynicismSum / cCount
	}
	eScore := 0.0
	if eCount > 0 {
		eScore = efficacySum / eCount
	}

	avgRT := 1.0
	if len(reactionTimes) > 0 {
		avgRT = rTimeSum / float64(len(reactionTimes))
	}
	rtVariance := 0.0
	for _, rt := range reactionTimes {
		rtVariance += (rt - avgRT) * (rt - avgRT)
	}
	if len(reactionTimes) > 0 {
		rtVariance /= float64(len(reactionTimes))
	}

	iScore := math.Log1p(rtVariance) / 10.0

	return fScore, cScore, eScore, iScore
}

// --- Regression Engine ---
func predictBurnout(fatigue, cynicism, efficacy, interference, nlpStress float64) (float64, float64, string) {
	// Simple manual dot product based on the dummy Python model
	// Features: [fatigue, cynicism, efficacy, interference, nlpStress]
	// Since the python model was basically fitting random points, we will approximate a logical linear weighting
	// Burnout = 0.4*fatigue + 0.3*cynicism - 0.2*efficacy + 0.1*interference + 0.5*nlpStress
	
	burnoutScore := (0.4 * fatigue) + (0.3 * cynicism) + (0.2 * (5.0 - efficacy)) + (0.1 * interference) + (2.0 * nlpStress)
	if burnoutScore < 0 {
		burnoutScore = 0
	} else if burnoutScore > 10 {
		burnoutScore = 10
	}

	psychosomaticScore := (burnoutScore * 0.8) + (interference * 1.5)
	if psychosomaticScore < 0 {
		psychosomaticScore = 0
	} else if psychosomaticScore > 10 {
		psychosomaticScore = 10
	}

	riskLevel := "Low"
	if burnoutScore > 7.5 {
		riskLevel = "Crisis"
	} else if burnoutScore > 6.0 {
		riskLevel = "High"
	} else if burnoutScore > 4.0 {
		riskLevel = "Medium"
	}

	return burnoutScore, psychosomaticScore, riskLevel
}
