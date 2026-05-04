package main

import (
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	database, err := gorm.Open(sqlite.Open("../nexusmind.db"), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to database!", err)
	}

	err = database.AutoMigrate(
		&User{},
		&Assessment{},
		&Curhat{},
		&GossipReact{},
		&Prediction{},
		&TherapyRecommendation{},
	)
	if err != nil {
		log.Fatal("Failed to auto migrate database!", err)
	}

	DB = database
}
