package main

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
	"time"
)

// --- NLP Engine (Enhanced Stress Detection) ---
var stressLexicon = map[string]float64{
	// Kelelahan fisik & mental
	"lelah": 0.8, "capek": 0.7, "pusing": 0.6, "muak": 0.9, "benci": 0.8,
	"burnout": 1.0, "stres": 0.9, "gila": 0.7, "hancur": 0.8, "nangis": 0.7,
	"beban": 0.65, "berat": 0.5, "resign": 0.9, "malas": 0.5, "bosan": 0.4,
	// Keputusasaan
	"putus asa": 1.0, "menyerah": 0.9, "hopeless": 1.0, "gagal": 0.75, "sia-sia": 0.85,
	"percuma": 0.8, "tidak berguna": 0.95, "nyesel": 0.7, "sesal": 0.65, "kecewa": 0.7,
	// Kecemasan
	"cemas": 0.8, "khawatir": 0.75, "takut": 0.7, "panik": 0.85, "gelisah": 0.75,
	"tidak tenang": 0.8, "was-was": 0.7, "galau": 0.65, "bingung": 0.5,
	// Hubungan & sosial
	"lonely": 0.8, "kesepian": 0.8, "ditinggal": 0.85, "dikhianati": 0.9,
	"diabaikan": 0.85, "tidak dihargai": 0.9, "diremehkan": 0.85,
	// Pekerjaan/kuliah
	"deadline": 0.55, "lembur": 0.6, "tugas": 0.3, "ujian": 0.4, "skripsi": 0.55,
	"nilai jelek": 0.8, "dimarahi": 0.75, "dipecat": 0.95, "tekanan": 0.7,
	// Fisik
	"sakit": 0.6, "tidak tidur": 0.75, "insomnia": 0.8, "pening": 0.55,
}

var positiveLexicon = map[string]float64{
	"senang": 0.8, "bahagia": 0.9, "semangat": 0.8, "bisa": 0.4,
	"selesai": 0.5, "aman": 0.5, "lancar": 0.6, "syukur": 0.8,
	"tenang": 0.7, "damai": 0.7, "lega": 0.75, "bangga": 0.7,
	"excited": 0.7, "happy": 0.8, "sukses": 0.7, "berhasil": 0.8,
	"bersyukur": 0.85, "termotivasi": 0.8, "optimis": 0.75,
}

var curhatStressSignals = map[string]float64{
	"stres": 0.85, "stress": 0.85, "tertekan": 0.82, "tekanan": 0.72,
	"cemas": 0.72, "anxiety": 0.75, "khawatir": 0.62, "takut": 0.58,
	"panik": 0.86, "gelisah": 0.72, "overthinking": 0.74, "kepikiran": 0.58,
	"bingung": 0.46, "kacau": 0.70, "mumet": 0.64, "pusing mikirin": 0.72,
	"deadline": 0.52, "dikejar deadline": 0.76, "beban": 0.62, "berat": 0.48,
	"sendirian": 0.58, "kesepian": 0.68, "diabaikan": 0.72, "tidak dihargai": 0.74,
	"dimarahin": 0.62, "dimarahi": 0.62, "takut gagal": 0.78, "takut salah": 0.62,
	"nangis": 0.72, "menangis": 0.72, "hancur": 0.84, "berantakan": 0.66,
}

var curhatBurnoutSignals = map[string]float64{
	"burnout": 1.0, "lelah": 0.68, "capek": 0.62, "cape": 0.62, "letih": 0.58,
	"habis energi": 0.86, "energi habis": 0.86, "terkuras": 0.80, "mental drop": 0.80,
	"jenuh": 0.66, "muak": 0.76, "bosan": 0.42, "mati rasa": 0.82, "kosong": 0.68,
	"tidak sanggup": 0.92, "nggak sanggup": 0.92, "gak sanggup": 0.92, "ga sanggup": 0.92,
	"tidak kuat": 0.90, "nggak kuat": 0.90, "gak kuat": 0.90, "ga kuat": 0.90,
	"menyerah": 0.82, "pengen resign": 0.78, "ingin resign": 0.78, "resign": 0.65,
	"tidak peduli": 0.68, "masa bodo": 0.72, "bodo amat": 0.72, "hilang motivasi": 0.78,
	"tidak ada motivasi": 0.76, "malas mulai": 0.58, "susah mulai": 0.58, "tidak produktif": 0.62,
	"tidak berguna": 0.84, "percuma": 0.74, "sia sia": 0.72, "gagal terus": 0.76,
}

var curhatPsychosomaticSignals = map[string]float64{
	"psikosomatis": 0.80, "psikomatis": 0.80, "sakit kepala": 0.76, "kepala sakit": 0.76,
	"pusing": 0.62, "pening": 0.58, "migrain": 0.70, "mual": 0.64, "sakit perut": 0.66,
	"perut sakit": 0.66, "asam lambung": 0.70, "maag": 0.58, "dada sesak": 0.86,
	"sesak": 0.82, "sesak napas": 0.88, "napas berat": 0.78, "jantung berdebar": 0.86,
	"berdebar": 0.70, "gemetar": 0.70, "keringat dingin": 0.74, "tegang": 0.56,
	"nyeri": 0.54, "badan sakit": 0.58, "lemas": 0.52, "tidak tidur": 0.78,
	"susah tidur": 0.72, "insomnia": 0.78, "tidur terganggu": 0.72, "mimpi buruk": 0.58,
}

var curhatFunctionalSignals = map[string]float64{
	"tidak bisa kerja": 0.78, "gak bisa kerja": 0.78, "ga bisa kerja": 0.78,
	"tidak bisa belajar": 0.78, "gak bisa belajar": 0.78, "ga bisa belajar": 0.78,
	"susah fokus": 0.68, "tidak fokus": 0.62, "gak fokus": 0.62, "konsentrasi hilang": 0.72,
	"tidak bisa bangun": 0.74, "gak bisa bangun": 0.74, "bolos": 0.58, "absen": 0.50,
	"menunda semua": 0.66, "keteteran": 0.68, "kerjaan numpuk": 0.68, "tugas numpuk": 0.68,
	"nilai turun": 0.58, "performa turun": 0.64, "sering salah": 0.52, "menghindar": 0.56,
}

