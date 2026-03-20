# Dyslexia-learning-system

The Dyslexia Learning Support System is an intelligent web-based application designed to help students with dyslexia improve their reading, writing, and comprehension skills.

This repository contains a Flask web app with a small ML component used for a dyslexia screening assessment.

## ML Model

- Location: `ml_model/dyslexia_model.pkl`
- Trained by: `train_model.py`
- Model type: `sklearn.ensemble.RandomForestClassifier`
- Input: up to 12 binary features (answers to yes/no screening questions)
- Output: class 0 (Minimal), 1 (Mild), 2 (Strong)

Benefits of the chosen model (Random Forest):

- Robust to noisy or synthetic data and performs well out-of-the-box.
- Handles binary and categorical features without heavy preprocessing.
- Provides fast inference suitable for web endpoints.
- Ensemble nature reduces overfitting compared to a single decision tree.

## Deploying to Vercel (manual steps)

1. Install Vercel CLI and log in:

```bash
npm i -g vercel
vercel login
```

2. From the project root, run an initial deploy (it will guide you to connect your Git provider or deploy directly):

```bash
vercel --prod
```

3. If you connect via Git (recommended), add this repo to your Git provider, then import the project on Vercel and set the following Environment Variables in Vercel:

- `SECRET_KEY` (a secure random string)
- `DATABASE_URL` (optional; otherwise the app uses a local SQLite DB)

4. Build & Output: Vercel will use `@vercel/python` to run `app.py` per `vercel.json`. If the deployment requires a different configuration, set the build command to `pip install -r requirements.txt`.

5. Alternatively, you can deploy locally via Heroku/Render if you need a persistent server process (Vercel supports serverless invocation patterns).

If you want, I can: commit these changes, push to a remote Git repository you provide, and/or continue by preparing a Vercel project—I'll need access or API token to create the Vercel project on your behalf.

