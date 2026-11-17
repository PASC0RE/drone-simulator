import { create } from 'zustand';

const BEST_KEY = 'skydeck.best.v1';

function readBest() {
  try {
    return JSON.parse(window.localStorage.getItem(BEST_KEY) || '{}');
  } catch {
    return {};
  }
}

// run = snapshot of the current run (see course.js createRun) + { arrow, distance, altDelta }
export const useChallengeStore = create((set, get) => ({
  run: null,
  course: null,
  best: {},

  setCourse: (course) => set({ course, run: null }),
  setRun: (run) => set({ run }),

  loadBest: () => set({ best: readBest() }),
  // returns true if this is a new personal best
  saveBest: (key, score) => {
    const best = { ...readBest() };
    const isBest = !(key in best) || score > best[key];
    if (isBest) {
      best[key] = score;
      try {
        window.localStorage.setItem(BEST_KEY, JSON.stringify(best));
      } catch {
        /* storage may be blocked: the score is still shown for this session */
      }
    }
    set({ best });
    return isBest;
  },
  bestFor: (key) => get().best[key] ?? null,
}));
