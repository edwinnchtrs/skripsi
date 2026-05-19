package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type CinemaDiscoveryItem struct {
	Title   string `json:"title"`
	Snippet string `json:"snippet"`
	URL     string `json:"url"`
	Source  string `json:"source"`
}

type UserFilmDTO struct {
	ID              uint       `json:"db_id"`
	ClientID        string     `json:"id"`
	Title           string     `json:"title"`
	Studio          string     `json:"studio"`
	Duration        string     `json:"duration"`
	Mood            string     `json:"mood"`
	Description     string     `json:"description"`
	EmbedURL        string     `json:"embedUrl"`
	SourceURL       string     `json:"sourceUrl"`
	Accent          string     `json:"accent"`
	Tag             string     `json:"tag"`
	Category        string     `json:"category"`
	Saved           bool       `json:"saved"`
	Status          string     `json:"status"`
	ProgressSeconds int        `json:"progressSeconds"`
	Rating          int        `json:"rating"`
	Notes           string     `json:"notes"`
	AddedAt         time.Time  `json:"addedAt"`
	LastWatchedAt   *time.Time `json:"lastWatchedAt,omitempty"`
}

type userFilmInput struct {
	Title           string `json:"title"`
	Studio          string `json:"studio"`
	Duration        string `json:"duration"`
	Mood            string `json:"mood"`
	Description     string `json:"description"`
	EmbedURL        string `json:"embedUrl"`
	SourceURL       string `json:"sourceUrl"`
	Accent          string `json:"accent"`
	Tag             string `json:"tag"`
	Category        string `json:"category"`
	Status          string `json:"status"`
	ProgressSeconds int    `json:"progressSeconds"`
	Rating          int    `json:"rating"`
	Notes           string `json:"notes"`
}

func CinemaDiscoveryHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	config := getSystemConfig()
	if userActionBlockedByMaintenance(user, config) {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Sistem sedang dalam mode pemeliharaan"})
		return
	}

	mood := strings.TrimSpace(c.Query("mood"))
	query := strings.TrimSpace(c.Query("q"))
	if mood == "" {
		mood = "film pendek legal yang ringan"
	}

	searchQuery := strings.TrimSpace(fmt.Sprintf("%s %s legal open short film recommendation youtube vimeo", mood, query))
	items := []CinemaDiscoveryItem{}
	for _, candidateQuery := range buildCinemaDiscoveryQueries(mood, query) {
		items = append(items, fetchDuckDuckGoCinemaDiscovery(candidateQuery)...)
	}
	items = dedupeCinemaDiscovery(items)
	if len(items) == 0 {
		items = fallbackCinemaDiscovery(mood)
	}
	if len(items) > 5 {
		items = items[:5]
	}

	c.JSON(http.StatusOK, gin.H{
		"query":        searchQuery,
		"items":        items,
		"source":       discoverySource(items),
		"generated_at": time.Now(),
	})
}

func UserFilmsGetHandler(c *gin.Context) {
	user := c.MustGet("user").(User)

	var films []UserFilm
	if err := DB.Where("user_id = ?", user.ID).Order("updated_at DESC").Find(&films).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat library film"})
		return
	}

	result := make([]UserFilmDTO, 0, len(films))
	for _, film := range films {
		result = append(result, userFilmDTO(film))
	}

	c.JSON(http.StatusOK, gin.H{"films": result})
}

func UserFilmsCreateHandler(c *gin.Context) {
	user := c.MustGet("user").(User)

	var input userFilmInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data film tidak valid"})
		return
	}
	input = sanitizeUserFilmInput(input)
	if input.Title == "" || input.EmbedURL == "" || input.SourceURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Judul, embed URL, dan sumber wajib diisi"})
		return
	}
	if !isAllowedCinemaEmbed(input.EmbedURL) || !isAllowedCinemaSource(input.SourceURL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gunakan link YouTube atau Vimeo resmi"})
		return
	}

	var film UserFilm
	result := DB.Where("user_id = ? AND source_url = ?", user.ID, input.SourceURL).First(&film)
	if result.Error == nil {
		applyUserFilmInput(&film, input)
		if err := DB.Save(&film).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui film"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"film": userFilmDTO(film), "status": "updated"})
		return
	}

	film = UserFilm{UserID: user.ID}
	applyUserFilmInput(&film, input)
	if err := DB.Create(&film).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan film"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"film": userFilmDTO(film), "status": "created"})
}

func UserFilmsUpdateHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	film, ok := findUserFilm(c, user.ID)
	if !ok {
		return
	}

	var input struct {
		Title           *string `json:"title"`
		Mood            *string `json:"mood"`
		Status          *string `json:"status"`
		ProgressSeconds *int    `json:"progressSeconds"`
		Rating          *int    `json:"rating"`
		Notes           *string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data pembaruan tidak valid"})
		return
	}

	if input.Status != nil {
		film.Status = normalizeFilmStatus(*input.Status)
	}
	if input.ProgressSeconds != nil {
		film.ProgressSeconds = clampInt(*input.ProgressSeconds, 0, 24*60*60)
	}
	if input.Rating != nil {
		film.Rating = clampInt(*input.Rating, 0, 5)
	}
	if input.Notes != nil {
		film.Notes = truncateString(*input.Notes, 1200)
	}
	if input.Title != nil && strings.TrimSpace(*input.Title) != "" {
		film.Title = truncateString(*input.Title, 191)
	}
	if input.Mood != nil && strings.TrimSpace(*input.Mood) != "" {
		film.Mood = truncateString(*input.Mood, 64)
	}

	if err := DB.Save(&film).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui film"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"film": userFilmDTO(film)})
}

func UserFilmsDeleteHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	film, ok := findUserFilm(c, user.ID)
	if !ok {
		return
	}

	if err := DB.Delete(&film).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus film"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func UserFilmWatchEventHandler(c *gin.Context) {
	user := c.MustGet("user").(User)
	film, ok := findUserFilm(c, user.ID)
	if !ok {
		return
	}

	var input struct {
		Event           string `json:"event"`
		ProgressSeconds int    `json:"progressSeconds"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data aktivitas nonton tidak valid"})
		return
	}

	now := time.Now()
	event := strings.TrimSpace(input.Event)
	if event == "" {
		event = "play"
	}
	film.ProgressSeconds = clampInt(input.ProgressSeconds, 0, 24*60*60)
	film.LastWatchedAt = &now
	if film.Status == "" || film.Status == "watchlist" {
		film.Status = "watching"
	}
	if event == "complete" {
		film.Status = "completed"
	}

	DB.Save(&film)
	DB.Create(&FilmWatchEvent{
		UserID:          user.ID,
		UserFilmID:      film.ID,
		Title:           film.Title,
		SourceURL:       film.SourceURL,
		Event:           truncateString(event, 32),
		ProgressSeconds: film.ProgressSeconds,
	})

	c.JSON(http.StatusOK, gin.H{"film": userFilmDTO(film)})
}

func UserFilmRecommendationCreateHandler(c *gin.Context) {
	user := c.MustGet("user").(User)

	var input struct {
		Mood   string                `json:"mood"`
		Query  string                `json:"query"`
		Source string                `json:"source"`
		Reply  string                `json:"reply"`
		Items  []CinemaDiscoveryItem `json:"items"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data rekomendasi tidak valid"})
		return
	}

	itemsJSON, _ := json.Marshal(input.Items)
	record := FilmRecommendation{
		UserID:    user.ID,
		Mood:      truncateString(input.Mood, 191),
		Query:     truncateString(input.Query, 512),
		Source:    truncateString(input.Source, 64),
		Reply:     truncateString(input.Reply, 3000),
		ItemsJSON: string(itemsJSON),
	}
	if err := DB.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan rekomendasi"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": "saved", "id": record.ID})
}

func buildCinemaDiscoveryQueries(mood string, query string) []string {
	base := []string{
		strings.TrimSpace(fmt.Sprintf("%s %s legal open short film recommendation youtube vimeo", mood, query)),
		strings.TrimSpace(fmt.Sprintf("%s legal movie recommendation for mood", mood)),
		strings.TrimSpace(fmt.Sprintf("%s open movie short film similar recommendation", query)),
		"best legal free short films youtube vimeo open movie",
	}

	result := []string{}
	seen := map[string]bool{}
	for _, item := range base {
		item = strings.TrimSpace(item)
		key := strings.ToLower(item)
		if item == "" || seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, item)
	}
	return result
}

