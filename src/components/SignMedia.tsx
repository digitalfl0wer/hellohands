type GestureKind =
  | 'thumbs_up'
  | 'open_palm'
  | 'point'
  | 'pinch'
  | 'fist'
  | 'v_sign'
  | 'ok_sign';

type Props = {
  sign: string;
  expectedGesture?: GestureKind;
};

const mediaFor = (name: string) => ({
  webp: `/signs/${name}.webp`,
  gif: `/signs/${name}.gif`,
  png: `/signs/${name}.png`,
});

export default function SignMedia({ sign, expectedGesture }: Props) {
  const normalized = sign.toUpperCase();
  const m = mediaFor(normalized);
  return (
    <figure className="w-64">
      <picture>
        <source srcSet={m.webp} type="image/webp" />
        <source srcSet={m.gif} type="image/gif" />
        <img
          src={m.png}
          alt={`${normalized} demonstration`}
          width={256}
          height={256}
          className="h-64 w-64 rounded-xl border border-zinc-800 bg-zinc-900 object-cover"
        />
      </picture>
      <figcaption className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
        <span className="font-medium">{normalized}</span>
        {expectedGesture && (
          <span className="ml-auto inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs">
            expected: {expectedGesture}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
