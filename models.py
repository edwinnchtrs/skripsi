from sqlalchemy import Boolean, Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    nama = Column(String)
    role = Column(String, default="user")

    assessments = relationship("Assessment", back_populates="user")
    curhats = relationship("Curhat", back_populates="user")
    predictions = relationship("Prediction", back_populates="user")
    therapy_recommendations = relationship("TherapyRecommendation", back_populates="user")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    order_type = Column(String) # A or B (to track order effect)
    responses_json = Column(Text) # JSON string of answers and reaction times
    interference_score = Column(Float)
    fatigue_score = Column(Float)
    cynicism_score = Column(Float)
    efficacy_score = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="assessments")

class Curhat(Base):
    __tablename__ = "curhats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_anonymous = Column(Boolean, default=True)
    text = Column(Text)
    stress_score = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="curhats")
    reacts = relationship("GossipReact", back_populates="curhat")

class GossipReact(Base):
    __tablename__ = "gossip_reacts"

    id = Column(Integer, primary_key=True, index=True)
    curhat_id = Column(Integer, ForeignKey("curhats.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    react_type = Column(String) # e.g., 'love', 'hug', 'badge'

    curhat = relationship("Curhat", back_populates="reacts")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    burnout_score = Column(Float)
    psychosomatic_score = Column(Float)
    risk_level = Column(String) # Low, Medium, High, Crisis
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="predictions")
    therapy_recommendations = relationship("TherapyRecommendation", back_populates="prediction")

class TherapyRecommendation(Base):
    __tablename__ = "therapy_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    prediction_id = Column(Integer, ForeignKey("predictions.id"))
    module_name = Column(String)
    status = Column(String, default="pending") # pending, started, completed

    user = relationship("User", back_populates="therapy_recommendations")
    prediction = relationship("Prediction", back_populates="therapy_recommendations")
