import { useCallback } from 'react';

export function speakText(text: string, rate = 0.95) {
  if (!text.trim() || typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

export function TextToSpeechButton({ text, label = '🔊 Read aloud' }: { text: string; label?: string }) {
  const onClick = useCallback(() => speakText(text), [text]);

  if (!window.speechSynthesis) return null;

  return (
    <button type="button" className="btn-ghost" onClick={onClick}>
      {label}
    </button>
  );
}
