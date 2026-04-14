import os
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load model relative to this file
# In Vercel, the file structure might be different, but ml_model should be in the root
model_path = os.path.join(os.path.dirname(__file__), '..', 'ml_model', 'dyslexia_model.pkl')

try:
    model = joblib.load(model_path)
except Exception as e:
    print(f"Error loading model at {model_path}: {e}")
    model = None

@app.route('/api/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'Machine learning model not loaded'}), 500
    
    data = request.json
    answers = data.get('answers', [])
    
    if len(answers) < 12:
        return jsonify({'error': '12 answers required'}), 400

    # Map 12 boolean answers to 11 numeric features
    mapping = {
        'phonological_awareness': 8 if not (answers[3] or answers[8]) else 3,
        'rhyming_score': 8 if not answers[3] else 4,
        'rapid_naming_speed': 8 if not (answers[4] or answers[10]) else 3,
        'decoding_accuracy': 8 if not (answers[0] or answers[8]) else 3,
        'spelling_accuracy': 8 if not answers[3] else 2,
        'writing_speed': 8 if not (answers[5] or answers[7]) else 3,
        'memory_span': 8 if not (answers[2] or answers[9]) else 2,
        'reversals_frequency': 8 if answers[1] else 1,
        'visual_place_loss': 8 if (answers[0] or answers[4] or answers[6]) else 1,
        'attention_span': 8 if not (answers[10] or answers[11]) else 3,
        'family_history': 0 
    }
    
    features = [
        mapping['phonological_awareness'],
        mapping['rhyming_score'],
        mapping['rapid_naming_speed'],
        mapping['decoding_accuracy'],
        mapping['spelling_accuracy'],
        mapping['writing_speed'],
        mapping['memory_span'],
        mapping['reversals_frequency'],
        mapping['visual_place_loss'],
        mapping['attention_span'],
        mapping['family_history']
    ]
    
    prediction = int(model.predict([features])[0])
    
    analysis_map = {
        0: "Minimal indicators of dyslexia detected. Keep up the good work!",
        1: "Possible mild indicators of dyslexia found. Consider exploring our tools.",
        2: "Strong indicators of dyslexia detected. We highly recommend tailored learning strategies."
    }
    
    # Simple suggestions based on prediction
    suggestions = [
        "Explore the Learning Hub for personalized strategies.",
        "Practice daily reading exercises.",
        "Use multi-sensory learning techniques."
    ]
    if prediction >= 1:
        suggestions.append("Try the Colored Overlays tool to reduce visual stress.")
        suggestions.append("Use the Guided Reading tool for better focus.")
    if prediction == 2:
        suggestions.append("Consider consulting with a specialist for further assessment.")

    return jsonify({
        'prediction': prediction,
        'analysis': analysis_map.get(prediction, "Analysis complete."),
        'suggestions': suggestions
    })

if __name__ == '__main__':
    app.run(port=5001)
