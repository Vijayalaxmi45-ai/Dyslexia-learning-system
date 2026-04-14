import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import os

def train_clinical_model():
    file_path = 'real_dyslexia_clinical_data.csv'
    if not os.path.exists(file_path):
        print("Dataset not found!")
        return

    df = pd.read_csv(file_path)
    X = df.drop('Label', axis=1)
    y = df['Label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Clinical Model Trained. Accuracy: {accuracy:.2%}")

    if not os.path.exists('ml_model'):
        os.makedirs('ml_model')
    
    joblib.dump(model, 'ml_model/dyslexia_model.pkl')
    # Save the feature names for reference in app.py
    joblib.dump(X.columns.tolist(), 'ml_model/features.pkl')
    print("Model saved to ml_model/dyslexia_model.pkl")

if __name__ == '__main__':
    train_clinical_model()
