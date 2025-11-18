# ASLLVD Setup Guide

## Environment Variables

ASLLVD_COOKIE is stored in `.env.local`. To make it visible to Goose and other scripts:

```bash
# Load environment variables
set -a
source .env.local
set +a

# Verify ASLLVD_COOKIE is loaded
echo $ASLLVD_COOKIE   # should not be empty
```

In a fresh shell, load .env.local as above, then run:

```bash
echo $ASLLVD_COOKIE
```

and confirm it prints a non-empty value.

## Manifest Generation

**Status: Manifest generator script does NOT exist yet**

The manifest generation script needs to be implemented. Currently, `data/asllvd_manifest.csv` only contains the header row.

**Required implementation:**
- Script that fetches ASLLVD metadata from Boston University API/dataset
- Filters for target glosses (from `practice/asllvd.gloss.config.json`)
- Applies canonical view selection (front A/B > side)
- Generates CSV with required columns: gloss,signer,token_id,view_id,src,start_frame,end_frame,native_fps

**Command to generate manifest:**
```bash
pnpm asllvd:generate-manifest
```

This script:
- Loads gloss configuration from `practice/asllvd.gloss.config.json`
- Fetches ASLLVD metadata (currently uses sample data - needs real API implementation)
- Applies canonical view selection (front A/B > side)
- Generates CSV with required columns

## URL Discovery

**Command to discover real video URLs:**
```bash
pnpm asllvd:discover-urls
```

**Current Status:** This script currently uses mock URLs for demonstration. **You need to implement real URL discovery.**

### How to Find Real ASLLVD Video URLs:

1. **Log into DAI**: https://dai.cs.rutgers.edu/dai/s/dai
2. **Search for videos**: Use the search interface to find videos for your target glosses
3. **Inspect video links**: Right-click video links and copy the actual URLs
4. **Update the discovery script**: Modify `scripts/asllvd_discover_urls.ts` to scrape real URLs from the DAI interface

### Expected URL Pattern:
Real ASLLVD videos are likely at URLs like:
- `https://dai.cs.rutgers.edu/dai/videos/[video_id].mp4`
- Or other paths within the DAI domain

### Manual URL Discovery (Until Automated Script is Ready):

1. **Search in DAI**: Go to https://dai.cs.rutgers.edu/dai/s/dai and search for glosses like "WATER"
2. **Find video links**: Look for actual video download/playback links
3. **Copy URLs**: Right-click video elements and copy their URLs
4. **Update manifest**: Manually edit `data/asllvd_manifest.csv` with real URLs

**Example real URL format** (you need to discover these):
```
https://dai.cs.rutgers.edu/dai/media/video_12345.mp4
```

Until the URL discovery is implemented, the manifest will contain placeholder URLs that return 404 errors.

## Gloss Configuration

The target glosses are centralized in `practice/asllvd.gloss.config.json`:

- **primary_glosses** (35): The core glosses required for L1-ESSENTIALS and L1-SOCIAL-BASICS packs. These should have the highest priority and best coverage.
- **backup_glosses** (15): Additional glosses that can be used as substitutes if primary glosses are missing or have poor video quality.

**Total: 50 unique glosses**

Changing this config file is how you tweak what gets pulled from ASLLVD. The manifest generator reads this file to determine which glosses to include in the dataset.

## Quickstart

### Complete ASLLVD Pipeline

Use the provided wrapper script that automatically loads environment variables:

#### Option 1: Complete Pipeline (Recommended)
```bash
./run_asllvd.sh all
```
This runs: generate-manifest → discover-urls → ingest → extract-video-urls → ingest → normalize → build → verify

#### Option 2: Step-by-Step (Current Working Method)
```bash
# Generate manifest with 50 glosses
./run_asllvd.sh generate-manifest

# Add real DAI URLs to first N entries in manifest manually
# (Edit data/asllvd_manifest.csv and replace placeholder URLs)

# Download HTML pages (which contain video links)
./run_asllvd.sh ingest

# Extract real video URLs from downloaded HTML
./run_asllvd.sh extract-video-urls

# Download actual video files using extracted URLs
./run_asllvd.sh ingest

# Process videos (trim, fps, posters)
./run_asllvd.sh normalize

# Generate labels and build packs
./run_asllvd.sh build

# Verify coverage (≥90% required)
./run_asllvd.sh verify
```

#### Manual Approach (if needed)
```bash
# Load environment variables
set -a
source .env.local
set +a

# Verify ASLLVD_COOKIE is loaded
echo $ASLLVD_COOKIE

# Run commands (environment variables now available)
pnpm asllvd:generate-manifest
pnpm asllvd:discover-urls
goose run --recipe goose/recipes/asllvd_ingest.yaml
goose run --recipe goose/recipes/asllvd_normalize.yaml
pnpm asllvd:build-complete
pnpm asllvd:coverage
```

### Files to Check After Pipeline
- `data/asllvd_manifest.csv` - Should have 51 lines (header + 50 glosses)
- `data/processed/asllvd/labels.jsonl` - Processed metadata
- `practice/packs.generated.json` - Pack definitions
- `artifacts/reports/` - Coverage reports

### Troubleshooting
- **Environment not loaded**: Use `./run_asllvd.sh <command>` instead of manual commands
- **No manifest data**: Run `./run_asllvd.sh generate-manifest`
- **Missing ASLLVD_COOKIE**: Check `.env.local` and use the wrapper script
- **All downloads fail with 404**: URLs in manifest are placeholders - need to implement real URL discovery (see URL Discovery section)
- **Coverage <90%**: Check available clips in `data/processed/asllvd/clips/`
- **Goose errors**: Ensure `.gooseignore` doesn't block `data/` directory
- **Permission errors**: Make sure `run_asllvd.sh` is executable (`chmod +x run_asllvd.sh`)

### Current Known Issues
- **URL Discovery Not Implemented**: The `asllvd:discover-urls` script uses mock URLs. You need to implement real URL scraping from the DAI interface.
- **Manifest URLs are Placeholders**: All generated URLs point to non-existent locations until real URL discovery is implemented.
