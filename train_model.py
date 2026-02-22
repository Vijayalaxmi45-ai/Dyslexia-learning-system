import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import os

def train_dyslexia_model():
    # Synthetic dataset for demonstration
    # Features: Answers to up to 12 screening questions (0 or 1)
    # Target: 0 (No), 1 (Mild), 2 (Strong)
    
    # Let's generate some fake data where higher sum of ones = higher target
    data = []
    for _ in range(1000):
        answers = np.random.randint(0, 2, 12)
        score = sum(answers)
        if score >= 8:
            target = 2
        elif score >= 4:
            target = 1
        else:
            target = 0
        data.append(list(answers) + [target])
    
    df = pd.DataFrame(data, columns=[f'q{i}' for i in range(12)] + ['target'])
    
    X = df.drop('target', axis=1)
    y = df['target']
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save the model
    if not os.path.exists('ml_model'):
        os.makedirs('ml_model')
    
    joblib.dump(model, 'ml_model/dyslexia_model.pkl')
    print("Model trained and saved to ml_model/dyslexia_model.pkl")

if __name__ == '__main__':
    train_dyslexia_model()
