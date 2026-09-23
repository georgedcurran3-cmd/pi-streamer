import { useSyncExternalStore } from "react";
import type { TvState } from "@/lib/remote";

/** Tiny shared store describing what the TV is doing right now. */

type Status = Pick<TvState, "nowPlaying" | "volume" | "muted" | "searchQuery" | "results">;

let status: Status = {
  nowPlaying: null,
  volume: 80,
  muted: false,
  searchQuery: "",
  results: [],
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setTvStatus(patch: Partial<Status>) {
  status = { ...status, ...patch };
  emit();
}

export function getTvStatus() {
  return status;
}

export function useTvStatus() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => status,
  );
}

/** Playback controls registered by whichever player is on screen. */
type Controls = {
  playPause?: () => void;
  seek?: (seconds: number) => void;
  setVolume?: (value: number) => void;
  setMuted?: (value: boolean) => void;
};

let controls: Controls = {};

export function registerControls(next: Controls) {
  controls = next;
  return () => {
    controls = {};
  };
}

export function getControls() {
  return controls;
}