var curhatProtectiveSignals = map[string]float64{
	"lebih baik": 0.72, "membaik": 0.72, "lega": 0.68, "tenang": 0.62,
	"aman": 0.56, "terbantu": 0.64, "dibantu": 0.58, "ada dukungan": 0.64,
	"bisa istirahat": 0.58, "sudah istirahat": 0.58, "bisa tidur": 0.58,
	"masih bisa": 0.42, "mulai membaik": 0.76, "punya teman": 0.48,
}

var curhatCrisisSignals = []string{
	"bunuh diri", "akhiri hidup", "mengakhiri hidup", "mengakhiri semuanya",
	"mati aja", "ingin mati", "pengen mati", "mau mati", "lebih baik mati",
	"tidak mau hidup", "gak mau hidup", "ga mau hidup", "nggak mau hidup",
	"menyakiti diri", "nyakitin diri", "self harm", "melukai diri",
}

type weightedSignalHit struct {
	Phrase string
	Weight float64
}

type CurhatClinicalAnalysis struct {
	StressScore        float64  `json:"stress_score"`
	BurnoutScore       float64  `json:"burnout_score"`
	PsychosomaticScore float64  `json:"psychosomatic_score"`
	RiskLevel          string   `json:"risk_level"`
	Confidence         float64  `json:"confidence"`
	CrisisFlag         bool     `json:"crisis_flag"`
	AdminPriority      string   `json:"admin_priority"`
	AdminSummary       string   `json:"admin_summary"`
	RedFlags           []string `json:"red_flags"`
	Recommendations    []string `json:"recommendations"`
	UserNextSteps      []string `json:"user_next_steps"`
	Source             string   `json:"source"`
}

func analyzeStressLevel(text string) float64 {
	if text == "" {
		return 0.0
	}
	normalized := normalizeSignalText(text)
	words := regexp.MustCompile(`\b\w+\b`).FindAllString(normalized, -1)
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

	stressSignal, _ := weightedPhraseScoreDetailed(normalized, curhatStressSignals)
	functionalSignal, _ := weightedPhraseScoreDetailed(normalized, curhatFunctionalSignals)
	protectiveSignal, _ := weightedPhraseScoreDetailed(normalized, curhatProtectiveSignals)
	totalWords := float64(len(words))
	stressDensity := stressWeight / totalWords
	positiveDensity := positiveWeight / totalWords

	legacyScore := (stressDensity * 2.5) - positiveDensity
	signalScore := stressSignal + functionalSignal*0.18 - protectiveSignal*0.20
	return clampFloat(math.Max(legacyScore, signalScore), 0, 1)
}

func normalizeSignalText(text string) string {
	lower := strings.ToLower(text)
	replacements := strings.NewReplacer(
		"ngga", "nggak",
		"gk", "gak",
		"tdk", "tidak",
		"ga ", "gak ",
	)
	lower = replacements.Replace(lower)
	cleaned := regexp.MustCompile(`[^\p{L}\p{N}]+`).ReplaceAllString(lower, " ")
	return " " + strings.Join(strings.Fields(cleaned), " ") + " "
}

func weightedPhraseScoreDetailed(text string, weights map[string]float64) (float64, []weightedSignalHit) {
	normalized := normalizeSignalText(text)
	total := 0.0
	hits := []weightedSignalHit{}
	for phrase, weight := range weights {
		normalizedPhrase := strings.TrimSpace(normalizeSignalText(phrase))
		if normalizedPhrase == "" || !strings.Contains(normalized, " "+normalizedPhrase+" ") {
			continue
		}
		adjusted := weight * signalIntensityMultiplier(normalized)
		if isNegatedSignal(normalized, normalizedPhrase) {
			adjusted *= 0.18
		}
		total += adjusted
		hits = append(hits, weightedSignalHit{Phrase: phrase, Weight: adjusted})
	}
	sort.SliceStable(hits, func(i, j int) bool {
		return hits[i].Weight > hits[j].Weight
	})
	return clampFloat(total/3.0, 0, 1), hits
}

func signalIntensityMultiplier(text string) float64 {
	multiplier := 1.0
	intensifiers := map[string]float64{
		" banget ": 0.12, " sekali ": 0.10, " parah ": 0.14, " berat ": 0.08,
		" terus ": 0.10, " selalu ": 0.10, " tiap hari ": 0.16, " setiap hari ": 0.16,
		" berhari hari ": 0.16, " berminggu minggu ": 0.18, " sampai ": 0.08,
		" gak berhenti ": 0.12, " tidak berhenti ": 0.12, " makin ": 0.08,
	}
	for phrase, boost := range intensifiers {
		if strings.Contains(text, phrase) {
			multiplier += boost
		}
	}
	return clampFloat(multiplier, 0.85, 1.45)
}

func isNegatedSignal(text string, phrase string) bool {
	if strings.HasPrefix(phrase, "tidak ") || strings.HasPrefix(phrase, "gak ") || strings.HasPrefix(phrase, "nggak ") || strings.HasPrefix(phrase, "ga ") {
		return false
	}
	negations := []string{" tidak ", " gak ", " nggak ", " enggak ", " bukan ", " belum "}
	for _, negation := range negations {
		if strings.Contains(text, negation+phrase+" ") || strings.Contains(text, negation+"merasa "+phrase+" ") {
			return true
		}
	}
	return false
}

func topSignalPhrases(hits []weightedSignalHit, limit int) string {
	values := []string{}
	for _, hit := range hits {
		if hit.Weight <= 0.08 {
			continue
		}
		values = append(values, hit.Phrase)
		if len(values) >= limit {
			break
		}
	}
	return strings.Join(values, ", ")
}

func signalRedFlag(label string, detail string) string {
	detail = strings.TrimSpace(detail)
	if detail == "" {
		return label
	}
	return label + ": " + detail
}

func normalizeCurhatAIMode(mode string) string {
	switch strings.ToLower(strings.TrimSpace(mode)) {
	case "teacher", "guru":
		return "teacher"
	case "doctor", "dokter":
		return "doctor"
	case "family", "keluarga":
		return "family"
	case "friend", "teman":
		return "friend"
	default:
		return "friend"
	}
}

