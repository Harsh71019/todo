# Pomodoro Break Timer & Completion UX — Implementation Plan

## Overview

Right now the timer silently hits 0 and stops. This plan adds the full Pomodoro cycle: completion sound, browser notifications, automatic break countdown (5 min short / 15 min long after 4 pomodoros), and a visible break state in the UI.

---

## Current State

- `TimerContext` ticks down from 25:00 and sets `isActive = false` when it hits 0
- No sound, no notification, no break phase
- `completedPomodoros` is tracked per-task on the backend but the client doesn't use the count to trigger long breaks

---

## Desired Behaviour

1. Pomodoro (25 min) ends → play a sound + fire a browser notification
2. Break timer auto-starts:
   - After pomodoro 1, 2, 3 → **5 min short break**
   - After pomodoro 4 (every 4th) → **15 min long break**
3. Break ends → play a different sound + notification prompting to start the next pomodoro
4. User can skip a break at any time
5. Timer pill / task card dot reflects break state

---

## State Changes in `TimerContext`

```ts
type TimerPhase = 'idle' | 'focus' | 'short-break' | 'long-break'

// New state
phase: TimerPhase          // current phase
pomodoroCount: number      // pomodoros completed this session (resets on stopTimer)
```

### Phase transitions

```
idle → focus         (startTimer / resumeTimer)
focus → short-break  (timer hits 0, pomodoroCount % 4 !== 0)
focus → long-break   (timer hits 0, pomodoroCount % 4 === 0)
short-break → idle   (break ends or user skips)
long-break  → idle   (break ends or user skips)
```

---

## Sound

Use the Web Audio API — no external files needed, no bundle size cost.

```ts
// utils/sound.ts
const playTone = (freq: number, duration: number) => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
};

export const playPomodoroComplete = () => playTone(880, 1.2); // high ping
export const playBreakComplete    = () => playTone(440, 1.2); // lower ping
```

No user setting needed for now — volume is fixed at 30%.

---

## Browser Notifications

Request permission once on `TimerProvider` mount. Fire on phase transition.

```ts
// On mount
Notification.requestPermission();

// On focus → break
new Notification('Pomodoro complete! 🍅', {
  body: isLongBreak ? 'Time for a 15-min break.' : 'Take a 5-min break.',
  icon: '/favicon.ico',
});

// On break → idle
new Notification('Break over!', { body: 'Ready for the next pomodoro?' });
```

Notifications only fire when `document.hidden === true` (tab in background) to avoid double feedback.

---

## UI Changes

### `FloatingTimer` pill

| Phase | Colour | Label |
|---|---|---|
| focus | blue | `25:00` countdown |
| short-break | emerald | `Break · 5:00` |
| long-break | violet | `Long Break · 15:00` |
| idle | — | hidden |

Add a **Skip break** button (small, text-only) during break phases.

### `TaskDetailModal` right panel

- Show current phase label above the clock face
- During a break, the "Start Focus" button becomes "Skip Break"
- Pomodoro dot row under the timer: `🍅 🍅 🍅 ⬜` (filled per session count, resets every 4)

---

## New Context API surface

```ts
// Additions to TimerContextValue
phase: TimerPhase
pomodoroCount: number
skipBreak: () => void
```

`skipBreak` sets `phase = 'idle'`, stops the tick, resets `timeLeft` to POMODORO.

---

## Files to Touch

| File | Change |
|---|---|
| `client/src/utils/sound.ts` | new — Web Audio tone helpers |
| `client/src/context/TimerContext.tsx` | add `phase`, `pomodoroCount`, break auto-start logic, sounds, notifications |
| `client/src/components/FloatingTimer.tsx` | colour + label per phase, Skip button |
| `client/src/components/TaskDetailModal.tsx` | phase label, pomodoro dot row, Skip button |

No backend changes required — break sessions are not persisted (they're not focus time).

---

## Out of Scope

- User-configurable durations (keep 25/5/15 hardcoded for now)
- Break session analytics
- Sound volume control
