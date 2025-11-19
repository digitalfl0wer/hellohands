# ASLLVD v0 Interface Specification

## Normalization Targets
- **FPS**: 30 fps (standardized playback rate)
- **Width**: 320px (balanced quality vs size, height scales proportionally)
- **Format**: MP4 with H.264 video, standardized bitrate

## Canonical View Rule
For each gloss, prefer the following view hierarchy:
1. **Front A** or **Front B** (preferred frontal views)
2. **Side** (acceptable alternative)
3. Any other view (fallback only)

One clip per gloss for v0 implementation.

## Sign Lists (Frozen)

### Essentials Pack (L1-ESSENTIALS)
- WATER
- EAT
- DRINK
- BATHROOM
- LIKE
- DON'T LIKE
- HOME
- SLEEP
- HUNGRY
- WHERE
- WHO
- WHY
- YES
- NO
- HOT
- CLEAN
- DIRTY
- PAY
- PHONE
- WAIT

### Social Basics Pack (L1-SOCIAL-BASICS)
- HELLO
- GOODBYE
- PLEASE
- THANK YOU
- SORRY
- NICE
- LATER
- NOW
- AGAIN
- EXCUSE-ME
- SEE-YOU
- OK
- COOL
- BUSY
- READY

## Manifest Schema
CSV format with headers:
```
gloss,signer,token_id,view_id,src,start_frame,end_frame,native_fps
```

## Directory Structure
- `data/raw/asllvd/` - Raw downloaded videos (not in git)
- `data/processed/asllvd/clips/` - Normalized MP4 clips
- `data/processed/asllvd/posters/` - PNG poster frames
- `data/processed/asllvd/labels.jsonl` - Generated labels
- `practice/packs.generated.json` - Pack definitions

## Coverage Requirements
- ≥90% coverage per pack to ship
- Verifier exits with code 0 on success, non-zero on failure
