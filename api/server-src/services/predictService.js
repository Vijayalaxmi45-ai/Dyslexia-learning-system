const DETAILED_SUGGESTIONS = {
  reading: [
    'Use the **Colored Overlays** tool in Reading Solutions to reduce visual stress.',
    'Try the **Guided Reading Ruler** to stay focused on one line at a time.',
    'Enable the **Dyslexic Font** in your settings for better letter recognition.',
  ],
  writing: [
    'Practice using the **Dictation Tool** to capture your thoughts without worrying about spelling.',
    'Use **Mind Mapping** to organize your ideas visually before starting to write.',
    'Try a **Grammar Assistant** designed for dyslexic patterns.',
  ],
  memory: [
    'Create a **Visual Timetable** to keep track of your daily routine.',
    'Use the **Sequence Breaker** to divide complex instructions into single steps.',
    'Use **Voice Notes** for quick reminders during your work sessions.',
  ],
  general: [
    'Explore the **Learning Hub** for personalized strategies.',
    'Join a support group to share experiences and tips.',
    'Break large tasks into smaller, manageable chunks.',
  ],
  math: [
    'Use the **Math Breakdown** tool to solve complex arithmetic step-by-step.',
    'Practice counting using the **Visual Abacus** to build a better number sense.',
    'Use the **Symbol Decoder** if you feel confused by math notations.',
  ],
  focus: [
    'Start a **Pomodoro Timer** (25 on, 5 off) to maintain concentration.',
    'Listen to **Noise Masking** or ambient sounds if you get distracted by silence.',
    'Set a single priority goal for each session using the **Task Limiter**.',
  ],
};

const ANALYSIS_MAP = {
  0: 'Minimal indicators of dyslexia detected. Keep up the good work!',
  1: 'Possible mild indicators of dyslexia found. Consider exploring our tools.',
  2: 'Strong indicators of dyslexia detected. We highly recommend tailored learning strategies.',
};

function buildSuggestions(prediction) {
  let suggestions = [...DETAILED_SUGGESTIONS.general];
  if (prediction >= 1) {
    suggestions = suggestions.concat(DETAILED_SUGGESTIONS.reading, DETAILED_SUGGESTIONS.writing);
  }
  if (prediction === 2) {
    suggestions = suggestions.concat(DETAILED_SUGGESTIONS.memory);
  }
  return suggestions;
}

/** Local fallback aligned with updated RF model features and bands. */
export function predictLocal(answers) {
  // Use the same mapping as Flask for consistency
  const mapping = {
    phonological_awareness: !(answers[3] || answers[8]) ? 8 : 3,
    rhyming_score: !answers[3] ? 8 : 4,
    rapid_naming_speed: !(answers[4] || answers[10]) ? 8 : 3,
    decoding_accuracy: !(answers[0] || answers[8]) ? 8 : 3,
    spelling_accuracy: !answers[3] ? 8 : 2,
    writing_speed: !(answers[5] || answers[7]) ? 8 : 3,
    memory_span: !(answers[2] || answers[9]) ? 8 : 2,
    reversals_frequency: answers[1] ? 8 : 1,
    visual_place_loss: answers[0] || answers[4] || answers[6] ? 8 : 1,
    attention_span: !(answers[10] || answers[11]) ? 8 : 3,
    family_history: 0,
  };

  const features = [
    mapping.phonological_awareness,
    mapping.rhyming_score,
    mapping.rapid_naming_speed,
    mapping.decoding_accuracy,
    mapping.spelling_accuracy,
    mapping.writing_speed,
    mapping.memory_span,
    mapping.reversals_frequency,
    mapping.visual_place_loss,
    mapping.attention_span,
    mapping.family_history
  ];

  // Simple heuristic prediction if ML isn't available
  // Summing indicators: high reversals/place_loss + low scores
  const score = answers.filter(Boolean).length;
  let prediction = 0;
  if (score >= 8) prediction = 2;
  else if (score >= 4) prediction = 1;

  return {
    prediction,
    analysis: ANALYSIS_MAP[prediction],
    suggestions: buildSuggestions(prediction),
    score,
  };
}

export async function predictWithOptionalFlask(answers) {
  const base = process.env.FLASK_ML_URL?.replace(/\/$/, '');
  if (base) {
    try {
      const res = await fetch(`${base}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          prediction: data.prediction,
          analysis: data.analysis,
          suggestions: data.suggestions || buildSuggestions(data.prediction ?? 0),
          score: answers.filter(Boolean).length,
          source: 'flask',
        };
      }
    } catch {
      // fall through
    }
  }
  const local = predictLocal(answers);
  return { ...local, source: 'local' };
}
