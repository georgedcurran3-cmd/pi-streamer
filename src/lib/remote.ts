import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Messages exchanged between the TV and a paired phone. */

export type RemoteKey =
  | "up"
  | "down"
  | "left"
  | "right"
  | "ok"
  | "back"
  | "home"
  | "menu"
  | "search";

export type RemoteCommand =
  | { kind: "key"; key: RemoteKey }
  | { kind: "navigate"; to: string }
  | { kind: "transport"; action: "playpause" | "rewind" | "forward" | "next" | "previous" }
  | { kind: "seek"; seconds: number }
  | { kind: "volume"; value: number }
  | { kind: "mute"; value: boolean }
  | { kind: "text"; value: string; target: "search" | "youtube" }
  | { kind: "open"; target: "movie" | "tv" | "youtube"; id: string | number }
  | { kind: "ping" };

export type TvState = {
  screen: string;
  deviceName: string;
  nowPlaying: {
    title: string;
    subtitle?: string;
    artwork?: string | null;
    playing: boolean;
    position: number;
    duration: number;
  } | null;
  volume: number;
  muted: boolean;
  searchQuery: string;
  results: { id: string; title: string; subtitle?: string; thumb?: string | null; kind: string }[];
};

function channelName(code: string) {
  return `curran-tv-${code.toUpperCase()}`;
}

/** TV side: receive commands, publish state. */
export function useTvChannel(
  code: string | null,
  onCommand: (command: RemoteCommand) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlerRef = useRef(onCommand);
  handlerRef.current = onCommand;
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [remoteName, setRemoteName] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    const channel = supabase.channel(channelName(code), {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "command" }, ({ payload }) => {
        handlerRef.current(payload as RemoteCommand);
      })
      .on("broadcast", { event: "hello" }, ({ payload }) => {
        setRemoteConnected(true);
        setRemoteName((payload as { name?: string })?.name ?? "Phone");
      })
      .on("broadcast", { event: "bye" }, () => {
        setRemoteConnected(false);
        setRemoteName(null);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [code]);

  const publish = useCallback((state: TvState) => {
    channelRef.current?.send({ type: "broadcast", event: "state", payload: state });
  }, []);

  return { publish, remoteConnected, remoteName };
}

/** Phone side: send commands, receive state. */
export function useRemoteChannel(code: string | null, onState: (state: TvState) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlerRef = useRef(onState);
  handlerRef.current = onState;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!code) return;
    const channel = supabase.channel(channelName(code), {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "state" }, ({ payload }) => {
        setConnected(true);
        handlerRef.current(payload as TvState);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          const name =
            typeof navigator !== "undefined" && /iPhone|iPad/.test(navigator.userAgent)
              ? "iPhone"
              : "Phone";
          channel.send({ type: "broadcast", event: "hello", payload: { name } });
        }
      });

    channelRef.current = channel;
    return () => {
      channel.send({ type: "broadcast", event: "bye", payload: {} });
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [code]);

  const send = useCallback((command: RemoteCommand) => {
    channelRef.current?.send({ type: "broadcast", event: "command", payload: command });
  }, []);

  return { send, connected };
}
