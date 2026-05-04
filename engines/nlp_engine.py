import re

# A simple lexicon for stress in Bahasa Indonesia
STRESS_LEXICON = {
    "lelah": 0.8,
    "capek": 0.7,
    "pusing": 0.6,
    "muak": 0.9,
    "benci": 0.8,
    "burnout": 1.0,
    "stres": 0.9,
    "gila": 0.7,
    "hancur": 0.8,
    "nangis": 0.7,
    "beban": 0.6,
    "berat": 0.5,
    "resign": 0.9,
    "malas": 0.5,
    "bosan": 0.4
}

POSITIVE_LEXICON = {
    "senang": 0.8,
    "bahagia": 0.9,
    "semangat": 0.8,
    "bisa": 0.5,
    "selesai": 0.4,
    "aman": 0.5,
    "lancar": 0.6
}

def analyze_stress_level(text: str) -> float:
    """
    Analyzes the text and returns a stress score between 0.0 and 1.0.
    In the future, this can be swapped with IndoBERT.
    """
    if not text:
        return 0.0
        
    text = text.lower()
    words = re.findall(r'\b\w+\b', text)
    
    if not words:
        return 0.0
        
    stress_weight = 0.0
    positive_weight = 0.0
    
    for word in words:
        if word in STRESS_LEXICON:
            stress_weight += STRESS_LEXICON[word]
        if word in POSITIVE_LEXICON:
            positive_weight += POSITIVE_LEXICON[word]
            
    # Calculate a simple ratio
    total_words = len(words)
    stress_density = stress_weight / total_words if total_words > 0 else 0
    positive_density = positive_weight / total_words if total_words > 0 else 0
    
    # Base score normalized by density
    score = min(1.0, max(0.0, stress_density * 2.5 - positive_density))
    
    return score
