import random
import math

# --- Quantum Cognition Approach ---
# We represent mental states as vectors in Hilbert Space.
# Questions A and B may be incompatible (non-commuting observables).

def get_randomized_assessment_order():
    """ Returns a randomized order to induce order effects. """
    questions = [
        {"id": "q1", "text": "Saya merasa lelah secara emosional karena pekerjaan/kuliah.", "construct_type": "fatigue"},
        {"id": "q2", "text": "Saya merasa kurang peduli dengan rekan kerja/teman.", "construct_type": "cynicism"},
        {"id": "q3", "text": "Saya merasa mampu menyelesaikan masalah dengan baik.", "construct_type": "efficacy"},
        {"id": "q4", "text": "Terbayang bayang kegagalan sebelumnya.", "construct_type": "fatigue"},
        {"id": "q5", "text": "Terkadang saya merasa ragu pada kemampuan saya sendiri.", "construct_type": "efficacy"}
    ]
    random.shuffle(questions)
    # The order_type represents the hash of this specific order
    order_type = "-".join([q["id"] for q in questions])
    return questions, order_type

def calculate_quantum_parameters(responses: list):
    """
    Calculate interference score based on reaction times and conflicting answers.
    In a real scenario, this involves calculating transition probabilities and 
    finding the interference term. We'll simulate a basic version based on variance
    and non-classical probability deviation.
    """
    if not responses:
        return 0.0, 0.0, 0.0, 0.0
        
    fatigue_scores = []
    cynicism_scores = []
    efficacy_scores = []
    reaction_times = []
    
    for r in responses:
        if r['construct_type'] == 'fatigue':
            fatigue_scores.append(r['value'])
        elif r['construct_type'] == 'cynicism':
            cynicism_scores.append(r['value'])
        elif r['construct_type'] == 'efficacy':
            # reverse score for efficacy (higher efficacy = lower burnout)
            efficacy_scores.append(6 - r['value'] if r['value'] else 0)
            
        reaction_times.append(r.get('reaction_time_ms', 1000))
        
    f_score = sum(fatigue_scores) / len(fatigue_scores) if fatigue_scores else 0
    c_score = sum(cynicism_scores) / len(cynicism_scores) if cynicism_scores else 0
    e_score = sum(efficacy_scores) / len(efficacy_scores) if efficacy_scores else 0
    
    # Interference score heuristic:
    # Fluctuations in reaction time combined with extreme values
    avg_rt = sum(reaction_times) / len(reaction_times) if reaction_times else 1
    rt_variance = sum((rt - avg_rt)**2 for rt in reaction_times) / len(reaction_times) if reaction_times else 0
    
    # Simulated interference term based on contextual shifts (variance of RT scaled)
    interference_score = math.log1p(rt_variance) / 10.0
    
    return f_score, c_score, e_score, interference_score
