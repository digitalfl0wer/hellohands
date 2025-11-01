import { useEffect, useMemo, useState } from 'react';
import { bus } from '../gestures/gestureBus';
import { logger } from '../utils/logger';

type LogRow = {
  ts: string;
  tag: string;
  text: string;
};

type AgentKey = 'planner' | 'voice' | 'gesture' | 'prefetch' | 'goose';

const ACTIVE_WINDOW_MS = 6000;

const AGENTS: Array<{
  key: AgentKey;
  label: string;
  description: string;
}> = [
  { key: 'planner', label: 'Lesson Planner', description: 'Sequencing + unlock logic' },
  { key: 'gesture', label: 'Gesture Worker', description: 'MediaPipe detections' },
  { key: 'voice', label: 'Voice Agent', description: 'Web Speech commands' },
  { key: 'prefetch', label: 'Prefetcher', description: 'Asset and pack warms' },
  { key: 'goose', label: 'Goose Orchestrator', description: 'CLI recipe stream' },
];

const formatTimestamp = () => {
  return new Date().toTimeString().split(' ')[0];
};

export function SubagentsPanel() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [activity, setActivity] = useState<Partial<Record<AgentKey, number>>>({});
  const [heartbeat, setHeartbeat] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setHeartbeat(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const markActivity = (key: AgentKey) => {
    setActivity((current) => ({
      ...current,
      [key]: Date.now(),
    }));
  };

  const classifyEvent = (data: unknown): AgentKey | null => {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const payload = data as Record<string, unknown>;
    const intent = typeof payload.intent === 'string' ? payload.intent : null;

    switch (intent) {
      case 'gesture':
        return 'gesture';
      case 'voice':
        return 'voice';
      case 'prefetch':
        return 'prefetch';
      case 'planner':
        return payload.action === 'GOOSE_LOG' ? 'goose' : 'planner';
      case 'log': {
        const tag = typeof payload.tag === 'string' ? payload.tag : '';
        if (tag.startsWith('voice')) return 'voice';
        if (tag.startsWith('gesture')) return 'gesture';
        if (tag.startsWith('goose')) return 'goose';
        if (tag.startsWith('practice') || tag.startsWith('progress')) return 'planner';
        return null;
      }
      default:
        return null;
    }
  };

  const formatAge = (lastSeen?: number) => {
    if (!lastSeen) return 'Waiting';
    const delta = heartbeat - lastSeen;
    if (delta < 1500) return 'Now';
    if (delta < 60_000) return `${Math.round(delta / 1000)}s ago`;
    return `${Math.round(delta / 60_000)}m ago`;
  };

  const agentStatuses = useMemo(
    () =>
      AGENTS.map((agent) => {
        const last = activity[agent.key];
        const delta = last ? heartbeat - last : Number.POSITIVE_INFINITY;
        const active = delta < ACTIVE_WINDOW_MS;
        const pct = active
          ? Math.max(
              12,
              Math.round(((ACTIVE_WINDOW_MS - delta) / ACTIVE_WINDOW_MS) * 100),
            )
          : 6;
        return {
          ...agent,
          last,
          active,
          pct,
          label: agent.label,
          description: agent.description,
        };
      }),
    [activity, heartbeat],
  );

  useEffect(() => {
    const handleMessage = ({ data }: MessageEvent) => {
      const ts = formatTimestamp();
      const tag = String(data?.intent ?? 'event').toUpperCase();
      const text = JSON.stringify(data);

      setRows((current) => [{ ts, tag, text }, ...current].slice(0, 200));

      const agentKey = classifyEvent(data);
      if (agentKey) {
        markActivity(agentKey);
      }
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
          {agentStatuses.map((agent) => (
            <div key={agent.key}>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-400">
                    {agent.label}
                  </div>
                  <p className="text-[10px] text-zinc-500">{agent.description}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    agent.active ? 'text-emerald-400' : 'text-zinc-500'
                  }`}
                >
                  {agent.active ? 'Active' : 'Idle'} · {formatAge(agent.last)}
                </span>
              </div>
              <div className="mt-2 h-2 rounded bg-zinc-800">
                <div
                  className={`h-2 rounded transition-all ${
                    agent.active ? 'bg-sky-500' : 'bg-zinc-600'
                  }`}
                  style={{ width: `${agent.pct}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="flex-1">
          <h4 className="text-xs uppercase tracking-wide text-zinc-400">Console</h4>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => logger.download()}
              className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-500 hover:text-white"
            >
              Export logs
            </button>
          </div>
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
