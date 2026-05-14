package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin"
)

func normalizeUserType(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if normalized == "karyawan" {
		return "karyawan"
	}
	return "mahasiswa"
}

func isValidUserType(value string) bool {
	normalized := strings.ToLower(strings.TrimSpace(value))
	return normalized == "mahasiswa" || normalized == "karyawan"
}

func validateUsername(username string) string {
	if len(username) < 3 || len(username) > 80 {
		return "Username minimal 3 karakter dan maksimal 80 karakter"
	}
	for _, char := range username {
		if unicode.IsLetter(char) || unicode.IsDigit(char) || char == '_' || char == '-' || char == '.' || char == '@' {
			continue
		}
		return "Username hanya boleh berisi huruf, angka, titik, underscore, strip, atau email"
	}
	return ""
}

func validatePassword(password string) string {
	if len(password) < 8 {
		return "Kata sandi minimal 8 karakter"
	}
	var hasLower, hasUpper, hasDigit bool
	for _, char := range password {
		switch {
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsDigit(char):
			hasDigit = true
		}
	}
	if !hasLower || !hasUpper || !hasDigit {
		return "Kata sandi wajib mengandung huruf besar, huruf kecil, dan angka"
	}
	return ""
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := ValidateJWT(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		var user User
		if err := DB.Where("username = ?", claims.Username).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		c.Set("user", user)
		c.Next()
	}
}

func RegisterHandler(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Nama     string `json:"nama" binding:"required"`
		UserType string `json:"user_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi username, nama lengkap, jenis akun, dan kata sandi"})
		return
	}

	rawUserType := input.UserType
	input.Username = strings.ToLower(strings.TrimSpace(input.Username))
	input.Nama = strings.TrimSpace(input.Nama)

	if input.Nama == "" || len(input.Nama) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama lengkap minimal 3 karakter"})
		return
	}
	if message := validateUsername(input.Username); message != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": message})
		return
	}
	if !isValidUserType(rawUserType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pilih jenis pengguna mahasiswa atau karyawan"})
		return
	}
	input.UserType = normalizeUserType(rawUserType)
	if message := validatePassword(input.Password); message != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": message})
		return
	}

	var count int64
	DB.Model(&User{}).Where("username = ?", input.Username).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already taken"})
		return
	}

	hashedPassword, _ := HashPassword(input.Password)
	user := User{Username: input.Username, PasswordHash: hashedPassword, Nama: input.Nama, UserType: input.UserType}
	DB.Create(&user)

	c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
}

func LoginHandler(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi username, nama lengkap, jenis akun, dan kata sandi baru"})
		return
	}
	input.Username = strings.ToLower(strings.TrimSpace(input.Username))

	var user User
	if err := DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !CheckPasswordHash(input.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := GenerateJWT(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": gin.H{"username": user.Username, "nama": user.Nama, "role": user.Role, "user_type": normalizeUserType(user.UserType)}})
}

func GoogleLoginHandler(c *gin.Context) {
	var input struct {
		AccessToken string `json:"access_token" binding:"required"`
		UserType    string `json:"user_type"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Access token is required"})
		return
	}

	// Verify token with Google
	req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	req.Header.Add("Authorization", "Bearer "+input.AccessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil || resp.StatusCode != 200 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var googleUser struct {
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	json.Unmarshal(body, &googleUser)

	if googleUser.Email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to get email from Google"})
		return
	}
	googleUser.Email = strings.ToLower(strings.TrimSpace(googleUser.Email))
	googleUser.Name = strings.TrimSpace(googleUser.Name)
	if googleUser.Name == "" {
		googleUser.Name = googleUser.Email
	}

	var user User
	if err := DB.Where("username = ?", googleUser.Email).First(&user).Error; err != nil {
		if !isValidUserType(input.UserType) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Pilih mahasiswa atau karyawan sebelum login Google"})
			return
		}
		// Create user if not exists
		user = User{Username: googleUser.Email, Nama: googleUser.Name, PasswordHash: "google-oauth-dummy", Role: "user", UserType: normalizeUserType(input.UserType)}
		DB.Create(&user)
	} else if user.UserType == "" && isValidUserType(input.UserType) {
		user.UserType = normalizeUserType(input.UserType)
		DB.Save(&user)
	}

	token, err := GenerateJWT(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate internal token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token, "user": gin.H{"username": user.Username, "nama": user.Nama, "role": user.Role, "user_type": normalizeUserType(user.UserType)}})
}

func ForgotPasswordHandler(c *gin.Context) {
	var input struct {
		Username    string `json:"username" binding:"required"`
		Nama        string `json:"nama" binding:"required"`
		UserType    string `json:"user_type" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lengkapi username, nama lengkap, jenis akun, dan kata sandi baru"})
		return
	}
	input.Username = strings.ToLower(strings.TrimSpace(input.Username))
	input.Nama = strings.TrimSpace(input.Nama)

	if message := validateUsername(input.Username); message != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": message})
		return
	}
	if input.Nama == "" || len(input.Nama) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama lengkap minimal 3 karakter"})
		return
	}
	if !isValidUserType(input.UserType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pilih jenis akun mahasiswa atau karyawan"})
		return
	}
	if message := validatePassword(input.NewPassword); message != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": message})
		return
	}

	var user User
	if err := DB.Where("username = ? AND nama = ?", input.Username, input.Nama).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Data verifikasi tidak cocok"})
		return
	}
	if normalizeUserType(user.UserType) != normalizeUserType(input.UserType) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Data verifikasi tidak cocok"})
		return
	}
	if CheckPasswordHash(input.NewPassword, user.PasswordHash) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kata sandi baru tidak boleh sama dengan kata sandi lama"})
		return
	}

	hashedPassword, _ := HashPassword(input.NewPassword)
	if err := DB.Model(&user).Update("password_hash", hashedPassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mereset kata sandi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kata sandi berhasil direset. Silakan masuk dengan kata sandi baru."})
}