func curhatAIModeLabel(mode string) string {
	switch normalizeCurhatAIMode(mode) {
	case "teacher":
		return "Guru"
	case "doctor":
		return "Dokter edukatif"
	case "family":
		return "Keluarga"
	default:
		return "Teman"
	}
}

func curhatAIModeInstruction(mode string) string {
	switch normalizeCurhatAIMode(mode) {
	case "teacher":
		return "Gaya bicara seperti guru pembimbing: terstruktur, jelas, memberi peta masalah, contoh langkah kecil, dan pertanyaan refleksi singkat. Hindari menggurui."
	case "doctor":
		return "Gaya bicara seperti dokter edukatif: tenang, klinis ringan, menjelaskan sinyal tubuh dan pikiran dengan bahasa awam. Tegaskan bahwa ini bukan diagnosis dan sarankan bantuan profesional bila gejala berat atau menetap."
	case "family":
		return "Gaya bicara seperti keluarga yang hangat: protektif, lembut, menenangkan, dan mengajak user tidak sendirian. Tetap beri langkah praktis tanpa terlalu formal."
	default:
		return "Gaya bicara seperti teman dekat: santai, suportif, jujur, tidak menghakimi, dan membantu user merasa ditemani sambil tetap memberi langkah yang jelas."
	}
}

func generateCurhatClinicalResponse(text string, history []Curhat, initialStressScore float64, mode string) (string, CurhatClinicalAnalysis) {
	mode = normalizeCurhatAIMode(mode)
	local := analyzeCurhatClinicalSignals(text, history, initialStressScore)
	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		local.Source = "local"
		return fallbackCurhatResponse(local, mode), local
	}

	historyPayload := []map[string]interface{}{}
	for _, item := range history {
		historyPayload = append(historyPayload, map[string]interface{}{
			"text":                item.Text,
			"ai_mode":             item.AIMode,
			"stress_score":        item.StressScore,
			"burnout_score":       item.BurnoutScore,
			"psychosomatic_score": item.PsychosomaticScore,
			"risk_level":          item.RiskLevel,
			"ai_response":         item.AIResponse,
		})
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"message":        text,
		"ai_mode":        mode,
		"mode_label":     curhatAIModeLabel(mode),
		"local_analysis": local,
		"history":        historyPayload,
	})

	systemPrompt := fmt.Sprintf(`Kamu adalah Nexus AI untuk fitur curhat kesehatan mental. Tugasmu memberi respons empatik dan analisis operasional untuk monitoring admin.
Mode respons saat ini: %s.
%s
Jangan membuat diagnosis medis. Jangan menyuruh user menyakiti diri. Bila ada sinyal krisis, arahkan ke orang tepercaya/profesional dan bantuan darurat setempat.
Bedakan dimensi penilaian secara tajam:
- stress_score untuk tekanan emosional/kognitif akut, cemas, panik, konflik, deadline, dan kewalahan.
- burnout_score untuk kelelahan berkepanjangan, sinisme, hilang motivasi, mati rasa, merasa tidak efektif, atau ingin menjauh dari kerja/kuliah.
- psychosomatic_score untuk keluhan fisik yang muncul bersama tekanan, seperti pusing, mual, sesak, berdebar, sakit perut, nyeri, gemetar, dan gangguan tidur.
Perhatikan intensitas kata seperti banget, parah, terus, tiap hari, serta gangguan fungsi harian. Jangan menaikkan skor tinggi bila user jelas menyatakan membaik, aman, atau hanya cerita ringan.

Kembalikan JSON valid:
{
  "response": "jawaban empatik untuk user, 4-6 kalimat, Bahasa Indonesia",
  "stress_score": 0.0,
  "burnout_score": 0.0,
  "psychosomatic_score": 0.0,
  "risk_level": "Low|Medium|High|Crisis",
  "confidence": 0.0,
  "crisis_flag": false,
  "admin_priority": "low|medium|high|urgent",
  "admin_summary": "ringkasan 1 kalimat untuk admin",
  "red_flags": ["maksimal 4 sinyal"],
  "recommendations": ["maksimal 4 tindakan admin"],
  "user_next_steps": ["maksimal 4 langkah aman untuk user"]
}
Skor harus 0.0-1.0. Gunakan local_analysis sebagai batas aman, jangan menurunkan risiko jika ada red flag krisis.`, curhatAIModeLabel(mode), curhatAIModeInstruction(mode))

	requestBody, _ := json.Marshal(map[string]interface{}{
		"model": "openai/gpt-4o-mini",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": string(payload)},
		},
		"max_tokens":      850,
		"temperature":     0.35,
		"response_format": map[string]string{"type": "json_object"},
	})

	req, err := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewBuffer(requestBody))
	if err != nil {
		local.Source = "local"
		return fallbackCurhatResponse(local, mode), local
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("HTTP-Referer", "http://localhost:5173")
	req.Header.Set("X-Title", "NexusMind Curhat Analysis")

	client := &http.Client{Timeout: 18 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		local.Source = "local"
		return fallbackCurhatResponse(local, mode), local
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		local.Source = "local"
		return fallbackCurhatResponse(local, mode), local
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(body, &result); err != nil || len(result.Choices) == 0 {
		local.Source = "local"
		return fallbackCurhatResponse(local, mode), local
	}

	var ai struct {
		Response           string   `json:"response"`
		StressScore        float64  `json:"stress_score"`
		BurnoutScore       float64  `json:"burnout_score"`
		PsychosomaticScore float64  `json:"psychosomatic_score"`
		RiskLevel          string   `json:"risk_level"`
		Confidence         float64  `json:"confidence"`
		CrisisFlag         bool     `json:"crisis_flag"`
		AdminPriority      string   `json:"admin_priority"`
		AdminSummary       string   `json:"admin_summary"`
		RedFlags           []string `json:"red_flags"`
		Recommendations    []string `json:"recommendations"`
		UserNextSteps      []string `json:"user_next_steps"`
	}
	if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &ai); err != nil {
		local.Source = "local"
		return fallbackCurhatResponse(local, mode), local
	}

	analysis := CurhatClinicalAnalysis{
		StressScore:        math.Max(local.StressScore*0.88, clampFloat(ai.StressScore, 0, 1)),
		BurnoutScore:       math.Max(local.BurnoutScore*0.88, clampFloat(ai.BurnoutScore, 0, 1)),
		PsychosomaticScore: math.Max(local.PsychosomaticScore*0.88, clampFloat(ai.PsychosomaticScore, 0, 1)),
		RiskLevel:          normalizeCurhatRisk(ai.RiskLevel, local.RiskLevel),
		Confidence:         clampFloat(math.Max(local.Confidence, ai.Confidence), 0.15, 0.98),
		CrisisFlag:         local.CrisisFlag || ai.CrisisFlag,
		AdminPriority:      normalizeAdminPriority(ai.AdminPriority, local.AdminPriority),
		AdminSummary:       truncateString(firstNonEmpty(ai.AdminSummary, local.AdminSummary), 420),
		RedFlags:           sanitizeStringSlice(append(local.RedFlags, ai.RedFlags...), 4),
		Recommendations:    sanitizeStringSlice(append(ai.Recommendations, local.Recommendations...), 4),
		UserNextSteps:      sanitizeStringSlice(append(ai.UserNextSteps, local.UserNextSteps...), 4),
		Source:             "ai",
	}
	analysis.RiskLevel = strongestRisk(analysis.RiskLevel, local.RiskLevel)
	analysis.AdminPriority = priorityFromRisk(analysis.RiskLevel, analysis.CrisisFlag, analysis.AdminPriority)

	response := strings.TrimSpace(ai.Response)
	if response == "" {
		response = fallbackCurhatResponse(analysis, mode)
	}
	return response, analysis
}

