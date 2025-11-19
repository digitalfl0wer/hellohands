# HelloHands ASLLVD Project - Continuation Prompt

**Date:** November 18, 2025  
**Project:** HelloHands - ASL Learning Platform  
**Current Phase:** ASLLVD Dataset Integration & Pack Organization  

---

## 🎯 PROJECT CONTEXT

HelloHands is an ASL (American Sign Language) learning web app that uses MediaPipe hand detection to provide interactive sign language practice. The project is transitioning from MS-ASL dataset to ASLLVD (American Sign Language Lexicon Video Dataset) from Boston University.

**Tech Stack:**
- React + TypeScript + Vite
- MediaPipe for hand landmark detection
- Zustand for state management
- Tailwind CSS for styling

---

## ✅ WHAT WAS JUST COMPLETED

### 1. Switched Dataset Attribution from MS-ASL to ASLLVD
- **File:** `.env.local`
- **Change:** Added `VITE_DATASET=ASLLVD`
- **Result:** Site footer now shows "Data source: ASLLVD" with correct attribution

### 2. Created Gesture Mapping Configuration
- **File:** `/practice/sign-gestures.json`
- **Purpose:** Maps all 50 target ASL signs to 4 simple confirmation gestures
- **Gestures:** `open_palm`, `thumbs_up`, `pinch`, `point`
- **Note:** These are NOT for detecting the actual ASL signs - they're simple gestures learners use to confirm they've practiced the sign

### 3. Reorganized Local Videos into 3 Structured Packs
- **Input:** 47 video clips in chaotic single pack with duplicates
- **Output:** 3 properly organized packs aligned with learning progression

**Pack Structure:**
```
L1-ESSENTIALS (Level 1 · Essentials)
├── 6 signs: HELLO, PLEASE, YES, NO, EAT, DRINK
├── 41 video clips (multiple variants per sign)
└── Coverage: 6/17 required signs (35.3%)

L1-SOCIAL-BASICS (Level 1 · Social Basics)
├── 0 signs (empty, awaiting videos)
└── Coverage: 0/17 required signs (0%)

L2-INTERMEDIATE (Level 2 · Intermediate)
├── 1 sign: HELP
├── 6 video clips (6 variants)
└── Coverage: 1/16 required signs (6.3%)
```

### 4. Created Organization Script
- **File:** `/scripts/organize_local_packs.ts`
- **Purpose:** Automatically reorganizes videos into correct packs
- **Features:**
  - Groups duplicate videos as intentional "variants"
  - Applies correct gesture mappings
  - Filters out empty packs
  - Generates comprehensive coverage reports

### 5. Updated Practice API
- **File:** `/src/services/practiceApi.ts`
- **Change:** Now loads `/local/local_packs.json` (array of 3 packs) instead of single pack
- **Result:** Pack selector in UI shows multiple packs

---

## 📂 KEY FILE LOCATIONS

### Configuration Files:
```
.env.local                              # Environment variables (has VITE_DATASET=ASLLVD)
practice/packs.manual.json              # Defines 3 packs with 50 total signs
practice/sign-gestures.json             # Maps signs → gesture confirmations (created)
practice/asllvd.gloss.config.json      # 35 primary + 15 backup glosses for ASLLVD
practice/whitelist.json                 # Approved signs for UI display
practice/vocab.map.json                 # Sign metadata (aliases, one_handed flag)
```

### Data Files:
```
data/asllvd_manifest.csv                # 51 rows: 50 signs with source URLs
data/processed/asllvd/labels.jsonl      # Generated metadata (exists but no videos yet)
data/raw/asllvd/                        # Raw downloaded videos (DOESN'T EXIST YET)
data/processed/asllvd/clips/            # Processed MP4 clips (DOESN'T EXIST YET)
data/processed/asllvd/posters/          # Poster images (DOESN'T EXIST YET)
```

### Generated Pack Files:
```
public/local/local_pack.json            # OLD - single pack with duplicates (deprecated)
public/local/local_packs.json           # NEW - 3 packs, properly organized (active)
```

