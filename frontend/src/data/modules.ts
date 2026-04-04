export type LearningModule = {
  id: string;
  title: string;
  icon: string;
  description: string;
  fullDescription: string;
  strategies: { name: string; id: string; desc: string; action: string }[];
};

export const MODULES: Record<string, LearningModule> = {
  reading: {
    id: 'reading',
    title: 'Reading Solutions',
    icon: '📚',
    description: 'Techniques to improve reading speed and comprehension.',
    fullDescription:
      'Reading tools help reduce visual stress and improve word recognition through structured practice.',
    strategies: [
      { name: 'Colored Overlays', id: 'overlay-tool', desc: 'Digital filters to reduce glare.', action: 'Apply Filter' },
      { name: 'Guided Reading', id: 'guided-tool', desc: 'Focus on one line at a time.', action: 'Launch Tool' },
      { name: 'Dyslexic Fonts', id: 'font-tool', desc: 'Weighted fonts to reduce letter confusion.', action: 'Switch Font' },
    ],
  },
  writing: {
    id: 'writing',
    title: 'Writing Support',
    icon: '✍️',
    description: 'Tools and tips for spelling and grammar.',
    fullDescription: 'Express ideas with less friction using dictation, mapping, and pattern-aware checks.',
    strategies: [
      { name: 'Dictation', id: 'dictation-tool', desc: 'Voice to text.', action: 'Start' },
      { name: 'Mind Mapping', id: 'mindmap-tool', desc: 'Organize thoughts visually.', action: 'Open Map' },
      { name: 'Grammar Assistant', id: 'grammar-tool', desc: 'Checks tuned for common patterns.', action: 'Check Text' },
    ],
  },
  memory: {
    id: 'memory',
    title: 'Memory Aids',
    icon: '🧠',
    description: 'Remember instructions and sequences.',
    fullDescription: 'Visual schedules, broken-down steps, and quick voice reminders.',
    strategies: [
      { name: 'Visual Timetables', id: 'timetable-tool', desc: 'Icons and colors for the day.', action: 'View' },
      { name: 'Sequence Breaker', id: 'sequence-tool', desc: 'Split complex tasks.', action: 'Simplify' },
      { name: 'Voice Notes', id: 'voice-tool', desc: 'Short audio reminders.', action: 'Record' },
    ],
  },
  focus: {
    id: 'focus',
    title: 'Focus Support',
    icon: '🎯',
    description: 'Reduce distractions and build concentration.',
    fullDescription: 'Timers, ambient sound, and single-task focus.',
    strategies: [
      { name: 'Pomodoro', id: 'pomodoro-tool', desc: 'Work in focused bursts.', action: 'Start' },
      { name: 'Noise Masking', id: 'noise-tool', desc: 'Gentle background sound.', action: 'Play' },
      { name: 'Task Limiter', id: 'limit-tool', desc: 'One priority at a time.', action: 'Set Goal' },
    ],
  },
  math: {
    id: 'math',
    title: 'Math Mastering',
    icon: '🔢',
    description: 'Strategies for number sense and symbols.',
    fullDescription: 'Visual tools and step-by-step breakdowns.',
    strategies: [
      { name: 'Visual Abacus', id: 'abacus-tool', desc: 'See quantities.', action: 'Open' },
      { name: 'Math Breakdown', id: 'mathbreak-tool', desc: 'Step-by-step solving.', action: 'Analyze' },
      { name: 'Symbol Decoder', id: 'symbol-tool', desc: 'Explain notation.', action: 'Decode' },
    ],
  },
  org: {
    id: 'org',
    title: 'Organization',
    icon: '📁',
    description: 'Structure your digital and physical space.',
    fullDescription: 'Color filing, declutter tips, and routine checklists.',
    strategies: [
      { name: 'Color Filing', id: 'filing-tool', desc: 'Find papers faster.', action: 'Guide' },
      { name: 'Digital Declutter', id: 'declutter-tool', desc: 'Folder hygiene.', action: 'Sort' },
      { name: 'Routine Builder', id: 'routine-tool', desc: 'Habit checklists.', action: 'Build' },
    ],
  },
};

export const MODULE_LIST = Object.values(MODULES);
