# Practice Pack Workflow

The practice pipeline keeps the in-app packs aligned with one-handed gloss rules so the gesture evaluator can succeed reliably. Use the following workflow whenever you add or adjust practice content.

## 1. Update the Sources

- Edit `practice/vocab.map.json` with the new gloss (use uppercase keys). Set `one_handed` to `true` only when the sign can be performed cleanly with a single hand.
- Append the gloss to `practice/whitelist.json` under the `allow` array. The whitelist determines which items are eligible for pack generation.
- Add or edit pack membership in `practice/packs.manual.json`. Each entry lists a `packId`, a category tag, and the glosses it should include.

## 2. Regenerate Packs and Audit

Run the bundled script to reapply the whitelist and one-handed rules:

```bash
pnpm practice:generate
```

The command produces:

- `practice/packs.generated.json` – sanitized packs that only contain whitelisted, one-handed glosses.
- `practice/packs.missing.json` – a diff-style log of any items removed, along with the rejection reason (`not whitelisted` or `missing one_handed=true flag`).

Review the missing log after every run. If items were dropped unexpectedly, update the whitelist or vocab map before retrying.

## 3. Validate Coverage (Optional but Recommended)

When MS-ASL labels are available, confirm that every whitelisted gloss has at least one processed clip:

```bash
pnpm practice:coverage
```

The script scans `data/processed/msasl/labels.jsonl` and warns about missing clips.

## 4. Regenerate Fixture Packs (Optional)

If you maintain handcrafted packs for demos, use the autofill helper to append a coverage-driven pack:

```bash
pnpm tsx scripts/practice_pack_autofill.ts
```

This script intersects the whitelist with the current label counts and writes a `L1-ESSENTIALS-DEMO` pack to `practice/packs.manual.json`.

## 5. Share Changes

Commit the updated JSON files plus the regenerated `packs.generated.json` and `packs.missing.json`. Mention in pull requests whether any glosses were dropped and include next steps for sourcing one-handed alternatives if required.

## Troubleshooting

- **Removed gloss wasn't expected:** Check the casing in `whitelist.json` and `vocab.map.json`. Entries are compared in uppercase.
- **Missing `one_handed` metadata:** Add the gloss to `vocab.map.json` with `"one_handed": true`. If the sign requires two hands, leave it out of the whitelist and packs.
- **Stale missing log:** Delete `practice/packs.missing.json` and rerun `pnpm practice:generate` to rebuild from scratch.

Following this checklist keeps the practice experience aligned with the MediaPipe gesture evaluator and prevents multi-hand signs from slipping into the packs.
