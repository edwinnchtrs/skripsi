package main

import (
	"net/http"
	"sort"

	"github.com/gin-gonic/gin"
)

func AdminModelEvaluationV2Handler(c *gin.Context) {
	if !AdminGuard(c) {
		return
	}

	samples := loadTrainingSamples()
	if len(samples) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"r2_score":           0,
			"accuracy":           0,
			"mae":                0,
			"rmse":               0,
			"mape":               0,
			"f1_score":           0,
			"n_samples":          0,
			"confusion_matrix":   map[string]int{},
			"feature_importance": []map[string]interface{}{},
			"cross_val_scores":   []float64{},
			"model_comparison":   []ModelComparison{},
			"formula": gin.H{
				"burnout":       "Belum ada model terlatih",
				"psychosomatic": "Belum ada model terlatih",
			},
			"metadata": gin.H{
				"active_model":        "Belum tersedia",
				"trained":             false,
				"training_samples":    0,
				"minimum_samples":     minTrainingSamples,
				"label_source":        "prediction-history",
				"model_version":       activeModelVersion,
				"quantum_features":    0,
				"comparison_models":   0,
				"validation_strategy": "Belum cukup data",
			},
		})
		return
	}

	psychometricMetrics := evaluatePredictions(samples, psychometricPredictionForSample)
	activeMetrics := psychometricMetrics
	activeFormula := "0.45xF + 0.30xC + 0.25xE + 1.15xI + 0.70xO + 0.60xD + 1.40xS"
	psychosomaticFormula := "0.65xburnout + 1.35xI + 0.85xO + 0.55xD"
	activeModelName := "Psychometric fallback"
	cvScores := []float64{}
	featureList := []map[string]interface{}{}
	comparisons := []ModelComparison{
		{
			Model:    "Psychometric fallback",
			Short:    "PSY",
			R2:       psychometricMetrics.R2,
			Accuracy: psychometricMetrics.Accuracy,
			MAE:      psychometricMetrics.MAE,
			Color:    "#f59e0b",
		},
	}

	quantumModel, quantumOK := trainRidgeModel(samples)
	if quantumOK {
		activeMetrics = evaluatePredictions(samples, func(sample TrainingSample) float64 {
			return predictLinear(quantumModel.BurnoutCoefficients, sample.Features)
		})
		activeFormula = formatModelFormula(quantumModel.BurnoutCoefficients)
		psychosomaticFormula = formatModelFormula(quantumModel.PsychosomaticCoefficients)
		activeModelName = "Quantum ridge regression"
		cvScores = crossValidatedAccuracy(samples, true)
		featureList = featureImportance(samples, quantumModel.BurnoutCoefficients)
		comparisons = append(comparisons, ModelComparison{
			Model:    "Quantum ridge regression",
			Short:    "Q-Ridge",
			R2:       activeMetrics.R2,
			Accuracy: activeMetrics.Accuracy,
			MAE:      activeMetrics.MAE,
			Color:    "#8b5cf6",
		})
	}

	classicalFeatures := make([][]float64, 0, len(samples))
	classicalTargets := make([]float64, 0, len(samples))
	for _, sample := range samples {
		classicalFeatures = append(classicalFeatures, sample.ClassicalFeatures)
		classicalTargets = append(classicalTargets, sample.BurnoutTarget)
	}
	if coefficients, ok := fitRidge(classicalFeatures, classicalTargets); ok {
		classicalMetrics := evaluatePredictions(samples, func(sample TrainingSample) float64 {
			return predictLinear(coefficients, sample.ClassicalFeatures)
		})
		comparisons = append(comparisons, ModelComparison{
			Model:    "Classical ridge regression",
			Short:    "C-Ridge",
			R2:       classicalMetrics.R2,
			Accuracy: classicalMetrics.Accuracy,
			MAE:      classicalMetrics.MAE,
			Color:    "#2dd4bf",
		})
	}
	sort.SliceStable(comparisons, func(i, j int) bool {
		return comparisons[i].R2 > comparisons[j].R2
	})

	c.JSON(http.StatusOK, gin.H{
		"r2_score":           activeMetrics.R2,
		"accuracy":           activeMetrics.Accuracy,
		"mae":                activeMetrics.MAE,
		"rmse":               activeMetrics.RMSE,
		"mape":               activeMetrics.MAPE,
		"f1_score":           activeMetrics.F1,
		"n_samples":          len(samples),
		"confusion_matrix":   activeMetrics.ConfusionMatrix,
		"feature_importance": featureList,
		"cross_val_scores":   cvScores,
		"model_comparison":   comparisons,
		"formula": gin.H{
			"burnout":       activeFormula,
			"psychosomatic": psychosomaticFormula,
		},
		"metadata": gin.H{
			"active_model":        activeModelName,
			"trained":             quantumOK,
			"training_samples":    len(samples),
			"minimum_samples":     minTrainingSamples,
			"label_source":        "prediction-history",
			"model_version":       activeModelVersion,
			"quantum_features":    4,
			"comparison_models":   len(comparisons),
			"validation_strategy": "5-fold chronological cross-validation",
		},
	})
}