func analyzeCurhatClinicalSignals(text string, history []Curhat, stress float64) CurhatClinicalAnalysis {
	lower := normalizeSignalText(text)
	wordCount := len(regexp.MustCompile(`\b\w+\b`).FindAllString(lower, -1))
	stressTerms, stressHits := weightedPhraseScoreDetailed(lower, curhatStressSignals)
	burnoutTerms, burnoutHits := weightedPhraseScoreDetailed(lower, curhatBurnoutSignals)
	psychosomaticTerms, psychosomaticHits := weightedPhraseScoreDetailed(lower, curhatPsychosomaticSignals)
	functionalTerms, functionalHits := weightedPhraseScoreDetailed(lower, curhatFunctionalSignals)
	protectiveTerms, _ := weightedPhraseScoreDetailed(lower, curhatProtectiveSignals)

	redFlags := []string{}
	crisisFlag := false
	crisisHit := ""
	for _, phrase := range curhatCrisisSignals {
		normalizedPhrase := strings.TrimSpace(normalizeSignalText(phrase))
		if strings.Contains(lower, " "+normalizedPhrase+" ") {
			crisisFlag = true
			crisisHit = phrase
			redFlags = append(redFlags, "Sinyal krisis atau menyakiti diri")
			break
		}
	}

	historyStress, historyBurnout, historyPsychosomatic := 0.0, 0.0, 0.0
	historyHighCount := 0
	if len(history) > 0 {
		for _, item := range history {
			historyStress += item.StressScore
			historyBurnout += item.BurnoutScore
			historyPsychosomatic += item.PsychosomaticScore
			if item.RiskLevel == "High" || item.RiskLevel == "Crisis" || item.StressScore >= 0.70 || item.BurnoutScore >= 0.70 || item.PsychosomaticScore >= 0.70 {
				historyHighCount++
			}
		}
		historyStress /= float64(len(history))
		historyBurnout /= float64(len(history))
		historyPsychosomatic /= float64(len(history))
	}

	stress = clampFloat(math.Max(stress, 0.74*stressTerms+0.18*functionalTerms+0.12*historyStress-0.16*protectiveTerms), 0, 1)
	burnout := clampFloat(0.50*burnoutTerms+0.22*stress+0.16*historyBurnout+0.12*functionalTerms-0.10*protectiveTerms, 0, 1)
	psychosomatic := clampFloat(0.58*psychosomaticTerms+0.18*stress+0.12*historyPsychosomatic+0.08*functionalTerms, 0, 1)
	aggregate := math.Max(stress, math.Max(burnout, psychosomatic))
	if functionalTerms >= 0.55 {
		aggregate += 0.05
	}
	if historyHighCount >= 2 {
		aggregate += 0.04
	}
	aggregate = clampFloat(aggregate, 0, 1)

	risk := "Low"
	switch {
	case crisisFlag || aggregate >= 0.88:
		risk = "Crisis"
	case aggregate >= 0.68:
		risk = "High"
	case aggregate >= 0.38:
		risk = "Medium"
	}

	if stress >= 0.66 {
		detail := topSignalPhrases(stressHits, 3)
		redFlags = append(redFlags, signalRedFlag("Stres tinggi dari bahasa curhat", detail))
	}
	if burnout >= 0.62 {
		detail := topSignalPhrases(burnoutHits, 3)
		redFlags = append(redFlags, signalRedFlag("Indikasi burnout kuat", detail))
	}
	if psychosomatic >= 0.58 {
		detail := topSignalPhrases(psychosomaticHits, 3)
		redFlags = append(redFlags, signalRedFlag("Keluhan psikosomatis menonjol", detail))
	}
	if functionalTerms >= 0.52 {
		detail := topSignalPhrases(functionalHits, 2)
		redFlags = append(redFlags, signalRedFlag("Fungsi harian mulai terganggu", detail))
	}
	if historyHighCount >= 2 {
		redFlags = append(redFlags, "Riwayat curhat sebelumnya menunjukkan risiko berulang")
	}
	if crisisHit != "" {
		redFlags = append([]string{"Frasa krisis terdeteksi: " + crisisHit}, redFlags...)
	}

	confidence := clampFloat(0.42+float64(wordCount)/120+float64(len(redFlags))*0.08+float64(len(history))*0.025, 0.42, 0.96)
	if wordCount < 6 && len(redFlags) == 0 {
		confidence = clampFloat(confidence, 0.35, 0.62)
	}
	priority := priorityFromRisk(risk, crisisFlag, "")

	return CurhatClinicalAnalysis{
		StressScore:        clampFloat(stress, 0, 1),
		BurnoutScore:       burnout,
		PsychosomaticScore: psychosomatic,
		RiskLevel:          risk,
		Confidence:         confidence,
		CrisisFlag:         crisisFlag,
		AdminPriority:      priority,
		AdminSummary:       buildAdminSummary(risk, stress, burnout, psychosomatic, crisisFlag),
		RedFlags:           sanitizeStringSlice(redFlags, 4),
		Recommendations:    adminRecommendationsForRisk(risk, crisisFlag),
		UserNextSteps:      userNextStepsForRisk(risk, crisisFlag),
		Source:             "local",
	}
}