### Scripts:
```
scripts/organize_local_packs.ts         # Reorganize local videos into 3 packs (created)
scripts/asllvd_generate_manifest.ts     # Generate manifest from gloss config
scripts/asllvd_discover_urls.ts         # Discover real video URLs (needs work)
scripts/asllvd_fetch.ts                 # Download videos from manifest
scripts/asllvd_normalize.ts             # Process videos (trim, fps, posters)
scripts/asllvd_build_complete.ts        # Build labels + packs
scripts/asllvd_coverage.ts              # Verify ≥90% coverage per pack
```

### Wrapper Script:
```
run_asllvd.sh                           # Orchestrates entire pipeline with env vars
```

---

## 📊 CURRENT STATE

### What Works:
✅ Site loads with ASLLVD attribution  
✅ 2 packs visible in UI (L1-ESSENTIALS, L2-INTERMEDIATE)  
✅ 7 unique signs available (6 in L1, 1 in L2)  
✅ 47 video variants functioning  
✅ Correct gesture mappings applied  
✅ Pack switching works in UI  

### What's Missing:
❌ ASLLVD videos not downloaded (clips directory empty)  
❌ 43 out of 50 target signs have no videos yet  
❌ L1-SOCIAL-BASICS pack is empty  
❌ Only 14% overall coverage (goal: 90%)  

### The Gap:
Currently using demo videos from MS-ASL that were in `/public/local/`. The ASLLVD pipeline has been set up but not executed, so no actual ASLLVD videos exist yet.

---

## 🎯 THE PLAN: Download & Process ASLLVD Videos

### Goal:
Get all 50 target signs from ASLLVD dataset to reach 90%+ coverage across all 3 packs.

### Challenge:
The manifest (`data/asllvd_manifest.csv`) has URLs in 3 different formats:

**Format 1: Direct MP4 URLs** (First 3 entries)
```csv
WATER,signer001,water_signer001_1,front_a,https://dai.cs.rutgers.edu/asllvd//signs_mov_separ_signers/water_signer001_1.mp4
```
- Should work with direct download
- **Status:** Not tested yet

**Format 2: DAI Video Page URLs** (Entries 4-9)
```csv
BATHROOM,signer001,bathroom_signer001_2,front_a,https://dai.cs.rutgers.edu/dai/s/video?id=8418&type=separate&datasource=T
```
- These are HTML pages, not direct videos
- Need to scrape to find actual video URL
- **Status:** `asllvd_extract_video_urls.ts` exists but needs testing

**Format 3: Placeholder URLs** (Entries 10-51)
```csv
HELLO,signer002,hello_signer002_1,front_a,https://www.bu.edu/asllvd/videos/hello_signer002_1.mp4,0,48,30
```
- These are fake/template URLs
- Will return 404
- **Status:** Need real URLs from DAI dataset

---

## 🚀 IMMEDIATE NEXT STEPS

### Option A: Test What We Have (Recommended First Step)

1. **Start the dev server:**
```bash
cd /Users/Brie/Desktop/hellohands
pnpm dev
```

2. **Open browser:** http://localhost:5173

3. **Verify:**
- Footer shows "Data source: ASLLVD"
- Pack selector shows 2 packs
- L1-ESSENTIALS has 6 signs
- L2-INTERMEDIATE has HELP sign
- Videos play correctly
- Gesture confirmation works

### Option B: Run Full ASLLVD Pipeline (Ambitious)

**This will attempt to download and process all 50 signs:**

```bash
cd /Users/Brie/Desktop/hellohands

# Run complete pipeline
./run_asllvd.sh all

# Or step-by-step:
./run_asllvd.sh generate-manifest    # Already done
./run_asllvd.sh discover-urls         # Find real URLs
./run_asllvd.sh ingest                # Download videos
./run_asllvd.sh extract-video-urls    # Extract from HTML pages
./run_asllvd.sh ingest                # Download again with extracted URLs
./run_asllvd.sh normalize             # Process videos (trim, fps, posters)
./run_asllvd.sh build                 # Generate labels + packs
./run_asllvd.sh verify                # Check coverage ≥90%
```

**Expected Issues:**
- Format 2 URLs might need manual scraping
- Format 3 URLs will definitely fail (need replacement)
- Need to authenticate with DAI (cookie in `.env.local` already set)

### Option C: Manual URL Discovery (Most Reliable)

1. **Log into DAI:** https://dai.cs.rutgers.edu/dai/s/dai
   - Use the `ASLLVD_COOKIE` from `.env.local` if needed

