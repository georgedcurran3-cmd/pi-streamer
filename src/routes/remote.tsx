import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Home,
  Menu,
  Pause,
  Play,
  Rewind,
  Search,
  Bookmark,
  Undo2,
  Volume1,
  Volume2,
  VolumeX,
  FastForward,
} from "lucide-react";
import { useRemoteChannel, type RemoteKey, type TvState } from "@/lib/remote";

export const Route = createFileRoute("/remote")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search["code"] === "string" ? search["code"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Remote — Curran TV" },
      { name: "description", content: "Turn your phone into the remote control for your Curran TV." },
      { property: "og:title", content: "Remote — Curran TV" },
      { property: "og:description", content: "Turn your phone into the remote control for your Curran TV." },
    ],
  }),
  component: Remote,
});

function Remote() {
  const { code: initialCode } = Route.useSearch();
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [entered, setEntered] = useState(Boolean(initialCode));
  const [state, setState] = useState<TvState | null>(null);
  const [tab, setTab] = useState<"remote" | "search" | "playing">("remote");
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<"search" | "youtube">("search");
  const [volume, setVolume] = useState(80);

  const { send, connected } = useRemoteChannel(entered ? code : null, setState);

  useEffect(() => {
    if (state?.volume !== undefined) setVolume(state.volume);
  }, [state?.volume]);

  // Live-type: every keystroke lands on the TV.
  useEffect(() => {
    if (!entered) return;
    const timer = window.setTimeout(() => {
      if (query.trim().length > 1) send({ kind: "text", value: query, target });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, target, entered, send]);

  const nowPlaying = state?.nowPlaying ?? null;

  if (!entered) return <PairScreen code={code} setCode={setCode} onPair={() => setEntered(true)} />;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <header className="glass-panel sticky top-0 z-10 flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-primary">Curran</p>
          <p className="text-xs text-muted-foreground">
            {connected ? `Connected to ${state?.deviceName ?? "TV"}` : "Waiting for the TV…"}
          </p>
        </div>
        <span
          className={`size-2.5 rounded-full ${connected ? "bg-primary" : "bg-muted-foreground"}`}
          aria-hidden
        />
      </header>

      <nav className="flex gap-2 px-5 py-4">
        {(["remote", "search", "playing"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold capitalize ${
              tab === key ? "bg-primary text-primary-foreground" : "glass-panel text-muted-foreground"
            }`}
          >
            {key === "playing" ? "Now playing" : key}
          </button>
        ))}
      </nav>

      {tab === "remote" ? (
        <RemotePad send={send} volume={volume} setVolume={setVolume} muted={state?.muted ?? false} />
      ) : null}

      {tab === "search" ? (
        <SearchPane
          query={query}
          setQuery={setQuery}
          target={target}
          setTarget={setTarget}
          results={state?.results ?? []}
        />
      ) : null}

      {tab === "playing" ? (
        <NowPlaying nowPlaying={nowPlaying} send={send} volume={volume} setVolume={setVolume} />
      ) : null}
    </div>
  );
}

function PairScreen({
  code,
  setCode,
  onPair,
}: {
  code: string;
  setCode: (value: string) => void;
  onPair: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-8 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-[0.35em] text-primary">Curran</p>
        <h1 className="mt-4 text-2xl font-extrabold">Pair your phone</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the code shown on your TV's Settings screen.
        </p>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          inputMode="text"
          autoCapitalize="characters"
          className="mt-6 w-full rounded-2xl bg-secondary py-4 text-center font-display text-3xl font-extrabold tracking-[0.35em] outline-none"
        />
        <button
          onClick={onPair}
          disabled={code.length < 4}
          className="mt-5 w-full rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          Connect
        </button>
      </div>
    </div>
  );
}

function RemotePad({
  send,
  volume,
  setVolume,
  muted,
}: {
  send: (command: import("@/lib/remote").RemoteCommand) => void;
  volume: number;
  setVolume: (value: number) => void;
  muted: boolean;
}) {
  const key = (k: RemoteKey) => () => send({ kind: "key", key: k });

  return (
    <div className="flex flex-1 flex-col gap-6 px-5">
      <div className="glass-panel mx-auto grid aspect-square w-full max-w-xs grid-cols-3 grid-rows-3 place-items-center rounded-[2rem] p-4">
        <span />
        <PadButton onClick={key("up")} label="Up">
          <ChevronUp className="size-7" />
        </PadButton>
        <span />
        <PadButton onClick={key("left")} label="Left">
          <ChevronLeft className="size-7" />
        </PadButton>
        <button
          onClick={key("ok")}
          className="size-20 rounded-full bg-primary text-sm font-extrabold text-primary-foreground active:scale-95"
        >
          OK
        </button>
        <PadButton onClick={key("right")} label="Right">
          <ChevronRight className="size-7" />
        </PadButton>
        <span />
        <PadButton onClick={key("down")} label="Down">
          <ChevronDown className="size-7" />
        </PadButton>
        <span />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <SmallButton onClick={key("back")} icon={<Undo2 className="size-5" />} label="Back" />
        <SmallButton onClick={key("home")} icon={<Home className="size-5" />} label="Home" />
        <SmallButton onClick={key("search")} icon={<Search className="size-5" />} label="Search" />
        <SmallButton onClick={key("menu")} icon={<Menu className="size-5" />} label="Menu" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SmallButton
          onClick={() => send({ kind: "transport", action: "rewind" })}
          icon={<Rewind className="size-5" />}
          label="−15s"
        />
        <SmallButton
          onClick={() => send({ kind: "transport", action: "playpause" })}
          icon={<Play className="size-5" />}
          label="Play / Pause"
        />
        <SmallButton
          onClick={() => send({ kind: "transport", action: "forward" })}
          icon={<FastForward className="size-5" />}
          label="+15s"
        />
      </div>

      <VolumeBar send={send} volume={volume} setVolume={setVolume} muted={muted} />

      <div className="grid grid-cols-2 gap-3 pb-4">
        <SmallButton
          onClick={() => send({ kind: "navigate", to: "/my-list" })}
          icon={<Bookmark className="size-5" />}
          label="My List"
        />
        <SmallButton
          onClick={() => send({ kind: "navigate", to: "/youtube" })}
          icon={<Play className="size-5" />}
          label="YouTube"
        />
      </div>
    </div>
  );
}

function VolumeBar({
  send,
  volume,
  setVolume,
  muted,
}: {
  send: (command: import("@/lib/remote").RemoteCommand) => void;
  volume: number;
  setVolume: (value: number) => void;
  muted: boolean;
}) {
  return (
    <div className="glass-panel flex items-center gap-4 rounded-2xl px-5 py-4">
      <button onClick={() => send({ kind: "mute", value: !muted })} aria-label="Mute">
        {muted ? (
          <VolumeX className="size-5 text-destructive" />
        ) : volume > 50 ? (
          <Volume2 className="size-5" />
        ) : (
          <Volume1 className="size-5" />
        )}
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(event) => {
          const next = Number(event.target.value);
          setVolume(next);
          send({ kind: "volume", value: next });
        }}
        className="h-1.5 w-full appearance-none rounded-full bg-muted accent-primary"
      />
      <span className="w-8 text-right text-xs text-muted-foreground">{volume}</span>
    </div>
  );
}

function SearchPane({
  query,
  setQuery,
  target,
  setTarget,
  results,
}: {
  query: string;
  setQuery: (value: string) => void;
  target: "search" | "youtube";
  setTarget: (value: "search" | "youtube") => void;
  results: TvState["results"];
}) {
  const placeholder = useMemo(
    () => (target === "youtube" ? "Search YouTube…" : "Search films and TV…"),
    [target],
  );

  return (
    <div className="flex flex-1 flex-col gap-4 px-5">
      <div className="flex gap-2">
        <button
          onClick={() => setTarget("search")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
            target === "search" ? "bg-primary text-primary-foreground" : "glass-panel text-muted-foreground"
          }`}
        >
          Films &amp; TV
        </button>
        <button
          onClick={() => setTarget("youtube")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
            target === "youtube" ? "bg-primary text-primary-foreground" : "glass-panel text-muted-foreground"
          }`}
        >
          YouTube
        </button>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        autoFocus
        className="glass-panel w-full rounded-2xl px-5 py-4 text-base outline-none placeholder:text-muted-foreground"
      />
      <p className="text-xs text-muted-foreground">
        What you type appears on the TV straight away. Pick a result there, or tap one below.
      </p>

      <ul className="space-y-2">
        {results.map((result) => (
          <li key={result.id} className="glass-panel rounded-2xl px-4 py-3">
            <p className="text-sm font-semibold">{result.title}</p>
            {result.subtitle ? (
              <p className="text-xs text-muted-foreground">{result.subtitle}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NowPlaying({
  nowPlaying,
  send,
  volume,
  setVolume,
}: {
  nowPlaying: TvState["nowPlaying"];
  send: (command: import("@/lib/remote").RemoteCommand) => void;
  volume: number;
  setVolume: (value: number) => void;
}) {
  if (!nowPlaying) {
    return (
      <div className="flex flex-1 items-center justify-center px-8 text-center text-sm text-muted-foreground">
        Nothing is playing on the TV right now.
      </div>
    );
  }

  const progress = nowPlaying.duration
    ? Math.min(100, (nowPlaying.position / nowPlaying.duration) * 100)
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 px-5">
      <div className="glass-panel overflow-hidden rounded-3xl p-5 text-center">
        {nowPlaying.artwork ? (
          <img
            src={nowPlaying.artwork}
            alt=""
            className="mx-auto max-h-64 rounded-2xl object-cover shadow-panel"
          />
        ) : null}
        <p className="mt-5 text-lg font-bold">{nowPlaying.title}</p>
        {nowPlaying.subtitle ? (
          <p className="text-sm text-muted-foreground">{nowPlaying.subtitle}</p>
        ) : null}

        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button onClick={() => send({ kind: "transport", action: "rewind" })} aria-label="Rewind">
            <Rewind className="size-7" />
          </button>
          <button
            onClick={() => send({ kind: "transport", action: "playpause" })}
            className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95"
            aria-label="Play or pause"
          >
            {nowPlaying.playing ? <Pause className="size-7" /> : <Play className="size-7 fill-current" />}
          </button>
          <button onClick={() => send({ kind: "transport", action: "forward" })} aria-label="Fast forward">
            <FastForward className="size-7" />
          </button>
        </div>
      </div>

      <VolumeBar send={send} volume={volume} setVolume={setVolume} muted={false} />
    </div>
  );
}

function PadButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex size-16 items-center justify-center rounded-2xl bg-secondary text-foreground active:scale-95"
    >
      {children}
    </button>
  );
}

function SmallButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-panel flex flex-col items-center gap-1.5 rounded-2xl py-3.5 text-[11px] font-semibold text-muted-foreground active:scale-95"
    >
      <span className="text-foreground">{icon}</span>
      {label}
    </button>
  );
}
