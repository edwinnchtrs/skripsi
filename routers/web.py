from fastapi import APIRouter, Depends, Request, HTTPException, status, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth
from engines import quantum_engine, regression_engine, nlp_engine
import json

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# Helper to get current user from cookies (for web views)
def get_current_user_from_cookie(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        return None
    # Remove 'Bearer ' if present
    if token.startswith("Bearer "):
        token = token.split(" ")[1]
    payload = auth.decode_access_token(token)
    if not payload:
        return None
    username: str = payload.get("sub")
    user = db.query(models.User).filter(models.User.username == username).first()
    return user

@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.post("/login")
async def login_post(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user or not auth.verify_password(password, user.password_hash):
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})
    
    access_token = auth.create_access_token(data={"sub": user.username})
    response = RedirectResponse(url="/dashboard", status_code=status.HTTP_302_FOUND)
    response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
    return response

@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@router.post("/register")
async def register_post(request: Request, username: str = Form(...), nama: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == username).first():
        return templates.TemplateResponse("register.html", {"request": request, "error": "Username already taken"})
    
    hashed_password = auth.get_password_hash(password)
    db_user = models.User(username=username, nama=nama, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)

@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse(url="/login")
        
    latest_prediction = db.query(models.Prediction).filter(models.Prediction.user_id == user.id).order_by(models.Prediction.timestamp.desc()).first()
    return templates.TemplateResponse("dashboard.html", {"request": request, "user": user, "prediction": latest_prediction})

@router.get("/assessment", response_class=HTMLResponse)
async def assessment_page(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse(url="/login")
    questions, order_type = quantum_engine.get_randomized_assessment_order()
    return templates.TemplateResponse("assessment.html", {"request": request, "user": user, "questions": questions, "order_type": order_type})

@router.post("/assessment/submit")
async def submit_assessment(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse(url="/login")
        
    data = await request.json()
    responses = data.get("responses")
    order_type = data.get("order_type")
    
    # Calculate Quantum Parameters
    f_score, c_score, e_score, i_score = quantum_engine.calculate_quantum_parameters(responses)
    
    # Save Assessment
    assessment = models.Assessment(
        user_id=user.id, order_type=order_type, responses_json=json.dumps(responses),
        interference_score=i_score, fatigue_score=f_score, cynicism_score=c_score, efficacy_score=e_score
    )
    db.add(assessment)
    db.commit()
    
    # Get NLP Stress Score from past 7 days (simplified to latest curhats for now)
    recent_curhats = db.query(models.Curhat).filter(models.Curhat.user_id == user.id).order_by(models.Curhat.timestamp.desc()).limit(5).all()
    avg_nlp_stress = sum([c.stress_score for c in recent_curhats]) / len(recent_curhats) if recent_curhats else 0.0
    
    # Predict Burnout
    b_score, p_score, risk = regression_engine.predict_burnout(f_score, c_score, e_score, i_score, avg_nlp_stress)
    
    prediction = models.Prediction(
        user_id=user.id, burnout_score=b_score, psychosomatic_score=p_score, risk_level=risk
    )
    db.add(prediction)
    db.commit()
    
    return {"status": "success", "prediction_id": prediction.id, "risk_level": risk}

@router.get("/gosip", response_class=HTMLResponse)
async def gosip_page(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse(url="/login")
    
    # Fetch recent curhats
    curhats = db.query(models.Curhat).order_by(models.Curhat.timestamp.desc()).limit(20).all()
    return templates.TemplateResponse("gosip.html", {"request": request, "user": user, "curhats": curhats})

@router.post("/curhat/submit")
async def submit_curhat(request: Request, text: str = Form(...), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse(url="/login")
        
    stress_score = nlp_engine.analyze_stress_level(text)
    
    curhat = models.Curhat(user_id=user.id, text=text, is_anonymous=True, stress_score=stress_score)
    db.add(curhat)
    db.commit()
    return RedirectResponse(url="/gosip", status_code=status.HTTP_302_FOUND)

@router.get("/terapi", response_class=HTMLResponse)
async def terapi_page(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse(url="/login")
        
    # Logic for adaptive therapy based on latest prediction
    latest_prediction = db.query(models.Prediction).filter(models.Prediction.user_id == user.id).order_by(models.Prediction.timestamp.desc()).first()
    risk_level = latest_prediction.risk_level if latest_prediction else "Low"
    
    return templates.TemplateResponse("terapi.html", {"request": request, "user": user, "risk_level": risk_level})
