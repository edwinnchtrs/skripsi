import numpy as np
import pickle
import os
from sklearn.linear_model import LinearRegression

MODEL_PATH = "burnout_model.pkl"

def get_model():
    """ Load or initialize a basic Multiple Linear Regression model """
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    else:
        # Initialize a basic model with dummy weights if no trained model exists
        model = LinearRegression()
        # Dummy fit so it can predict
        # Features: [fatigue, cynicism, efficacy, interference, nlp_stress_score]
        X_dummy = np.array([[3.0, 3.0, 3.0, 0.5, 0.5], [1.0, 1.0, 5.0, 0.1, 0.1]])
        y_dummy = np.array([5.0, 1.0]) # Burnout scores
        model.fit(X_dummy, y_dummy)
        
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(model, f)
        return model

def predict_burnout(fatigue: float, cynicism: float, efficacy: float, interference: float, nlp_stress: float):
    """
    Predicts burnout score based on classical and quantum features.
    """
    model = get_model()
    # Normalize features to float
    features = np.array([[float(fatigue), float(cynicism), float(efficacy), float(interference), float(nlp_stress)]])
    prediction = model.predict(features)[0]
    
    # Ensure between 0 and 10
    burnout_score = max(0.0, min(10.0, prediction))
    
    # Simple rule-based psychosomatic mapping
    psychosomatic_score = burnout_score * 0.8 + (interference * 1.5)
    psychosomatic_score = max(0.0, min(10.0, psychosomatic_score))
    
    risk_level = "Low"
    if burnout_score > 7.5:
        risk_level = "Crisis"
    elif burnout_score > 6.0:
        risk_level = "High"
    elif burnout_score > 4.0:
        risk_level = "Medium"
        
    return burnout_score, psychosomatic_score, risk_level

def train_model(X_train, y_train):
    """ Train and save the model with real data """
    model = LinearRegression()
    model.fit(X_train, y_train)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return True