func userFilmDTO(film UserFilm) UserFilmDTO {
	return UserFilmDTO{
		ID:              film.ID,
		ClientID:        fmt.Sprintf("saved-db-%d", film.ID),
		Title:           film.Title,
		Studio:          film.Studio,
		Duration:        film.Duration,
		Mood:            film.Mood,
		Description:     film.Description,
		EmbedURL:        film.EmbedURL,
		SourceURL:       film.SourceURL,
		Accent:          firstNonEmpty(film.Accent, "#ef4444"),
		Tag:             firstNonEmpty(film.Tag, "Tersimpan"),
		Category:        firstNonEmpty(film.Category, "saved"),
		Saved:           true,
		Status:          firstNonEmpty(film.Status, "watchlist"),
		ProgressSeconds: film.ProgressSeconds,
		Rating:          film.Rating,
		Notes:           film.Notes,
		AddedAt:         film.CreatedAt,
		LastWatchedAt:   film.LastWatchedAt,
	}
}

func sanitizeUserFilmInput(input userFilmInput) userFilmInput {
	input.Title = truncateString(strings.TrimSpace(input.Title), 191)
	input.Studio = truncateString(firstNonEmpty(input.Studio, "Link legal pribadi"), 191)
	input.Duration = truncateString(firstNonEmpty(input.Duration, "Custom"), 64)
	input.Mood = truncateString(firstNonEmpty(input.Mood, "Pilihan sendiri"), 64)
	input.Description = truncateString(firstNonEmpty(input.Description, "Video resmi yang kamu simpan ke library."), 1200)
	input.EmbedURL = truncateString(strings.TrimSpace(input.EmbedURL), 512)
	input.SourceURL = truncateString(strings.TrimSpace(input.SourceURL), 512)
	input.Accent = truncateString(firstNonEmpty(input.Accent, "#ef4444"), 32)
	input.Tag = truncateString(firstNonEmpty(input.Tag, "Tersimpan"), 64)
	input.Category = "saved"
	input.Status = normalizeFilmStatus(input.Status)
	input.ProgressSeconds = clampInt(input.ProgressSeconds, 0, 24*60*60)
	input.Rating = clampInt(input.Rating, 0, 5)
	input.Notes = truncateString(strings.TrimSpace(input.Notes), 1200)
	return input
}

func applyUserFilmInput(film *UserFilm, input userFilmInput) {
	film.Title = input.Title
	film.Studio = input.Studio
	film.Duration = input.Duration
	film.Mood = input.Mood
	film.Description = input.Description
	film.EmbedURL = input.EmbedURL
	film.SourceURL = input.SourceURL
	film.Accent = input.Accent
	film.Tag = input.Tag
	film.Category = input.Category
	film.Status = input.Status
	film.ProgressSeconds = input.ProgressSeconds
	film.Rating = input.Rating
	film.Notes = input.Notes
}

func findUserFilm(c *gin.Context, userID uint) (UserFilm, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID film tidak valid"})
		return UserFilm{}, false
	}
	var film UserFilm
	if err := DB.Where("id = ? AND user_id = ?", id, userID).First(&film).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Film tidak ditemukan"})
		return UserFilm{}, false
	}
	return film, true
}

func normalizeFilmStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "watching", "completed", "paused", "favorite":
		return strings.ToLower(strings.TrimSpace(status))
	default:
		return "watchlist"
	}
}

func isAllowedCinemaEmbed(raw string) bool {
	parsed, err := url.Parse(raw)
	if err != nil {
		return false
	}
	host := strings.TrimPrefix(strings.ToLower(parsed.Hostname()), "www.")
	return (host == "youtube.com" && strings.HasPrefix(parsed.Path, "/embed/")) ||
		(host == "player.vimeo.com" && strings.HasPrefix(parsed.Path, "/video/"))
}

func isAllowedCinemaSource(raw string) bool {
	parsed, err := url.Parse(raw)
	if err != nil {
		return false
	}
	host := strings.TrimPrefix(strings.ToLower(parsed.Hostname()), "www.")
	return host == "youtube.com" || host == "m.youtube.com" || host == "youtu.be" || host == "vimeo.com" || host == "player.vimeo.com"
}

