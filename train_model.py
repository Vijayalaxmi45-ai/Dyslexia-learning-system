import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import os

def train_dyslexia_model():
    if not os.path.exists('dyslexia_data.csv'):
        print("Dataset not found. Please run generate_dataset.py first.")
        return
        
    # Load dataset
    df = pd.read_csv('dyslexia_data.csv')
    
    X = df.drop('target', axis=1)
    y = df['target']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    # Using more trees and better depth for the realistic dataset
    model = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Training Complete. Accuracy: {acc:.2f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the model
    if not os.path.exists('ml_model'):
        os.makedirs('ml_model')
    
    joblib.dump(model, 'ml_model/dyslexia_model.pkl')
    print("Model saved to ml_model/dyslexia_model.pkl")

if __name__ == '__main__':
    train_dyslexia_model()
