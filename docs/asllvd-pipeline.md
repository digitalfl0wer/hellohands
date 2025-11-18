# ASLLVD Normalization Pipeline

This document explains how to use the ASLLVD (American Sign Language Lexicon Video Dataset) normalization pipeline to process raw video data into standardized clips and assets.

## Overview

The pipeline performs the following operations:

1. **Video Trimming & Normalization** - Processes raw videos by trimming to specified frame boundaries and normalizing to 30fps, 320px width MP4 format
2. **Poster Generation** - Extracts mid-sign frames as PNG poster images from normalized clips
3. **Labels Generation** - Creates a labels.jsonl file with metadata, checksums, and pack mappings

## Prerequisites

### Required Software
- **Node.js** (>=18) with TypeScript support
- **ffmpeg** - For video processing
- **ffprobe** - For video metadata extraction (usually comes with ffmpeg)

Install ffmpeg on macOS:
```bash
brew install ffmpeg
```

### Data Structure
Ensure your project has the following structure:
```
data/
├── asllvd_manifest.csv          # Manifest file with video metadata
├── raw/asllvd/                  # Raw downloaded video files
└── processed/asllvd/            # Output directory (created automatically)
    ├── clips/                   # Normalized MP4 clips
    ├── posters/                 # PNG poster frames
    └── labels.jsonl             # Generated dataset labels
```

## Manifest Format

The `data/asllvd_manifest.csv` should contain the following columns:

```csv
gloss,signer,token_id,view_id,src,start_frame,end_frame,native_fps
HELLO,signer1,token123,front_a,http://example.com/video.mp4,120,180,29.97
GOODBYE,signer2,token124,front_b,http://example.com/video2.mp4,200,280,30.00
```

**Column Descriptions:**
- `gloss` - The sign/word being performed
- `signer` - Identifier for the person signing
- `token_id` - Unique identifier for this specific performance
- `view_id` - Camera angle/view (front_a, front_b, side, etc.)
- `src` - URL to the source video (used for downloading)
- `start_frame` - Frame number where the sign begins
- `end_frame` - Frame number where the sign ends
- `native_fps` - Original framerate of the source video

## Usage

### Complete Pipeline

Run the entire normalization pipeline:

```bash
pnpm asllvd:normalize
```

This orchestrates all three steps sequentially and provides a comprehensive summary.

### Individual Steps

You can also run individual pipeline steps:

```bash
# Step 1: Video trimming and normalization
pnpm asllvd:trim

# Step 2: Poster generation
pnpm asllvd:poster

# Step 3: Labels generation  
pnpm asllvd:labels
```

### Data Ingestion (Optional)

If you need to download raw videos from the ASLLVD dataset:

```bash
# Set authentication cookie (required for ASLLVD access)
export ASLLVD_COOKIE="your_authentication_cookie_here"

# Download raw videos
pnpm asllvd:fetch

# Run complete pipeline including download
pnpm asllvd:all
```

## Configuration

### Environment Variables

- `DATA_ROOT` - Override the default data directory (default: `./data`)
- `ASLLVD_COOKIE` - Authentication cookie for downloading from ASLLVD (required for fetch operation)

### Output Specifications

**Video Normalization:**
- **Format:** MP4 with H.264 encoding
- **Resolution:** 320px width (height scales proportionally)
- **Framerate:** 30 FPS
- **Quality:** CRF 23 (good balance of quality/size)
- **Audio:** Removed (video only)

**Poster Images:**
- **Format:** PNG
- **Source:** Mid-point frame of each normalized clip
- **Quality:** High quality (q:v 2)

**Labels Format:**
The `labels.jsonl` file contains one JSON object per line with this structure:
```json
{
  "id": "asllvd_HELLO_signer1_token123",
  "dataset": "asllvd",
  "subset": "social_basics",
  "split": "train",
  "path": "data/processed/asllvd/clips/asllvd_HELLO_signer1_token123.mp4",
  "label": 0,
  "class_name": "HELLO",
  "signer_id": "signer1",
  "start": 0,
  "end": 2.5,
  "poster_path": "data/processed/asllvd/posters/asllvd_HELLO_signer1_token123.png",
  "checksum": "sha256_hash_of_video_file",
  "poster_checksum": "sha256_hash_of_poster_file"
}
```

## Pack Definitions

The pipeline uses pack definitions from `practice/packs.manual.json` to categorize signs into learning modules:

- **L1-ESSENTIALS** - Essential daily signs (mapped to "essentials" subset)
- **L1-SOCIAL-BASICS** - Basic social interaction signs (mapped to "social_basics" subset)

Only signs that appear in these packs will be included in the final labels.jsonl output.

## Troubleshooting

### Common Issues

**"Raw video file not found"**
- Ensure raw videos are downloaded to `data/raw/asllvd/`
- Check that filenames match the expected pattern: `{gloss}_{signer}_{token_id}_{view_id}.{ext}`

**"Failed to read manifest file"**
- Verify `data/asllvd_manifest.csv` exists and is readable
- Check the manifest has the required column headers

**"ffmpeg exited with [code]"**
- Ensure ffmpeg is installed and accessible in PATH
- Check that input video files are not corrupted
- Verify sufficient disk space for output files

**"No clip files found to process"**
- Run the trimming step first: `pnpm asllvd:trim`
- Check that video processing completed successfully

### Performance Notes

- Processing time depends on the number and length of input videos
- Large datasets may take considerable time - the pipeline provides progress updates
- Each step can be run independently, allowing for resumption after interruption
- Existing output files are automatically skipped to avoid reprocessing

## Output Validation

After running the pipeline, verify:

1. **Clips Directory** - Contains MP4 files with normalized specifications
2. **Posters Directory** - Contains PNG files corresponding to each clip
3. **Labels File** - Contains valid JSON entries for all processed clips
4. **Coverage Report** - Shows percentage of pack items successfully processed

The pipeline requires ≥90% coverage per pack for production use.
