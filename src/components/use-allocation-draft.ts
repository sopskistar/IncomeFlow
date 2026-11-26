"use client";
import { useState, useSyncExternalStore } from "react";
import type { RuleDraft } from "@/lib/domain";
const eventName = "incomeflow-allocation-draft";
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", listener);
  };
}
function snapshot(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function decode(value: string | null): RuleDraft[] | null {
  if (!value) return null;
  try {
    const rows: unknown = JSON.parse(value);
    if (
      !Array.isArray(rows) ||
      rows.length < 2 ||
      rows.length > 8 ||
      !rows.every(
        (r) =>
          r &&
          typeof r.recipient === "string" &&
          typeof r.percent === "string" &&
          typeof r.label === "string",
      )
    )
      return null;
    return rows.map((r) => ({
      recipient: r.recipient,
      percent: r.percent,
      label: r.label,
    }));
  } catch {
    return null;
  }
}
export function useAllocationDraft(key: string, initial: RuleDraft[]) {
  const [local, setLocal] = useState(initial);
  const [storageFailed, setStorageFailed] = useState(false);
  const stored = useSyncExternalStore(
    subscribe,
    () => snapshot(key),
    () => null,
  );
  const rows = decode(stored) || local;
  function setRows(next: RuleDraft[]) {
    setLocal(next);
    try {
      window.sessionStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event(eventName));
    } catch {
      setStorageFailed(true);
    }
  }
  function clear(next = initial) {
    setLocal(next);
    try {
      window.sessionStorage.removeItem(key);
      window.dispatchEvent(new Event(eventName));
    } catch {
      setStorageFailed(true);
    }
  }
  return {
    rows,
    setRows,
    clear: () => clear(),
    commit: () => clear(rows),
    storageFailed,
    changed: JSON.stringify(rows) !== JSON.stringify(initial),
  };
}
