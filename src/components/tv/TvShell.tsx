import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  Clapperboard,
  Home,
  MonitorPlay,
  Search,
  Settings,
  Smartphone,
  Tv,
  Youtube,
} from "lucide-react";
import { ensurePairCode, readDeviceName, readLiteMode } from "@/lib/device";
import { useTvChannel, type RemoteCommand } from "@/lib/remote";
import { activateFocused, focusFirst, moveFocus } from "@/lib/tv-focus";
import { getControls, setTvStatus, useTvStatus } from "@/lib/tv-status";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/movies", label: "Movies", icon: Clapperboard },
  { to: "/shows", label: "TV Shows", icon: Tv },
  { to: "/youtube", label: "YouTube", icon: Youtube },
  { to: "/peacock", label: "Peacock", icon: MonitorPlay },
  { to: "/my-list", label: "My List", icon: Bookmark },
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function TvShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [code, setCode] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("Curran TV");
  const status = useTvStatus();
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    setCode(ensurePairCode());
    setDeviceName(readDeviceName());
    if (readLiteMode()) document.documentElement.classList.add("lite");
  }, []);

  const handleCommand = (command: RemoteCommand) => {
    const controls = getControls();
    switch (command.kind) {
      case "key":
        if (command.key === "up" || command.key === "down" || command.key === "left" || command.key === "right") {
          moveFocus(command.key);
        } else if (command.key === "ok") {
          activateFocused();
        } else if (command.key === "back") {
          window.history.back();
        } else if (command.key === "home") {
          void navigate({ to: "/" });
        } else if (command.key === "search") {
          void navigate({ to: "/search", search: { q: "" } });
        } else if (command.key === "menu") {
          void navigate({ to: "/settings" });
        }
        break;
      case "navigate":
        void navigate({ to: command.to as never });
        break;
      case "transport":
        if (command.action === "playpause") controls.playPause?.();
        if (command.action === "rewind") controls.seek?.(-15);
        if (command.action === "forward") controls.seek?.(15);
        break;
      case "seek":
        controls.seek?.(command.seconds);
        break;
      case "volume":
        controls.setVolume?.(command.value);
        setTvStatus({ volume: command.value, muted: false });
        break;
      case "mute":
        controls.setMuted?.(command.value);
        setTvStatus({ muted: command.value });
        break;
      case "text":
        setTvStatus({ searchQuery: command.value });
        if (command.target === "youtube") {
          void navigate({ to: "/youtube", search: { q: command.value } });
        } else {
          void navigate({ to: "/search", search: { q: command.value } });
        }
        break;
      case "open":
        if (command.target === "movie") void navigate({ to: "/movie/$id", params: { id: String(command.id) } });
        if (command.target === "tv") void navigate({ to: "/show/$id", params: { id: String(command.id) } });
        if (command.target === "youtube")
          void navigate({ to: "/youtube/$videoId", params: { videoId: String(command.id) } });
        break;
      default:
        break;
    }
  };

  const { publish, remoteConnected, remoteName } = useTvChannel(code, handleCommand);

  // Publish state whenever it meaningfully changes.
  useEffect(() => {
    publish({
      screen: pathname,
      deviceName,
      nowPlaying: status.nowPlaying,
      volume: status.volume,
      muted: status.muted,
      searchQuery: status.searchQuery,
      results: status.results,
    });
  }, [publish, pathname, deviceName, status]);

  // Keyboard / D-pad navigation on the Pi itself.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          event.preventDefault();
          const map = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
          } as const;
          moveFocus(map[event.key]);
          break;
        }
        case "Enter":
          activateFocused();
          break;
        case "Backspace":
        case "Escape":
          event.preventDefault();
          window.history.back();
          break;
        case " ":
          event.preventDefault();
          getControls().playPause?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => focusFirst(), 350);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="glass-panel mx-4 mt-4 flex items-center gap-2 rounded-2xl px-4 py-2.5 lg:mx-8">
          <span className="mr-3 hidden font-display text-sm font-bold uppercase tracking-[0.3em] text-primary lg:block">
            Curran
          </span>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`tvf flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Smartphone className={`size-4 ${remoteConnected ? "text-primary" : ""}`} />
            <span className="hidden xl:inline">
              {remoteConnected ? `${remoteName} connected` : `Code ${code ?? "····"}`}
            </span>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