func weightedPhraseScore(text string, weights map[string]float64) float64 {
	total := 0.0
	for phrase, weight := range weights {
		if strings.Contains(text, phrase) {
			total += weight
		}
	}
	return clampFloat(total/2.2, 0, 1)
}

func fallbackCurhatResponse(analysis CurhatClinicalAnalysis, mode string) string {
	prefix := ""
	switch normalizeCurhatAIMode(mode) {
	case "teacher":
		prefix = "Aku akan bantu susun ini pelan-pelan. "
	case "doctor":
		prefix = "Aku baca ini sebagai sinyal kondisi, bukan diagnosis medis. "
	case "family":
		prefix = "Aku di sini menemani kamu, ya. "
	default:
		prefix = "Aku dengerin kamu. "
	}

	if analysis.CrisisFlag || analysis.RiskLevel == "Crisis" {
		return prefix + "Aku ikut khawatir membaca ini, dan kamu tidak harus menanggungnya sendirian. Tolong hubungi orang terdekat yang kamu percaya sekarang, atau cari bantuan profesional/darurat setempat bila ada risiko menyakiti diri. Untuk beberapa menit ini, jauhkan benda yang bisa membahayakan dan tetap berada di tempat yang aman. Aku akan tetap menemani kamu menuliskan langkah kecil berikutnya."
	}
	if analysis.RiskLevel == "High" {
		return prefix + "Aku menangkap tekanan yang cukup kuat dari ceritamu. Ini bukan berarti kamu lemah, tapi sinyal bahwa tubuh dan pikiranmu sedang meminta jeda yang lebih serius. Coba pilih satu hal paling mendesak, turunkan bebannya, lalu beri tahu orang tepercaya bahwa kamu sedang kewalahan. Aku juga akan merangkum sinyal ini agar admin bisa memantau dan memberi tindak lanjut yang lebih tepat."
	}
	if analysis.RiskLevel == "Medium" {
		return prefix + "Aku paham, rasanya beberapa hal sedang menumpuk dan mulai menguras energi. Mari kita buat lebih kecil dulu: ambil napas pelan, pilih satu tugas paling dekat, lalu beri jeda singkat setelahnya. Kalau kamu mau, ceritakan bagian mana yang paling berat supaya kita bisa pecah jadi langkah yang lebih jelas."
	}
	return prefix + "Terima kasih sudah cerita. Dari yang kamu tulis, tekanannya belum terlihat sangat tinggi, tapi tetap penting untuk menjaga ritme dan istirahat. Pertahankan hal yang membantu kamu merasa stabil, dan kalau ada bagian yang mengganjal, kamu bisa lanjut ceritakan di sini."
}

func buildAdminSummary(risk string, stress float64, burnout float64, psycho float64, crisis bool) string {
	if crisis {
		return fmt.Sprintf("Curhat memuat sinyal krisis. Stres %.0f%%, burnout %.0f%%, psikosomatis %.0f%%. Perlu pemantauan segera.", stress*100, burnout*100, psycho*100)
	}
	return fmt.Sprintf("Analisis curhat menunjukkan risiko %s. Stres %.0f%%, burnout %.0f%%, psikosomatis %.0f%%.", strings.ToLower(risk), stress*100, burnout*100, psycho*100)
}

func adminRecommendationsForRisk(risk string, crisis bool) []string {
	if crisis {
		return []string{"Prioritaskan kontak atau follow-up segera", "Sarankan bantuan profesional atau darurat bila ada risiko keselamatan", "Kurangi beban tugas/kerja sementara", "Jadwalkan check-in lanjutan dalam 24 jam"}
	}
	if risk == "High" {
		return []string{"Kirim rekomendasi terapi prioritas tinggi", "Jadwalkan follow-up dalam 2-3 hari", "Pantau balasan user dan mood terbaru", "Sarankan dukungan sosial atau konseling"}
	}
	if risk == "Medium" {
		return []string{"Kirim intervensi ringan dan terstruktur", "Pantau ulang dalam satu minggu", "Sarankan journaling dan jeda kerja/belajar", "Lihat riwayat asesmen sebelum eskalasi"}
	}
	return []string{"Pertahankan monitoring rutin", "Sarankan check-in harian singkat", "Gunakan curhat sebagai baseline emosional"}
}

func userNextStepsForRisk(risk string, crisis bool) []string {
	if crisis {
		return []string{"Hubungi orang tepercaya sekarang", "Pindah ke tempat yang aman", "Jauhkan benda yang bisa membahayakan", "Cari bantuan profesional atau darurat setempat"}
	}
	if risk == "High" {
		return []string{"Ambil jeda 5 menit untuk napas pelan", "Pilih satu tugas paling kecil", "Beritahu orang terdekat bahwa kamu sedang kewalahan", "Balas saran admin bila sudah dikirim"}
	}
	if risk == "Medium" {
		return []string{"Tulis satu hal yang paling berat", "Bagi tugas menjadi langkah kecil", "Jadwalkan istirahat singkat", "Pantau mood setelah 1-2 jam"}
	}
	return []string{"Pertahankan rutinitas yang membantu", "Lanjutkan check-in bila kondisi berubah", "Gunakan jeda singkat sebelum aktivitas berikutnya"}
}

func normalizeCurhatRisk(value string, fallback string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "crisis":
		return "Crisis"
	case "high":
		return "High"
	case "medium":
		return "Medium"
	case "low":
		return "Low"
	default:
		return fallback
	}
}

func strongestRisk(a string, b string) string {
	rank := map[string]int{"Low": 1, "Medium": 2, "High": 3, "Crisis": 4}
	if rank[b] > rank[a] {
		return b
	}
	return a
}

func normalizeAdminPriority(value string, fallback string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "urgent", "high", "medium", "low":
		return strings.ToLower(strings.TrimSpace(value))
	default:
		return fallback
	}
}

