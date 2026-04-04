import { useEffect, useRef, useState } from 'react';
import { speakText } from '@/components/TextToSpeech';

export function Tools() {
  const [text, setText] = useState(
    'Paste or type text here. Use Read aloud for text-to-speech. Try Speak to practice pronunciation—the browser will transcribe what it hears.'
  );
  const [dyslexic, setDyslexic] = useState(false);
  const [live, setLive] = useState('');
  const recRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    document.body.classList.toggle('dyslexic-font', dyslexic);
    return () => document.body.classList.remove('dyslexic-font');
  }, [dyslexic]);

  function startListen() {
    const w = window as Window & {
      webkitSpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
        onerror: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      SpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
        onerror: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setLive('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setLive(t);
    };
    r.onerror = () => setLive('Could not access the microphone. Check permissions.');
    recRef.current = r;
    r.start();
  }

  return (
    <div className="container-page" style={{ paddingTop: '1.5rem', maxWidth: 800 }}>
      <h1 style={{ marginTop: 0 }}>Accessibility lab</h1>
      <p style={{ color: 'var(--muted)' }}>
        Text-to-speech uses your browser voice. Speech practice uses the Web Speech API (where available).
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        <button type="button" className="btn-primary" onClick={() => speakText(text)}>
          🔊 Read aloud
        </button>
        <button type="button" className="btn-ghost" onClick={() => speakText(window.getSelection()?.toString() || text)}>
          Read selection
        </button>
        <button type="button" className="btn-ghost" onClick={startListen}>
          🎤 Speak (transcribe)
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
          <input type="checkbox" checked={dyslexic} onChange={(e) => setDyslexic(e.target.checked)} />
          Dyslexia-friendly font
        </label>
      </div>

      <textarea
        className="input"
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ resize: 'vertical', fontFamily: dyslexic ? 'OpenDyslexic, Lexend Deca, sans-serif' : 'inherit' }}
      />

      {live && (
        <div className="glass" style={{ padding: '1rem', marginTop: '1rem' }}>
          <strong>Heard:</strong> {live}
        </div>
      )}

      <style>{`
        @font-face {
          font-family: 'OpenDyslexic';
          src: url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/OpenDyslexic-Regular.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
