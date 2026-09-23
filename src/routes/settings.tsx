import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { RefreshCw, Smartphone } from "lucide-react";
import {
  ensurePairCode,
  makeCode,
  readDeviceName,
  readLiteMode,
  savePairCode,
  saveDeviceName,
  saveLiteMode,
} from "@/lib/device";
import { DEFAULT_PROVIDER_BASE, getProviderBase, setProviderBase } from "@/lib/providers";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Curran TV" },
      { name: "description", content: "Pair your phone, name this TV and tune performance for the Pi." },
      { property: "og:title", content: "Settings — Curran TV" },
      {
        property: "og:description",
        content: "Pair your phone, name this TV and tune performance for the Pi.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("Curran TV");
  const [lite, setLite] = useState(false);
  const [provider, setProvider] = useState(DEFAULT_PROVIDER_BASE);
  const [remoteUrl, setRemoteUrl] = useState("");

  useEffect(() => {
    const c = ensurePairCode();
    setCode(c);
    setName(readDeviceName());
    setLite(readLiteMode());
    setProvider(getProviderBase());
    setRemoteUrl(`${window.location.origin}/remote?code=${c}`);
  }, []);

  const persist = async (nextCode: string, nextName: string) => {
    await supabase
      .from("pairings")
      .upsert({ code: nextCode, device_name: nextName, last_seen: new Date().toISOString() });
  };

  const regenerate = () => {
    const next = makeCode();
    savePairCode(next);
    setCode(next);
    setRemoteUrl(`${window.location.origin}/remote?code=${next}`);
    void persist(next, name);
  };

  return (
    <div className="mx-auto max-w-5xl px-8 pb-20 pt-28 lg:px-14">
      <h1 className="text-4xl font-extrabold lg:text-5xl">Settings</h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel title="Connect your phone">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <div className="rounded-2xl bg-foreground p-3">
              {remoteUrl ? <QRCode value={remoteUrl} size={148} bgColor="transparent" fgColor="#000" /> : null}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">Scan with your phone, or open</p>
              <p className="mt-1 break-all text-sm font-semibold text-primary">{remoteUrl}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">Pairing code</p>
              <p className="font-display text-3xl font-extrabold tracking-[0.3em]">{code}</p>
              <button
                onClick={regenerate}
                className="tvf mt-4 inline-flex items-center gap-2 rounded-full glass-panel px-5 py-2.5 text-sm font-semibold"
              >
                <RefreshCw className="size-4" /> New code
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="This device">
          <Field label="Device name">
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                saveDeviceName(event.target.value);
              }}
              onBlur={() => void persist(code, name)}
              className="tvf w-full rounded-xl bg-secondary px-4 py-3 text-sm outline-none"
            />
          </Field>

          <Field label="Raspberry Pi mode">
            <button
              onClick={() => {
                const next = !lite;
                setLite(next);
                saveLiteMode(next);
                document.documentElement.classList.toggle("lite", next);
              }}
              className={`tvf w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${
                lite ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {lite ? "On — blur and animation reduced" : "Off — full visual effects"}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              Turn this on for a Raspberry Pi 3B. It removes glass blur and scaling so the interface
              stays smooth on 1GB of memory.
            </p>
          </Field>
        </Panel>

        <Panel title="Video source">
          <Field label="Provider address">
            <input
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value);
                setProviderBase(event.target.value);
              }}
              className="tvf w-full rounded-xl bg-secondary px-4 py-3 text-sm outline-none"
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Titles are matched through the film database first, then opened on this source using the
            matched ID. Change the address to switch source without touching anything else.
          </p>
        </Panel>

        <Panel title="Accounts and services">
          <Line label="Film database" value="TMDB — key stored securely on the server" />
          <Line label="YouTube" value="Signed in through this TV's browser" />
          <Line label="Peacock" value="Your own subscription, opened in its own player" />
        </Panel>
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-2xl glass-panel p-5 text-sm text-muted-foreground">
        <Smartphone className="size-4 text-primary" />
        Keep the phone and this TV on the same home Wi-Fi for the fastest response.
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel rounded-3xl p-6">
      <h2 className="mb-5 text-lg font-semibold">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-right text-xs text-muted-foreground">{value}</span>
    </div>
  );
}
