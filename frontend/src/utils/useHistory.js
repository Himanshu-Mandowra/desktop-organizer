import { useState, useCallback } from "react";

const HISTORY_LIMIT = 100;
const DEFAULT_COALESCE_MS = 700;

/**
 * Undo / redo state container.
 *
 * - set(updater, { key, window, replace })
 *     key      : edits sharing the same key within `window` ms are merged into ONE undo step
 *                (used for slider drags, typing, mouse resize/drag gestures).
 *     window   : coalescing window in ms (default 700, use Infinity for a whole gesture).
 *     replace  : change the present state without creating an undo step (used for automatic fix-ups).
 * - reset(doc) : replace everything and clear history (used when restoring the saved design).
 *
 * All updaters are pure (they only use the previous state), so this is safe under React StrictMode.
 */
export default function useHistory(initialDoc) {
  const [state, setState] = useState({
    past: [],
    present: initialDoc,
    future: [],
    lastKey: null,
    lastTime: 0,
  });

  const set = useCallback((updater, opts = {}) => {
    const { key = null, window: windowMs = DEFAULT_COALESCE_MS, replace = false } = opts;
    const now = Date.now();

    setState((cur) => {
      const next = typeof updater === "function" ? updater(cur.present) : updater;
      if (next === cur.present) return cur;

      if (replace) return { ...cur, present: next };

      const canMerge =
        key !== null &&
        cur.lastKey === key &&
        now - cur.lastTime < windowMs &&
        cur.past.length > 0;

      if (canMerge) {
        return { ...cur, present: next, future: [], lastTime: now };
      }

      return {
        past: [...cur.past, cur.present].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
        lastKey: key,
        lastTime: now,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((cur) => {
      if (!cur.past.length) return cur;
      const previous = cur.past[cur.past.length - 1];
      return {
        past: cur.past.slice(0, -1),
        present: previous,
        future: [cur.present, ...cur.future],
        lastKey: null,
        lastTime: 0,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((cur) => {
      if (!cur.future.length) return cur;
      const [nextState, ...rest] = cur.future;
      return {
        past: [...cur.past, cur.present].slice(-HISTORY_LIMIT),
        present: nextState,
        future: rest,
        lastKey: null,
        lastTime: 0,
      };
    });
  }, []);

  const reset = useCallback((doc) => {
    setState({ past: [], present: doc, future: [], lastKey: null, lastTime: 0 });
  }, []);

  return {
    doc: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
