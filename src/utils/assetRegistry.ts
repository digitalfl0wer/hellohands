import registry from '../../assets/registry.json';

type LottieEntry = {
  id: string;
  title: string;
  path: string;
  variant?: string;
  type?: string;
};

type MascotEntry = {
  id: string;
  title: string;
  path: string;
  state: string;
};

type StickerEntry = {
  id: string;
  title: string;
  path: string;
  rarity: string;
  alt: string;
};

type RawRegistry = {
  version: string;
  lottie: Record<string, LottieEntry>;
  mascot: Record<string, MascotEntry>;
  stickers: Record<string, StickerEntry>;
};

const typedRegistry = registry as RawRegistry;

export type LottieAssetId = keyof RawRegistry['lottie'];
export type MascotAssetId = keyof RawRegistry['mascot'];
export type StickerAssetId = keyof RawRegistry['stickers'];

export function getLottieAsset(id: LottieAssetId): LottieEntry | undefined {
  return typedRegistry.lottie[id as string];
}

export function getMascotAsset(id: MascotAssetId): MascotEntry | undefined {
  return typedRegistry.mascot[id as string];
}

export function getMascotAssetByState(state: string): MascotEntry | undefined {
  const entries = Object.values(typedRegistry.mascot);
  return entries.find((entry) => entry.state === state);
}

export function getStickerAsset(id: StickerAssetId): StickerEntry | undefined {
  return typedRegistry.stickers[id as string];
}