func priorityFromRisk(risk string, crisis bool, fallback string) string {
	if crisis || risk == "Crisis" {
		return "urgent"
	}
	switch risk {
	case "High":
		return "high"
	case "Medium":
		return "medium"
	case "Low":
		return "low"
	default:
		return firstNonEmpty(fallback, "medium")
	}
}

func sanitizeStringSlice(items []string, limit int) []string {
	result := []string{}
	seen := map[string]bool{}
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		key := strings.ToLower(item)
		if seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, truncateString(item, 220))
		if len(result) >= limit {
			break
		}
	}
	return result
}

func clampFloat(value float64, min float64, max float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

func generateAIResponse(text string, history []Curhat, initialStressScore float64) (string, float64) {
	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		fmt.Println("Warning: OPENROUTER_API_KEY not set, using fallback response")
		return fallbackAIResponse(initialStressScore), initialStressScore
	}
	url := "https://openrouter.ai/api/v1/chat/completions"

	systemPrompt := `Kamu adalah NEXUS AI — asisten virtual cerdas dan serbaguna yang hadir dalam platform kesehatan mental NexusMind. Kamu memiliki kepribadian yang hangat, cerdas, dan adaptif.

KEMAMPUANMU:
1. **Konselor Empatik**: Ketika pengguna curhat atau tertekan, kamu merespons dengan penuh empati.
2. **Ingatan Konteks**: Kamu diberikan riwayat percakapan sebelumnya. Gunakan itu untuk mengingat nama, masalah yang dibahas, atau detail lain agar percakapan terasa personal.
3. **Analisis Psikologis**: Analisis tingkat stres pengguna berdasarkan pesan terbaru.

ATURAN OUTPUT:
Kamu HARUS merespons dalam format JSON sebagai berikut:
{
  "response": "Kalimat jawabanmu di sini dalam Bahasa Indonesia yang natural dan empatik.",
  "stress_score": 0.XX
}
- "stress_score" desimal 0.0 - 1.0.
- Maksimal 4-5 kalimat.`

	// Membangun riwayat pesan untuk AI
	messages := []map[string]string{
		{"role": "system", "content": systemPrompt},
	}

	// Tambahkan riwayat (maksimal 5 pesan terakhir agar tidak boros token)
	for _, h := range history {
		messages = append(messages, map[string]string{"role": "user", "content": h.Text})
		if h.AIResponse != "" {
			messages = append(messages, map[string]string{"role": "assistant", "content": h.AIResponse})
		}
	}

	// Tambahkan pesan terbaru
	messages = append(messages, map[string]string{"role": "user", "content": text})

	requestBody, _ := json.Marshal(map[string]interface{}{
		"model":           "openai/gpt-4o-mini",
		"messages":        messages,
		"max_tokens":      500,
		"temperature":     0.7,
		"response_format": map[string]string{"type": "json_object"},
	})

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBody))
	if err != nil {
		fmt.Println("OpenRouter Request Build Error:", err)
		return fallbackAIResponse(initialStressScore), initialStressScore
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("HTTP-Referer", "http://localhost:5173")
	req.Header.Set("X-Title", "NexusMind AI Assistant")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("OpenRouter Request Error:", err)
		return fallbackAIResponse(initialStressScore), initialStressScore
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		fmt.Println("OpenRouter Status:", resp.StatusCode, "Body:", string(body))
		return fallbackAIResponse(initialStressScore), initialStressScore
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		fmt.Println("OpenRouter JSON Error:", err, string(body))
		return fallbackAIResponse(initialStressScore), initialStressScore
	}

	if len(result.Choices) > 0 {
		var aiData struct {
			Response    string  `json:"response"`
			StressScore float64 `json:"stress_score"`
		}
		// Bersihkan content jika ada karakter aneh sebelum unmarshal
		content := result.Choices[0].Message.Content
		if err := json.Unmarshal([]byte(content), &aiData); err == nil {
			return aiData.Response, aiData.StressScore
		}
	}

	fmt.Println("OpenRouter Empty or Invalid Result")
	return fallbackAIResponse(initialStressScore), initialStressScore
}

