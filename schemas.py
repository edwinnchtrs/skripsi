from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    nama: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True

class AssessmentItem(BaseModel):
    id: str
    construct_type: str
    value: int
    reaction_time_ms: int

class AssessmentCreate(BaseModel):
    responses: List[AssessmentItem]
    order_type: str

class AssessmentResponse(BaseModel):
    id: int
    interference_score: float
    fatigue_score: float
    cynicism_score: float
    efficacy_score: float
    timestamp: datetime
    class Config:
        from_attributes = True

class CurhatCreate(BaseModel):
    text: str
    is_anonymous: bool = True

class CurhatResponse(BaseModel):
    id: int
    user_id: int
    text: str
    is_anonymous: bool
    stress_score: float
    timestamp: datetime
    class Config:
        from_attributes = True

class PredictionResponse(BaseModel):
    id: int
    burnout_score: float
    psychosomatic_score: float
    risk_level: str
    timestamp: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
