import type { ReactElement } from 'react';
import { getMascotAssetByState } from '../../utils/assetRegistry';

export type PalmaState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'encouraging'
  | 'success'
  | 'oops'
  | 'loading';

type PalmaProps = {
  state: PalmaState;
  className?: string;
  /** Provide alt text only for milestone/meaningful moments; otherwise decorative. */
  alt?: string;
};

export function Palma({ state, className, alt }: PalmaProps): ReactElement | null {
  const asset = getMascotAssetByState(
    state === 'success'
      ? 'success'
      : state === 'oops'
        ? 'oops'
        : state === 'encouraging'
          ? 'encouraging'
          : state === 'thinking'
            ? 'thinking'
            : state === 'loading'
              ? 'loading'
              : 'idle',
  );

  if (!asset) {
    return null;
  }

  const ariaProps = alt
    ? { alt, 'aria-hidden': undefined }
    : { alt: '', 'aria-hidden': 'true' as const };

  return (
    <img
      src={asset.path}
      className={className ?? 'pointer-events-none select-none'}
      {...ariaProps}
    />
  );
}