func fallbackAIResponse(stressScore float64) string {
	if stressScore > 0.8 {
		return "Aku benar-benar mendengarmu. Ini terdengar sangat berat dan kamu tidak sendirian menghadapi ini. Cobalah untuk mengambil napas dalam sejenak ya. Apakah kamu ingin menceritakan lebih detail apa yang membuatmu merasa seperti ini? Kadang berbagi bisa sedikit meringankan beban."
	} else if stressScore > 0.6 {
		return "Wah, sepertinya kamu sedang dalam tekanan yang cukup besar. Wajar kok merasa seperti itu. Mungkin kamu bisa coba istirahat sejenak, lakukan hal kecil yang kamu suka. Ada yang bisa aku bantu untuk meringankan pikiranmu hari ini?"
	} else if stressScore > 0.35 {
		return "Aku paham, kadang hal-hal kecil memang bisa numpuk dan bikin kita capek sendiri. Tapi hebat lho kamu masih bertahan sampai sekarang. Coba deh ingat-ingat satu hal positif yang terjadi hari ini, sekecil apapun itu."
	} else {
		return "Senang mendengarnya! Sepertinya kamu dalam kondisi yang cukup baik. Tetap jaga keseimbangan ya antara kerja/istirahat. Kalau ada yang mengganjal, aku selalu di sini untuk mendengarkan."
	}
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

// --- AI-Generated Daily Questions ---
var cachedQuestions []Question
var cachedDate string
var generating bool

var questionProfiles = map[string][]Question{
	"balanced": {
		{ID: "q1", Text: "Saya merasa energi mental saya terkuras oleh aktivitas hari ini.", ConstructType: "fatigue"},
		{ID: "q2", Text: "Saya mulai menjaga jarak secara emosional dari pekerjaan, kuliah, atau orang sekitar.", ConstructType: "cynicism"},
		{ID: "q3", Text: "Saya masih merasa mampu menyelesaikan tugas utama dengan kualitas yang baik.", ConstructType: "efficacy"},
		{ID: "q4", Text: "Saya sulit benar-benar beristirahat karena pikiran terus kembali ke tanggung jawab.", ConstructType: "fatigue"},
		{ID: "q5", Text: "Saya merasa apa yang saya lakukan akhir-akhir ini kurang bermakna.", ConstructType: "cynicism"},
		{ID: "q6", Text: "Saya percaya diri mengambil keputusan saat menghadapi tekanan.", ConstructType: "efficacy"},
		{ID: "q7", Text: "Kondisi tubuh saya terasa ikut menegang saat memikirkan aktivitas harian.", ConstructType: "fatigue"},
		{ID: "q8", Text: "Saya cenderung menunda interaksi karena merasa terlalu lelah secara sosial.", ConstructType: "cynicism"},
		{ID: "q9", Text: "Saya mampu meminta bantuan atau mengatur prioritas saat beban terasa besar.", ConstructType: "efficacy"},
		{ID: "q10", Text: "Saya merasa kualitas tidur saya cukup membantu pemulihan hari ini.", ConstructType: "efficacy"},
		{ID: "q11", Text: "Saya merasa cepat tersinggung ketika ada permintaan tambahan.", ConstructType: "cynicism"},
		{ID: "q12", Text: "Saya membutuhkan waktu lebih lama dari biasanya untuk fokus.", ConstructType: "fatigue"},
	},
	"academic": {
		{ID: "q1", Text: "Tugas, ujian, atau skripsi membuat saya sulit berhenti memikirkan kewajiban akademik.", ConstructType: "fatigue"},
		{ID: "q2", Text: "Saya merasa motivasi belajar menurun meskipun ada target yang harus dikejar.", ConstructType: "cynicism"},
		{ID: "q3", Text: "Saya masih mampu memahami materi atau arahan akademik dengan baik.", ConstructType: "efficacy"},
		{ID: "q4", Text: "Saya merasa kelelahan sebelum mulai belajar atau mengerjakan tugas.", ConstructType: "fatigue"},
		{ID: "q5", Text: "Saya mulai merasa hasil usaha akademik saya tidak sebanding dengan energinya.", ConstructType: "cynicism"},
		{ID: "q6", Text: "Saya dapat membagi tugas besar menjadi langkah kecil yang realistis.", ConstructType: "efficacy"},
		{ID: "q7", Text: "Tekanan nilai atau deadline memengaruhi kualitas tidur saya.", ConstructType: "fatigue"},
		{ID: "q8", Text: "Saya cenderung menghindari diskusi akademik karena merasa jenuh.", ConstructType: "cynicism"},
		{ID: "q9", Text: "Saya percaya masih bisa memperbaiki progres akademik saya.", ConstructType: "efficacy"},
		{ID: "q10", Text: "Saya mampu menentukan prioritas belajar hari ini.", ConstructType: "efficacy"},
		{ID: "q11", Text: "Saya merasa tubuh ikut tegang saat membuka materi atau tugas.", ConstructType: "fatigue"},
		{ID: "q12", Text: "Saya merasa jauh dari alasan awal saya memilih jalur pendidikan ini.", ConstructType: "cynicism"},
	},
	"work": {
		{ID: "q1", Text: "Beban kerja hari ini membuat saya merasa terkuras bahkan sebelum selesai bekerja.", ConstructType: "fatigue"},
		{ID: "q2", Text: "Saya merasa semakin sulit peduli pada hasil pekerjaan seperti biasanya.", ConstructType: "cynicism"},
		{ID: "q3", Text: "Saya masih mampu mengambil keputusan kerja dengan tenang.", ConstructType: "efficacy"},
		{ID: "q4", Text: "Saya merasa waktu istirahat tidak cukup mengembalikan energi saya.", ConstructType: "fatigue"},
		{ID: "q5", Text: "Saya mulai merasa kontribusi saya kurang dihargai.", ConstructType: "cynicism"},
		{ID: "q6", Text: "Saya dapat mengelola tugas mendadak tanpa kehilangan arah.", ConstructType: "efficacy"},
		{ID: "q7", Text: "Tekanan komunikasi kerja membuat tubuh saya terasa tegang.", ConstructType: "fatigue"},
		{ID: "q8", Text: "Saya merasa ingin menjauh dari rekan kerja atau tanggung jawab tertentu.", ConstructType: "cynicism"},
		{ID: "q9", Text: "Saya mampu memberi batas yang sehat pada pekerjaan.", ConstructType: "efficacy"},
		{ID: "q10", Text: "Saya percaya kemampuan saya cukup untuk menyelesaikan target utama.", ConstructType: "efficacy"},
		{ID: "q11", Text: "Saya sering memikirkan pekerjaan saat seharusnya beristirahat.", ConstructType: "fatigue"},
		{ID: "q12", Text: "Saya merasa pekerjaan terasa monoton dan kehilangan makna.", ConstructType: "cynicism"},
	},
	"recovery": {
		{ID: "q1", Text: "Saya merasa tubuh dan pikiran saya masih membutuhkan pemulihan tambahan.", ConstructType: "fatigue"},
		{ID: "q2", Text: "Saya kesulitan menikmati aktivitas yang biasanya terasa menyenangkan.", ConstructType: "cynicism"},
		{ID: "q3", Text: "Saya mampu mengenali batas energi saya hari ini.", ConstructType: "efficacy"},
		{ID: "q4", Text: "Saya merasa mudah lelah setelah melakukan aktivitas kecil.", ConstructType: "fatigue"},
		{ID: "q5", Text: "Saya merasa kurang terhubung dengan tujuan atau rutinitas saya.", ConstructType: "cynicism"},
		{ID: "q6", Text: "Saya bisa memilih satu langkah kecil yang membantu pemulihan saya.", ConstructType: "efficacy"},
		{ID: "q7", Text: "Keluhan fisik seperti tegang, pusing, atau sulit tidur terasa mengganggu.", ConstructType: "fatigue"},
		{ID: "q8", Text: "Saya cenderung menarik diri karena merasa kapasitas saya terbatas.", ConstructType: "cynicism"},
		{ID: "q9", Text: "Saya merasa mampu meminta ruang atau waktu istirahat ketika dibutuhkan.", ConstructType: "efficacy"},
		{ID: "q10", Text: "Saya masih dapat menghargai progres kecil yang saya lakukan.", ConstructType: "efficacy"},
		{ID: "q11", Text: "Saya merasa energi saya habis sebelum hari berjalan jauh.", ConstructType: "fatigue"},
		{ID: "q12", Text: "Saya merasa rutinitas harian terasa hambar atau berat dijalani.", ConstructType: "cynicism"},
	},
}

func normalizeQuestionProfile(profile string) string {
	normalized := strings.ToLower(strings.TrimSpace(profile))
	switch normalized {
	case "academic", "work", "recovery", "balanced":
		return normalized
	default:
		return "balanced"
	}
}

func buildAdaptiveQuestions(profile string, seed string) []Question {
	normalized := normalizeQuestionProfile(profile)
	bank := append([]Question{}, questionProfiles[normalized]...)
	sort.SliceStable(bank, func(i, j int) bool {
		left := md5.Sum([]byte(seed + bank[i].Text))
		right := md5.Sum([]byte(seed + bank[j].Text))
		return hex.EncodeToString(left[:]) < hex.EncodeToString(right[:])
	})

	if len(bank) > 10 {
		bank = bank[:10]
	}
	questions := make([]Question, 0, len(bank))
	for i, q := range bank {
		questions = append(questions, Question{
			ID:            fmt.Sprintf("q%d", i+1),
			Text:          q.Text,
			ConstructType: q.ConstructType,
		})
	}
	return questions
}

func getDailyQuestions(profile string, variant string, refresh bool) ([]Question, string, string) {
	today := time.Now().Format("2006-01-02")
	normalizedProfile := normalizeQuestionProfile(profile)
	dateKey := today + ":" + normalizedProfile
	if variant != "" {
		dateKey += ":" + variant
	}

	// Return cached if available for today
	if !refresh && cachedDate == dateKey && len(cachedQuestions) > 0 {
		return cachedQuestions, dateKey, "ai-cache"
	}

	// Return defaults immediately, trigger async AI generation
	if !generating {
		generating = true
		go generateDailyQuestionsBG(dateKey, normalizedProfile)
	}

	return buildAdaptiveQuestions(normalizedProfile, dateKey), dateKey, "adaptive-local"
}

func generateDailyQuestionsBG(today string, profile string) {
	defer func() { generating = false }()

	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		return
	}

	url := "https://openrouter.ai/api/v1/chat/completions"
	focus := map[string]string{
		"academic": "mahasiswa, tugas, ujian, skripsi, deadline akademik, relasi kampus",
		"work":     "karyawan, beban kerja, komunikasi kerja, target, batas kerja, apresiasi",
		"recovery": "pemulihan energi, istirahat, keluhan fisik, kapasitas diri, ritme sehat",
		"balanced": "kondisi umum harian, energi mental, relasi sosial, tidur, motivasi",
	}[normalizeQuestionProfile(profile)]
	systemPrompt := `Kamu adalah generator kuisioner kesehatan mental. Hasilkan 10 pertanyaan dalam Bahasa Indonesia untuk mengukur burnout dan kesehatan mental. 
Gunakan topik VARIATIF: kelelahan emosional, sinisme, efikasi diri, work-life balance, dukungan sosial, tidur, kecemasan, motivasi, hubungan kerja/kuliah, dan harapan masa depan.
Setiap pertanyaan HARUS memiliki tipe: "fatigue", "cynicism", atau "efficacy".

OUTPUT JSON:
{
  "questions": [
    {"id": "q1", "text": "Pertanyaan di sini?", "construct_type": "fatigue"},
    ...
  ]
}
Bahasa Indonesia natural. Variasikan topik setiap hari.`

	requestBody, _ := json.Marshal(map[string]interface{}{
		"model":           "openai/gpt-4o-mini",
		"messages":        []map[string]string{{"role": "system", "content": systemPrompt}, {"role": "user", "content": "Generate 10 unique burnout/mental health survey questions in Bahasa Indonesia for today: " + today + ". Fokus profil: " + focus}},
		"max_tokens":      800,
		"temperature":     0.5,
		"response_format": map[string]string{"type": "json_object"},
	})

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(requestBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("HTTP-Referer", "http://localhost:5173")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("BG Question Gen Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		return
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(body, &result); err != nil || len(result.Choices) == 0 {
		return
	}

	var gen struct {
		Questions []struct {
			ID            string `json:"id"`
			Text          string `json:"text"`
			ConstructType string `json:"construct_type"`
		} `json:"questions"`
	}
	if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &gen); err != nil || len(gen.Questions) < 3 {
		return
	}

	var questions []Question
	for i, q := range gen.Questions {
		questions = append(questions, Question{
			ID:            fmt.Sprintf("q%d", i+1),
			Text:          q.Text,
			ConstructType: q.ConstructType,
		})
	}

	cachedQuestions = questions
	cachedDate = today
	fmt.Println("AI questions generated for", today)
}

func getDefaultQuestions() []Question {
	return []Question{
		{ID: "q1", Text: "Saya merasa lelah secara emosional karena pekerjaan/kuliah.", ConstructType: "fatigue"},
		{ID: "q2", Text: "Saya merasa kurang peduli dengan rekan kerja/teman.", ConstructType: "cynicism"},
		{ID: "q3", Text: "Saya merasa mampu menyelesaikan masalah dengan baik.", ConstructType: "efficacy"},
		{ID: "q4", Text: "Saya terbebani oleh tuntutan pekerjaan/kuliah yang terus meningkat.", ConstructType: "fatigue"},
		{ID: "q5", Text: "Terkadang saya merasa ragu pada kemampuan saya sendiri.", ConstructType: "efficacy"},
		{ID: "q6", Text: "Saya merasa kurang bersemangat saat memulai hari.", ConstructType: "cynicism"},
		{ID: "q7", Text: "Saya sulit tidur karena memikirkan pekerjaan atau tugas.", ConstructType: "fatigue"},
		{ID: "q8", Text: "Saya merasa didukung oleh orang-orang di sekitar saya.", ConstructType: "efficacy"},
		{ID: "q9", Text: "Saya kehilangan minat pada hal-hal yang dulu saya nikmati.", ConstructType: "cynicism"},
		{ID: "q10", Text: "Saya mampu mengelola stres dengan baik.", ConstructType: "efficacy"},
	}
}
