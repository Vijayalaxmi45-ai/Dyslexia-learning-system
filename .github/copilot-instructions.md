# Copilot Instructions for Dyslexia Learning Support System

## Project Mission
Adaptive web application that provides personalized, multi-sensory learning (visual, audio, interactive) for students with dyslexia. Key principle: **minimize text, maximize accessibility**.

## Architecture Overview

### Three-Layer State Management (Context API)
The app uses three separate contexts, each handling distinct concerns:

1. **AccessibilityContext** (`src/contexts/AccessibilityContext.jsx`): Manages dyslexia-friendly UI preferences
   - Persisted to localStorage automatically
   - Consumed via `useAccessibility()` hook
   - Properties: `fontSize`, `fontFamily`, `lineSpacing`, `backgroundColor`, `darkMode`, `audioEnabled`, `colorContrast`

2. **AuthContext** (`src/contexts/AuthContext.jsx`): Handles user authentication and role-based access
   - Integrates with Firebase Auth
   - Tracks user role: `student`, `teacher`, or `parent`
   - Loading state management for auth initialization

3. **LearningContext** (`src/contexts/LearningContext.jsx`): Tracks user learning progress and scores
   - Persisted to localStorage

**Pattern**: Each context provides a custom hook (`useAccessibility()`, `useAuth()`, `useLearning()`) for consuming its state. Always use these hooks rather than importing context directly.

### Routing Structure
React Router v6 configuration in `App.jsx`:
- `/` - LandingPage
- `/login`, `/register` - Auth pages (redirect to dashboard if already logged in)
- `/dashboard` - Main hub after authentication
- `/learning/:moduleId` - Core learning modules (Alphabet, Words, Sentences, Stories)
- `/games`, `/assessment`, `/progress`, `/settings` - Specialized pages

### External Integrations
- **Firebase**: Authentication, Firestore database, Storage
  - Config: `src/services/firebase.js` (uses env vars)
  - Methods: `auth`, `db`, `storage` exported from firebase.js
- **Web Speech API**: Text-to-Speech via `SpeechService` (`src/services/speechService.js`)
  - Methods: `speak()`, `stop()`, `isSpeaking()`, `speakWithHighlight()`
  - Always check browser support before using

## Dyslexia-Friendly Design Patterns

### Accessibility Utilities
Use `getAccessibilityClasses()` from `src/utils/accessibility.js` to apply consistent styling:
```jsx
const { accessibility } = useAccessibility();
<div className={getAccessibilityClasses(accessibility)}>
  Automatically applies font, size, spacing, and color based on user preferences
</div>
```

### Tailwind Dyslexia Theme
Defined in `tailwind.config.js`:
- Colors: `dyslexia-cream`, `dyslexia-lightBlue`, `dyslexia-lightGreen`, `dyslexia-softOrange`
- Fonts: `font-dyslexic` (OpenDyslexic), `font-sans` (fallback)
- Spacing: `spacing-accessible` (1.5rem), readable sizes: `text-accessible-sm`, `text-accessible-base`, `text-accessible-lg`

### Core UI Principles
- Minimum text per screen, use emoji & icons instead
- Large buttons (min 48px height) with clear focus states
- Soft gradient backgrounds, never harsh white
- Every page should support audio (via `SpeechService`)
- Color contrast control for visual accessibility
- No punitive feedback in quizzes/assessments (friendly errors only)

## Error-Tolerant Spelling Validation
When checking user spelling, use `checkSpelling()` from `src/utils/accessibility.js`:
```jsx
const result = checkSpelling(userInput, correctAnswer);
// Returns: { correct: boolean, distance: number, feedback: string }
// Allows ~30% character variation (Levenshtein distance)
```

## Component Development Guidelines

### Page Components (`src/pages/`)
- Always wrap in `useAccessibility()` hook
- Use `getAccessibilityClasses()` on root container
- Include `useAuth()` for role-based rendering
- Example: [LandingPage.jsx](src/pages/LandingPage.jsx) shows the pattern

### Reusable Components (`src/components/`)
- Keep stateless where possible; use hooks for state
- Accept `className` prop for layout flexibility
- Ensure all interactive elements have visible focus states
- Document required props/hooks

### Custom Hooks (`src/hooks/`)
- Prefix with `use` (React convention)
- Throw errors if used outside required Provider
- Example: `useAccessibility()` validates it's within `AccessibilityProvider`

## Firebase Patterns

### Authentication
```jsx
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

// In auth actions
const userCredential = await signInWithEmailAndPassword(auth, email, password);
```

### Firestore Operations
```jsx
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Fetch user progress
const q = query(collection(db, 'progress'), where('userId', '==', user.uid));
const snapshot = await getDocs(q);
```

## Building & Testing

### Commands
- `npm start` - Development server (http://localhost:3000)
- `npm test` - Run Jest tests
- `npm run build` - Production build (optimized)
- `npm run lint` - Check ESLint errors
- `npm run format` - Format with Prettier

### Testing Convention
Tests colocate with components: `ComponentName.test.jsx` next to `ComponentName.jsx`
Focus on accessibility: test keyboard navigation, focus management, ARIA labels

## Learning Module Data Structure
Reference this when creating learning content components:
```javascript
{
  id: 'alphabet-a',
  title: 'Letter A',
  type: 'alphabet|word|sentence|story',
  content: {
    text: 'A is for Apple',
    audio: 'url-to-audio.mp3',
    image: 'url-to-image.jpg',
    syllables: ['A', 'pple']  // For phonics highlighting
  },
  activities: ['tts', 'repeat', 'spell', 'match']  // Available interactions
}
```

## Performance Considerations
- Lazy load page components using `React.lazy()` + `Suspense`
- Memoize expensive components/utilities: `React.memo()`, `useMemo()`
- Cache speech synthesis results in localStorage
- Limit re-renders using dependency arrays in useEffect/useCallback

## Key Files to Review First
1. [App.jsx](src/App.jsx) - Overall routing and provider setup
2. [AccessibilityContext.jsx](src/contexts/AccessibilityContext.jsx) - Core state pattern
3. [LandingPage.jsx](src/pages/LandingPage.jsx) - UI pattern example
4. [accessibility.js](src/utils/accessibility.js) - Dyslexia utilities
5. [tailwind.config.js](tailwind.config.js) - Design tokens

## Common Tasks

### Add a New Learning Module Page
1. Create `src/pages/ModuleName.jsx`
2. Import and use `useAccessibility()`, `useAuth()`, `useLearning()` hooks
3. Wrap content with `getAccessibilityClasses()`
4. Add route to `App.jsx`
5. Implement `SpeechService.speak()` for audio support

### Add Accessibility Setting
1. Add property to initial state in `AccessibilityContext.jsx`
2. Create UI control in `SettingsPage.jsx`
3. Use `updateAccessibility()` to persist
4. Reference in `getAccessibilityClasses()` if visual, or consume directly if behavioral

### Connect Firebase Data
1. Import `db` from `services/firebase.js`
2. Use Firestore queries (`getDocs`, `query`, `where`, etc.)
3. Handle loading/error states
4. Store user-specific data under `/users/{uid}/` collection structure

## Accessibility Checklist for New Features
- [ ] Minimum 48px touch targets
- [ ] Tested with OpenDyslexic font
- [ ] Text-to-speech option available
- [ ] Keyboard navigable (Tab, Enter, Escape)
- [ ] Focus visible on all interactive elements
- [ ] Color contrast meets WCAG AA standards
- [ ] No time-limited interactions (or provide pause option)
- [ ] Friendly error messages (no "Invalid input")
