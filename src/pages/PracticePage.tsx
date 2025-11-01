import { useEffect, useMemo, useState } from 'react';
import CameraFeed from '../components/CameraFeed';
import SignMedia from '../components/SignMedia';
import { setExpectedGesture } from '../agents/planner';
import {
  PracticeItem,
  PracticePackSummary,
  fetchLicenseInfo,
  getNextPracticeItem,
  getPracticePack,
  listPracticePacks,
} from '../services/practiceApi';

export function PracticePage() {
  const [packs, setPacks] = useState<PracticePackSummary[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [license, setLicense] = useState<{
    dataset: string;
    license: string;
    url: string;
  } | null>(null);
  const SHOW_CAMERA = import.meta.env.VITE_SHOW_CAMERA === '1';

  useEffect(() => {
    let mounted = true;

    listPracticePacks().then((available) => {
      if (!mounted || !available.length) return;
      setPacks(available);
      const firstPack = available[0];
      setSelectedPackId(firstPack.id);
      if (firstPack.items?.length) {
        setItems(firstPack.items);
      } else {
        void getPracticePack(firstPack.id).then((full) => {
          if (mounted && full?.items) {
            setItems(full.items);
          }
        });
      }
    });

    fetchLicenseInfo().then((info) => {
      if (info && mounted) {
        setLicense({ dataset: info.dataset, license: info.license, url: info.url });
      }
    });

    return () => {
      mounted = false;
      setExpectedGesture(null);
    };
  }, []);

  useEffect(() => {
    if (!selectedPackId) return;
    const pack = packs.find((entry) => entry.id === selectedPackId);
    if (pack?.items?.length) {
      setItems(pack.items);
      return;
    }
    void getPracticePack(selectedPackId).then((full) => {
      if (full?.items) {
        setItems(full.items);
      }
    });
  }, [selectedPackId, packs]);

  useEffect(() => {
    if (!items.length) return;
    const item = items.find((entry) => entry.id === selectedItemId) ?? items[0];
    setSelectedItemId(item.id);
    setExpectedGesture(item.expectedGesture);
  }, [items, selectedItemId]);

  const currentPack = useMemo(() => {
    if (!packs.length) return null;
    return packs.find((entry) => entry.id === selectedPackId) ?? packs[0];
  }, [packs, selectedPackId]);

  const currentItem = useMemo(() => {
    if (!items.length) return null;
    return items.find((entry) => entry.id === selectedItemId) ?? items[0];
  }, [items, selectedItemId]);

  const handleSignSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = items.find((entry) => entry.id === itemId);
    if (item) {
      setExpectedGesture(item.expectedGesture);
    }
  };

  const handleSuggestNext = async () => {
    if (!selectedPackId) return;
    const result = await getNextPracticeItem(selectedPackId, selectedItemId ?? undefined);
    if (!result?.item) return;

    if (!items.find((entry) => entry.id === result.item.id)) {
      setItems((prev) => [...prev, result.item]);
    }
    setSelectedPackId(result.pack.id);
    setSelectedItemId(result.item.id);
    setExpectedGesture(result.item.expectedGesture);
  };

  const expectedGestureLabel = items
    .find((item) => item.id === selectedItemId)
    ?.expectedGesture?.replace('_', ' ')
    .toUpperCase();

  return (
    <div className="grid gap-6 p-4 md:grid-cols-2">
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Practice</h2>
        <p className="text-sm text-text-secondary">
          Mirror your gesture to the example. Hold it steady for a moment so the model can
          recognise it.
        </p>
        <div className="mt-4">
          {currentItem ? (
            <SignMedia sign={currentItem.sign} expectedGesture={currentItem.expectedGesture} />
          ) : null}
        </div>
        {SHOW_CAMERA ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <CameraFeed />
          </div>
        ) : null}
      </section>
      <section className="flex flex-col gap-4">
        <div>
          <label
            className="text-xs uppercase tracking-wide text-text-secondary"
            htmlFor="pack-select"
          >
            Practice pack
          </label>
          <select
            id="pack-select"
            value={selectedPackId ?? currentPack?.id ?? ''}
            onChange={(event) => setSelectedPackId(event.target.value)}
            className="mt-1 w-full rounded border border-white/15 bg-surface-800/80 px-3 py-2 text-sm text-text-primary shadow-inner"
          >
            {packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-text-primary">Select a sign</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSignSelect(item.id)}
                className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                  selectedItemId === item.id
                    ? 'border-accent-teal bg-accent-teal/20 text-accent-teal'
                    : 'border-white/15 text-text-secondary hover:border-white/30 hover:text-text-primary'
                }`}
              >
                {item.sign}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSuggestNext}
            className="rounded-full border border-accent-lime/40 bg-accent-lime/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-lime transition hover:border-accent-lime/80"
          >
            Suggest next sign
          </button>
          {currentPack ? (
            <span className="text-xs text-text-secondary">
              {currentPack.title} · {items.length} signs
            </span>
          ) : null}
        </div>

        <dl className="space-y-2 text-sm text-text-secondary">
          <div>
            <dt className="font-semibold text-text-primary">Expected gesture</dt>
            <dd className="uppercase tracking-wide">{expectedGestureLabel ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-primary">Tip</dt>
            <dd>Move slowly at first; quick movements can reduce confidence scores.</dd>
          </div>
        </dl>

        {license ? (
          <p className="text-xs text-text-muted">
            Data source:{' '}
            <a
              className="text-accent-teal underline"
              href={license.url}
              target="_blank"
              rel="noreferrer"
            >
              {license.dataset}
            </a>{' '}
            ({license.license})
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default PracticePage;
