package main

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
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
