"use client";

import * as React from "react";
import type { ToastProps } from "./toast";

type Toast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

interface ToastState {
  toasts: Toast[];
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(next: ToastState) {
  memoryState = next;
  listeners.forEach((l) => l(memoryState));
}

let counter = 0;
const TOAST_REMOVE_DELAY = 5000;

export function toast(opts: Omit<Toast, "id">) {
  const id = `toast-${++counter}`;
  const t: Toast = { ...opts, id };
  dispatch({ toasts: [t, ...memoryState.toasts].slice(0, 5) });
  setTimeout(() => {
    dispatch({ toasts: memoryState.toasts.filter((x) => x.id !== id) });
  }, TOAST_REMOVE_DELAY);
  return { id };
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (id: string) =>
      dispatch({ toasts: memoryState.toasts.filter((t) => t.id !== id) }),
  };
}
