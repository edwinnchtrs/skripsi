package main

import "time"

func getSystemConfig() SystemConfig {
	var config SystemConfig
	if err := DB.First(&config).Error; err != nil {
		config = SystemConfig{}
		DB.Create(&config)
	}

	normalized := normalizeSystemConfig(config)
	if normalized != config {
		DB.Model(&config).Updates(map[string]interface{}{
			"burnout_threshold_low":    normalized.BurnoutThresholdLow,
			"burnout_threshold_medium": normalized.BurnoutThresholdMedium,
			"psycho_threshold_low":     normalized.PsychoThresholdLow,
			"psycho_threshold_medium":  normalized.PsychoThresholdMedium,
			"interference_weight":      normalized.InterferenceWeight,
			"early_warning_threshold":  normalized.EarlyWarningThreshold,
			"max_assessment_per_day":   normalized.MaxAssessmentPerDay,
			"notification_retention":   normalized.NotificationRetention,
			"data_retention_days":      normalized.DataRetentionDays,
		})
		normalized.ID = config.ID
		normalized.CreatedAt = config.CreatedAt
		normalized.UpdatedAt = config.UpdatedAt
	}

	return normalized
}

func normalizeSystemConfig(config SystemConfig) SystemConfig {
	if config.BurnoutThresholdLow < 0 || config.BurnoutThresholdLow >= 10 {
		config.BurnoutThresholdLow = 4
	}
	if config.BurnoutThresholdMedium <= config.BurnoutThresholdLow || config.BurnoutThresholdMedium > 10 {
		config.BurnoutThresholdMedium = 6
	}
	if config.PsychoThresholdLow < 0 || config.PsychoThresholdLow >= 10 {
		config.PsychoThresholdLow = 4
	}
	if config.PsychoThresholdMedium <= config.PsychoThresholdLow || config.PsychoThresholdMedium > 10 {
		config.PsychoThresholdMedium = 6
	}
	if config.InterferenceWeight < 0 || config.InterferenceWeight > 3 {
		config.InterferenceWeight = 1
	}
	if config.EarlyWarningThreshold < 0.3 || config.EarlyWarningThreshold > 0.95 {
		config.EarlyWarningThreshold = 0.7
	}
	if config.MaxAssessmentPerDay < 1 || config.MaxAssessmentPerDay > 20 {
		config.MaxAssessmentPerDay = 3
	}
	if config.NotificationRetention < 1 || config.NotificationRetention > 365 {
		config.NotificationRetention = 30
	}
	if config.DataRetentionDays < 30 || config.DataRetentionDays > 1825 {
		config.DataRetentionDays = 365
	}
	return config
}

func retentionCutoff(days int) time.Time {
	return time.Now().AddDate(0, 0, -days)
}

func pruneExpiredNotifications(config SystemConfig) {
	DB.Where("created_at < ?", retentionCutoff(config.NotificationRetention)).Delete(&Notification{})
}

func userActionBlockedByMaintenance(user User, config SystemConfig) bool {
	return config.MaintenanceMode && user.Role != "admin"
}