2. **Search for missing signs** (43 signs total):
   ```
   From L1-ESSENTIALS (11 missing):
   WATER, HOME, SLEEP, WHERE, WHO, WHY, GOODBYE, THANK YOU, SORRY, OK, NOW
   
   From L1-SOCIAL-BASICS (17 missing - all):
   NICE, LIKE, DON'T LIKE, HUNGRY, HOT, CLEAN, DIRTY, PAY, PHONE, WAIT,
   LATER, AGAIN, COOL, BUSY, READY, EXCUSE-ME, SEE-YOU
   
   From L2-INTERMEDIATE (15 missing):
   BATHROOM, HAPPY, SAD, TIRED, SICK, FAMILY, FRIEND, WANT, SCHOOL, WORK,
   LOVE, FINISH, TIME, GO, COME
   ```

3. **For each sign:**
   - Search in DAI interface
   - Find video for front view (front_a or front_b preferred)
   - Right-click video → Copy URL
   - Update `data/asllvd_manifest.csv` with real URL

4. **After updating manifest:**
```bash
./run_asllvd.sh ingest       # Download videos
./run_asllvd.sh normalize    # Process them
./run_asllvd.sh build        # Generate packs
```

---

## 🔧 USEFUL COMMANDS

### Reorganize Local Packs:
```bash
npx tsx scripts/organize_local_packs.ts
```
Run this after adding any new videos to `/public/local/` directories.

### Check Pack Status:
```bash
cat public/local/local_packs.json | python3 -c "
import json,sys
packs=json.load(sys.stdin)
for p in packs:
    signs = len(set(i['sign'] for i in p['items']))
    items = len(p['items'])
    print(f'{p[\"packId\"]}: {signs} signs, {items} videos')
"
```

### View Manifest URLs:
```bash
head -20 data/asllvd_manifest.csv
```

### Check if Videos Downloaded:
```bash
ls -la data/raw/asllvd/ 2>/dev/null || echo "No raw videos yet"
ls -la data/processed/asllvd/clips/ 2>/dev/null || echo "No processed clips yet"
```

### Check Coverage:
```bash
npx tsx scripts/asllvd_coverage.ts
```

---

## 📝 IMPORTANT NOTES

### Environment Variables in `.env.local`:
```bash
VITE_DATASET=ASLLVD                    # Display ASLLVD attribution
ASLLVD_COOKIE=E53ABC04A40F3280...      # Auth cookie for DAI downloads
DATA_ROOT=/Users/.../hellohands/data   # Data directory path
VITE_MP_MAINTHREAD=1                   # MediaPipe config
VITE_MP_DISABLE=0
VITE_MP_FPS=15
VITE_MP_DEV_METER=1
```

### The `run_asllvd.sh` Wrapper:
This script automatically loads environment variables before running commands. Use it instead of direct `pnpm` commands for ASLLVD operations.

### Gesture Mapping Logic:
- **NOT detecting actual ASL signs** - MediaPipe can't do that (yet)
- **Simple confirmation gestures** - User practices sign, then makes simple gesture to confirm
- 4 gestures: `open_palm`, `thumbs_up`, `pinch`, `point`
- Thresholds in `src/gestures/thresholds.ts` (default 0.6 confidence)

### Pack Coverage Goals:
- **Minimum:** 90% of required signs per pack
- **Current:** 14% overall (7/50 signs)
- **L1-ESSENTIALS:** 35.3% (6/17) - needs 10 more signs
- **L1-SOCIAL-BASICS:** 0% (0/17) - needs 16 signs
- **L2-INTERMEDIATE:** 6.3% (1/16) - needs 14 more signs

---

## 🎯 RECOMMENDED WORKFLOW FOR NEXT SESSION

### Phase 1: Test Current State (15 min)
1. Start dev server: `pnpm dev`
2. Open http://localhost:5173
3. Test pack switching
4. Verify 7 signs work correctly
5. Confirm ASLLVD attribution shows

### Phase 2: Analyze URLs (30 min)
1. Review `data/asllvd_manifest.csv`
2. Test Format 1 URLs (direct MP4s) - try downloading one manually
3. Test Format 2 URLs (DAI pages) - visit in browser, inspect video element
4. Document which URL formats actually work

### Phase 3: Download Strategy (1-2 hours)
**If Format 1 works:**
- Run `./run_asllvd.sh ingest` for first 3 signs
- Test if they process correctly

