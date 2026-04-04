import { useMemo, useState } from 'react';

const PAIRS = [
  { word: 'read', match: 'book' },
  { word: 'focus', match: 'timer' },
  { word: 'spell', match: 'sound' },
  { word: 'map', match: 'ideas' },
];

export function Games() {
  const deck = useMemo(() => {
    const tiles = PAIRS.flatMap((p, i) => [
      { id: `a-${i}`, text: p.word, pair: i },
      { id: `b-${i}`, text: p.match, pair: i },
    ]);
    return tiles.sort(() => Math.random() - 0.5);
  }, []);

  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState(false);

  function tap(id: string, pair: number) {
    if (matched.has(pair)) return;
    if (!picked) {
      setPicked(id);
      return;
    }
    const first = deck.find((t) => t.id === picked);
    const second = deck.find((t) => t.id === id);
    if (!first || !second || first.id === second.id) {
      setPicked(null);
      return;
    }
    if (first.pair === second.pair) {
      setMatched((m) => new Set(m).add(pair));
      setPicked(null);
      setWrong(false);
    } else {
      setWrong(true);
      setTimeout(() => {
        setPicked(null);
        setWrong(false);
      }, 450);
    }
  }

  return (
    <div className="container-page" style={{ paddingTop: '1.5rem', maxWidth: 720 }}>
      <h1 style={{ marginTop: 0 }}>Match pairs</h1>
      <p style={{ color: 'var(--muted)' }}>Tap two cards that belong together. Builds word association without time pressure.</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginTop: '1rem',
        }}
      >
        {deck.map((t) => {
          const isMatched = matched.has(t.pair);
          const isSel = picked === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="glass"
              disabled={isMatched}
              onClick={() => tap(t.id, t.pair)}
              style={{
                padding: '1.25rem',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: isMatched ? 'default' : 'pointer',
                opacity: isMatched ? 0.45 : 1,
                border: isSel ? '2px solid #6366f1' : '1px solid var(--border)',
                background: wrong && isSel ? 'rgba(220,38,38,0.08)' : undefined,
              }}
            >
              {isMatched ? '✓' : ''} {t.text}
            </button>
          );
        })}
      </div>
      {matched.size === PAIRS.length && (
        <p style={{ marginTop: '1.25rem', fontWeight: 700 }}>Nice work — all pairs found.</p>
      )}
    </div>
  );
}
