import { useEffect, useMemo, useState } from 'react';
import { bus } from '../gestures/gestureBus';

type LogRow = {
  ts: string;
  tag: string;
  text: string;
};

const formatTimestamp = () => {
  return new Date().toTimeString().split(' ')[0];
};

export function SubagentsPanel() {
  const [open, setOpen] = useState(true);
  const [rows, setRows] = useState<LogRow[]>([]);

  const progress = useMemo(
    () => ({
      planner: 41,
      pm: 55,
      architect: 96,
      frontend: 86,
      backend: 77,
      qa: 99,
      writer: 100,
    }),
    [],
  );

  useEffect(() => {
    const handleMessage = ({ data }: MessageEvent) => {
      const ts = formatTimestamp();
      const tag = String(data?.intent ?? 'event').toUpperCase();
      const text = JSON.stringify(data);

      setRows((current) => [{ ts, tag, text }, ...current].slice(0, 200));
    };

    bus.addEventListener('message', handleMessage);
    return () => {
      bus.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <aside
      className={`fixed top-0 right-0 z-[70] h-full w-[360px] border-l border-zinc-800 bg-zinc-950/95 text-zinc-50 shadow-xl transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <button
        type="button"
        className="absolute left-[-44px] top-4 rounded-l-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 shadow"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? '›' : '‹'} Agents
      </button>
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <header>
          <h3 className="text-lg font-semibold tracking-tight">Goose subagents</h3>
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            Parallel activity monitor
          </p>
        </header>

        <section className="space-y-3">
          {Object.entries(progress).map(([key, value]) => (
            <div key={key}>
              <div className="text-xs uppercase tracking-wide text-zinc-400">
                {key}
              </div>
              <div className="mt-1 h-2 rounded bg-zinc-800">
                <div
                  className="h-2 rounded bg-sky-500 transition-all"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="flex-1">
          <h4 className="text-xs uppercase tracking-wide text-zinc-400">Console</h4>
          <div className="mt-2 h-[45vh] overflow-auto rounded border border-zinc-800 bg-black/50 p-2 text-xs font-mono leading-5 text-zinc-200">
            {rows.map((row, index) => (
              <div key={`${row.ts}-${index}`} className="whitespace-pre">
                [{row.ts}] {row.tag.padEnd(10)} {row.text}
              </div>
            ))}
            {rows.length === 0 ? (
              <p className="text-zinc-500">Waiting for events…</p>
            ) : null}
          </div>
        </section>
      </div>
    </aside>
  );
}

export default SubagentsPanel;