**If Format 2 works:**
- Run extraction script for signs 4-9
- Verify video URLs extracted correctly

**For Format 3 (placeholders):**
- Manually find real URLs on DAI
- Update manifest
- Or write scraper if pattern is clear

### Phase 4: Process Videos (30 min)
Once videos downloaded:
```bash
./run_asllvd.sh normalize    # Trim, fps conversion, posters
./run_asllvd.sh build        # Generate labels + packs  
./run_asllvd.sh verify       # Check coverage
```

### Phase 5: Test Full Site (15 min)
- Refresh browser
- All 3 packs should have videos
- Coverage should be 90%+
- Test switching between packs
- Verify gesture confirmations work

---

## 📚 REFERENCE DOCUMENTATION

### In Project:
- `/docs/ASLLVD_SETUP.md` - ASLLVD pipeline setup guide
- `/docs/asllvd-pipeline.md` - Detailed pipeline documentation
- `/docs/local-packs-reorganization.md` - What was just completed
- `/docs/demo-readiness.md` - Overall project goals
- `/PRD/hellohands-gesture-runtime-asllvd-prd-v0.1.md` - Product requirements

### External:
- ASLLVD Dataset: https://www.bu.edu/av/asllvd/
- DAI Portal: https://dai.cs.rutgers.edu/dai/s/dai
- MediaPipe Hands: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker

---

## 🐛 KNOWN ISSUES

1. **Most manifest URLs are placeholders** - Need real URLs from DAI
2. **URL discovery script uses mocks** - `asllvd_discover_urls.ts` needs real scraping
3. **No videos downloaded yet** - Pipeline configured but not executed
4. **L1-SOCIAL-BASICS empty** - Will appear in UI once any videos added
5. **Dev server startup** - May need to use full path to pnpm: `/usr/local/lib/node_modules/corepack/shims/pnpm`

---

## 💡 QUICK WINS

### To see immediate progress:

1. **Manually download 1-2 ASLLVD videos:**
   - Find "WATER" video on DAI
   - Download to `data/raw/asllvd/water_signer001_1_front_a.mp4`
   - Run: `./run_asllvd.sh normalize`
   - See if it appears in packs

2. **Test Format 1 URLs:**
```bash
curl -o test.mp4 "https://dai.cs.rutgers.edu/asllvd//signs_mov_separ_signers/water_signer001_1.mp4"
```
If this works, you can script mass downloads.

3. **Update gesture mappings:**
   - Edit `/practice/sign-gestures.json` if any gestures seem wrong
   - Run: `npx tsx scripts/organize_local_packs.ts`
   - Gestures update instantly

---

## 🎯 SUCCESS CRITERIA

You'll know the project is ready when:

✅ All 3 packs show in UI  
✅ Each pack has ≥90% coverage (≥15 signs per pack)  
✅ 45+ out of 50 target signs have videos  
✅ Videos play smoothly at 30fps  
✅ Gesture confirmations work for all signs  
✅ ASLLVD attribution displayed correctly  
✅ Coverage report shows ✅ PASS for all packs  

---

## 📞 CONTEXT FOR AI ASSISTANT

**Project Goal:** Integrate ASLLVD dataset to provide high-quality ASL sign videos for learners.

**Current Blocker:** Videos not downloaded yet. Manifest has URLs but many are placeholders.

**What to focus on:**
1. Getting real video URLs from DAI dataset
2. Downloading and processing videos through pipeline
3. Reaching 90% coverage across all 3 packs

**What's already done:**
- Pack structure completely reorganized ✅
- Gesture mappings configured ✅
- Pipeline scripts created ✅
- API updated to load multiple packs ✅
- Dataset attribution switched ✅

**Key insight:** The "expectedGesture" field is NOT for detecting ASL signs - it's a simple confirmation gesture the user makes after practicing. Don't try to use MediaPipe to detect the actual ASL signs.

---

## 🚢 DEPLOYMENT NOTE

Once videos are ready:
- `/public/local/local_packs.json` is served statically
- No server-side processing needed
- Can deploy to Vercel/Netlify immediately
- Make sure to include video files in deployment

---

**Ready to continue! Start with testing the current state, then tackle URL discovery/downloading.** 🚀

