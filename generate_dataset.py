import pandas as pd
import numpy as np
import os

def generate_realistic_dyslexia_data(n_samples=1500):
    np.random.seed(42)
    
    data = []
    for _ in range(n_samples):
        # Base profile (random 0-10 scores)
        base = np.random.randint(4, 9) 
        
        # Decide if this sample has dyslexia indicators
        # 0: No, 1: Mild, 2: Strong
        class_roll = np.random.random()
        if class_roll < 0.6:
            label = 0
        elif class_roll < 0.85:
            label = 1
        else:
            label = 2
            
        # Feature generation based on label
        if label == 0:
            phonological = np.random.randint(7, 11)
            rhyming = np.random.randint(7, 11)
            naming = np.random.randint(7, 11)
            decoding = np.random.randint(7, 11)
            spelling = np.random.randint(6, 11)
            writing = np.random.randint(6, 11)
            memory = np.random.randint(7, 11)
            reversals = np.random.randint(0, 3)
            place_loss = np.random.randint(0, 3)
            attention = np.random.randint(6, 11)
            family = 1 if np.random.random() < 0.1 else 0
        elif label == 1:
            phonological = np.random.randint(4, 8)
            rhyming = np.random.randint(4, 8)
            naming = np.random.randint(5, 9)
            decoding = np.random.randint(4, 8)
            spelling = np.random.randint(3, 7)
            writing = np.random.randint(4, 8)
            memory = np.random.randint(4, 8)
            reversals = np.random.randint(2, 6)
            place_loss = np.random.randint(2, 6)
            attention = np.random.randint(4, 9)
            family = 1 if np.random.random() < 0.3 else 0
        else:
            phonological = np.random.randint(0, 5)
            rhyming = np.random.randint(0, 5)
            naming = np.random.randint(2, 6)
            decoding = np.random.randint(0, 5)
            spelling = np.random.randint(0, 4)
            writing = np.random.randint(1, 5)
            memory = np.random.randint(1, 5)
            reversals = np.random.randint(5, 11)
            place_loss = np.random.randint(5, 11)
            attention = np.random.randint(2, 7)
            family = 1 if np.random.random() < 0.6 else 0
            
        data.append([
            phonological, rhyming, naming, decoding, spelling,
            writing, memory, reversals, place_loss, attention,
            family, label
        ])
        
    columns = [
        'phonological_awareness', 'rhyming_score', 'rapid_naming_speed',
        'decoding_accuracy', 'spelling_accuracy', 'writing_speed',
        'memory_span', 'reversals_frequency', 'visual_place_loss',
        'attention_span', 'family_history', 'target'
    ]
    df = pd.DataFrame(data, columns=columns)
    
    # Save to CSV
    df.to_csv('dyslexia_data.csv', index=False)
    print(f"Realistic dataset generated with {n_samples} samples and saved to dyslexia_data.csv")

if __name__ == '__main__':
    generate_realistic_dyslexia_data()