func clampInt(value int, min int, max int) int {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

func fetchDuckDuckGoCinemaDiscovery(searchQuery string) []CinemaDiscoveryItem {
	endpoint := "https://api.duckduckgo.com/?format=json&no_redirect=1&no_html=1&q=" + url.QueryEscape(searchQuery)
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil
	}
	req.Header.Set("User-Agent", "NexusMind/1.0")

	client := &http.Client{Timeout: 6 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 512*1024))
	if err != nil {
		return nil
	}

	var payload struct {
		Heading       string            `json:"Heading"`
		AbstractText  string            `json:"AbstractText"`
		AbstractURL   string            `json:"AbstractURL"`
		RelatedTopics []json.RawMessage `json:"RelatedTopics"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil
	}

	items := []CinemaDiscoveryItem{}
	if strings.TrimSpace(payload.AbstractText) != "" {
		items = append(items, CinemaDiscoveryItem{
			Title:   firstNonEmpty(payload.Heading, "Info publik terkait"),
			Snippet: strings.TrimSpace(payload.AbstractText),
			URL:     payload.AbstractURL,
			Source:  "DuckDuckGo",
		})
	}
	collectDuckDuckGoTopics(payload.RelatedTopics, &items)
	return dedupeCinemaDiscovery(items)
}

func collectDuckDuckGoTopics(rawTopics []json.RawMessage, items *[]CinemaDiscoveryItem) {
	for _, raw := range rawTopics {
		if len(*items) >= 8 {
			return
		}

		var topic struct {
			Text     string            `json:"Text"`
			FirstURL string            `json:"FirstURL"`
			Topics   []json.RawMessage `json:"Topics"`
		}
		if err := json.Unmarshal(raw, &topic); err != nil {
			continue
		}
		if len(topic.Topics) > 0 {
			collectDuckDuckGoTopics(topic.Topics, items)
			continue
		}
		text := strings.TrimSpace(topic.Text)
		if text == "" {
			continue
		}

		title := text
		if idx := strings.Index(text, " - "); idx > 0 {
			title = text[:idx]
		}
		*items = append(*items, CinemaDiscoveryItem{
			Title:   truncateString(title, 80),
			Snippet: truncateString(text, 220),
			URL:     topic.FirstURL,
			Source:  "DuckDuckGo",
		})
	}
}

func dedupeCinemaDiscovery(items []CinemaDiscoveryItem) []CinemaDiscoveryItem {
	seen := map[string]bool{}
	result := []CinemaDiscoveryItem{}
	for _, item := range items {
		key := strings.ToLower(strings.TrimSpace(item.Title))
		if key == "" || seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, item)
	}
	return result
}

func fallbackCinemaDiscovery(mood string) []CinemaDiscoveryItem {
	lower := strings.ToLower(mood)
	if strings.Contains(lower, "fokus") || strings.Contains(lower, "belajar") {
		return []CinemaDiscoveryItem{
			{Title: "Ambient focus", Snippet: "Gunakan video ambient legal berdurasi panjang untuk belajar atau kerja tenang.", Source: "local"},
			{Title: "Short break", Snippet: "Sisipkan film pendek ringan setelah sesi fokus agar transisi istirahat lebih jelas.", Source: "local"},
		}
	}
	if strings.Contains(lower, "relaks") || strings.Contains(lower, "lelah") {
		return []CinemaDiscoveryItem{
			{Title: "Nature reset", Snippet: "Video alam dan audio lembut cocok untuk menurunkan intensitas setelah aktivitas padat.", Source: "local"},
			{Title: "Low conflict short", Snippet: "Pilih tontonan pendek dengan konflik ringan agar tidak menambah beban mental.", Source: "local"},
		}
	}
	return []CinemaDiscoveryItem{
		{Title: "Open movie", Snippet: "Film pendek open-license aman untuk katalog legal dan cocok sebagai tontonan cepat.", Source: "local"},
		{Title: "Animation short", Snippet: "Animasi pendek biasanya lebih mudah selesai dalam satu sesi dan cocok untuk jeda.", Source: "local"},
	}
}

func discoverySource(items []CinemaDiscoveryItem) string {
	for _, item := range items {
		if item.Source != "local" {
			return "web-public"
		}
	}
	return "local"
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func truncateString(value string, limit int) string {
	runes := []rune(strings.TrimSpace(value))
	if len(runes) <= limit {
		return string(runes)
	}
	return string(runes[:limit-1]) + "..."
}
