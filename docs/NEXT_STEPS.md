# HelloHands - Next Steps

**Date:** November 18, 2025  
**Current State:** Packs reorganized, 7/50 signs available (14% coverage)

---

## 🎯 TWO PARALLEL TRACKS

### **TRACK 1: Add Sign Descriptions (Quick Win - 30 min)**

#### What We Have Now:
- ❌ Hardcoded tips in 2 places (PracticePage.tsx, LessonScreen.tsx)
- ❌ Only 11 signs have descriptions
- ❌ Duplicated code

#### What We Need:
- ✅ Centralized descriptions for all 50 signs
- ✅ Single source of truth
- ✅ Easy to update

#### Steps:

**1. Update Your Sign Descriptions** (if you have your own list)
```bash
# Edit with your descriptive list:
code practice/sign-descriptions.json

# Format: 
# "SIGN_NAME": "Clear, instructional description of how to perform the sign"
```

**2. Create Utility Function**
Create `/src/utils/signDescriptions.ts`:
```typescript
import descriptions from '../../practice/sign-descriptions.json';

export function getSignDescription(signName: string): string {
  const normalized = signName.toUpperCase().trim();
  return descriptions[normalized as keyof typeof descriptions] || 
    'Mirror the video and hold your gesture steady for a moment.';
}

export default descriptions;
```

**3. Update PracticePage.tsx**

Replace lines 124-136:
```typescript
// OLD - Delete this:
const SIGN_TIPS: Record<string, string> = {
  HELLO: 'Open palm near temple; small outward wave.',
  // ... rest of hardcoded tips
};

// NEW - Add import at top:
import { getSignDescription } from '../utils/signDescriptions';

// Then use it on line 218:
{getSignDescription(currentItem.sign) ||
  'Mirror the poster and hold your gesture steady for a moment.'}
```

**4. Update LessonScreen.tsx**

Replace lines 436-450:
```typescript
// OLD - Delete this:
const TIPS: Record<string, string> = {
  HELLO: 'Open palm near temple; small outward wave.',
  // ... rest of hardcoded tips
};

// NEW - Add import at top:
import { getSignDescription } from '../../utils/signDescriptions';

// Then use it:
<p className="text-sm text-text-secondary">
  {getSignDescription(currentClip.title)}
</p>
```

**5. Verify**
```bash
pnpm dev
# Check that all signs now show descriptions
# Verify descriptions are consistent across Practice and Lesson screens
```

---

### **TRACK 2: Download ASLLVD Videos (Main Task - 2-4 hours)**

#### Goal: Get from 14% → 90%+ coverage

#### Option A: Automated Pipeline (Try First)

**Step 1: Test Direct URLs**
```bash
# Try downloading first 3 videos (Format 1 - direct MP4 URLs)
cd /Users/Brie/Desktop/hellohands

# Test single URL manually:
curl -o test_water.mp4 "https://dai.cs.rutgers.edu/asllvd//signs_mov_separ_signers/water_signer001_1.mp4"

# If that works, test with auth cookie:
curl -H "Cookie: session=$ASLLVD_COOKIE" \
  -o test_water.mp4 \
  "https://dai.cs.rutgers.edu/asllvd//signs_mov_separ_signers/water_signer001_1.mp4"

# Check if file downloaded:
ls -lh test_water.mp4
ffprobe test_water.mp4  # Verify it's a valid video
```

**Step 2: If Format 1 Works, Download First Batch**
```bash
# Load environment
set -a
source .env.local
set +a

# Run download for first 3 signs
./run_asllvd.sh ingest

# Check results:
ls -la data/raw/asllvd/
```

**Step 3: Test Format 2 URLs (HTML Pages)**
```bash
# These need video URL extraction from HTML
# Check one manually:
curl "https://dai.cs.rutgers.edu/dai/s/video?id=8418&type=separate&datasource=T" > test_page.html

# Look for video URL in the HTML:
grep -i "video\|mp4\|source" test_page.html

# If pattern is clear, run extraction script:
./run_asllvd.sh extract-video-urls

# Then download those:
./run_asllvd.sh ingest
```

**Step 4: Process Downloaded Videos**
```bash
# Once you have ANY videos in data/raw/asllvd/:
./run_asllvd.sh normalize   # Trim, fps, posters
./run_asllvd.sh build       # Generate labels + packs
./run_asllvd.sh verify      # Check coverage
```

---

#### Option B: Manual URL Discovery (Most Reliable)

**If automated pipeline has issues, manually get real URLs:**

**Step 1: Log into DAI**
- Visit: https://dai.cs.rutgers.edu/dai/s/dai
- Use cookie from `.env.local` if needed
- Search interface should be available

**Step 2: Find Videos for Missing Signs**

**Priority 1: Complete L1-ESSENTIALS (11 missing signs)**
```
WATER, HOME, SLEEP, WHERE, WHO, WHY, GOODBYE, 
THANK YOU, SORRY, OK, NOW
```

For each sign:
1. Search in DAI for the sign name
2. Look for "front_a" or "front_b" view (preferred)
3. Find the actual video element
4. Right-click → Inspect → Copy video URL
5. Update `data/asllvd_manifest.csv` with real URL

**Priority 2: Start L1-SOCIAL-BASICS (17 signs)**
```
NICE, LIKE, DON'T LIKE, HUNGRY, HOT, CLEAN, DIRTY, 
PAY, PHONE, WAIT, LATER, AGAIN, COOL, BUSY, READY, 
EXCUSE-ME, SEE-YOU
```

**Priority 3: Complete L2-INTERMEDIATE (15 missing signs)**
```
BATHROOM, HAPPY, SAD, TIRED, SICK, FAMILY, FRIEND, 
WANT, SCHOOL, WORK, LOVE, FINISH, TIME, GO, COME
```

**Step 3: Update Manifest**
```bash
# Edit the CSV file
code data/asllvd_manifest.csv

# Format for each row:
# gloss,signer,token_id,view_id,src,start_frame,end_frame,native_fps
# WATER,signer001,water_signer001_1,front_a,<REAL_URL>,0,90,30
```

**Step 4: Download Updated Manifest**
```bash
./run_asllvd.sh ingest      # Download videos
./run_asllvd.sh normalize   # Process them
./run_asllvd.sh build       # Generate packs
```

---

#### Option C: Hybrid Approach (Recommended)

**Combine automated + manual:**

1. **Try automated for Format 1 URLs** (signs 1-3: WATER, EAT, DRINK)
2. **Manually fix Format 2 URLs** (signs 4-9)
3. **Manually find Format 3 URLs** (signs 10-51)
4. **Run pipeline on batches as you update manifest**

**Batch Processing:**
```bash
# After updating 5-10 URLs in manifest:
./run_asllvd.sh ingest      # Download just the new ones
./run_asllvd.sh normalize   # Process new videos
./run_asllvd.sh build       # Regenerate packs
./run_asllvd.sh verify      # Check progress

# Repeat until 90% coverage reached
```

---

## 📊 SUCCESS METRICS

### Track 1: Sign Descriptions
- ✅ All 50 signs have descriptions
- ✅ Descriptions centralized in single JSON file
- ✅ No hardcoded tips in components
- ✅ Same tips show in Practice and Lesson screens

### Track 2: ASLLVD Videos
- ✅ L1-ESSENTIALS: ≥90% coverage (16/17 signs)
- ✅ L1-SOCIAL-BASICS: ≥90% coverage (16/17 signs)
- ✅ L2-INTERMEDIATE: ≥90% coverage (15/16 signs)
- ✅ Overall: ≥47/50 signs (94%)
- ✅ All 3 packs visible in UI
- ✅ Videos play at 30fps with posters

---

## 🔄 WORKFLOW RECOMMENDATION

**Day 1 (Tonight/Tomorrow Morning):**
1. ✅ Track 1: Update sign descriptions (30 min)
   - Replace with your descriptive list
   - Create utility function
   - Update both components
   - Test in browser

**Day 2:**
2. ✅ Track 2 - Phase 1: Test automated pipeline (1 hour)
   - Try Format 1 URLs
   - If works, download first batch
   - If fails, note error patterns

3. ✅ Track 2 - Phase 2: Manual URL discovery (2-3 hours)
   - Start with L1-ESSENTIALS (11 signs)
   - Find real URLs on DAI
   - Update manifest
   - Download & process batch
   - **Target: L1-ESSENTIALS at 90%+**

**Day 3:**
4. ✅ Track 2 - Phase 3: Complete other packs (2-3 hours)
   - Find URLs for L1-SOCIAL-BASICS
   - Find URLs for L2-INTERMEDIATE remaining
   - Process in batches
   - **Target: All packs at 90%+**

5. ✅ Final verification & polish (30 min)
   - Test all 3 packs in UI
   - Verify descriptions show correctly
   - Check video quality
   - Run coverage report
   - Commit everything

---

## 🚀 QUICK START (RIGHT NOW)

**Choose your path:**

### Path A: Start with Descriptions (Easy, High Impact)
```bash
# 1. Edit with your descriptive list
code practice/sign-descriptions.json

# 2. Create utility file
code src/utils/signDescriptions.ts
# (Copy code from Track 1 Step 2 above)

# 3. Update components
code src/pages/PracticePage.tsx
code src/components/lesson/LessonScreen.tsx
# (Follow Track 1 Steps 3-4 above)

# 4. Test
pnpm dev
```

### Path B: Start with Videos (Bigger Task)
```bash
# 1. Test if direct URLs work
curl -o test.mp4 "https://dai.cs.rutgers.edu/asllvd//signs_mov_separ_signers/water_signer001_1.mp4"
ls -lh test.mp4
ffprobe test.mp4

# 2. If that worked, try pipeline
./run_asllvd.sh ingest

# 3. If it didn't work, start manual URL discovery
open "https://dai.cs.rutgers.edu/dai/s/dai"
# Search for WATER, find video, copy URL, update manifest
```

---

## 📝 FILES TO CREATE/MODIFY

### Track 1 (Descriptions):
- ✅ `/practice/sign-descriptions.json` (created - update with your list)
- 📝 `/src/utils/signDescriptions.ts` (new file to create)
- 📝 `/src/pages/PracticePage.tsx` (modify lines 124-136, 218)
- 📝 `/src/components/lesson/LessonScreen.tsx` (modify lines 436-450)

### Track 2 (Videos):
- 📝 `/data/asllvd_manifest.csv` (update URLs as you find them)
- 🔄 `data/raw/asllvd/` (will be populated by downloads)
- 🔄 `data/processed/asllvd/clips/` (will be generated)
- 🔄 `data/processed/asllvd/posters/` (will be generated)
- 🔄 `data/processed/asllvd/labels.jsonl` (will be regenerated)

---

## 💡 TIPS

1. **For Descriptions:**
   - Keep them under ~80 characters for readability
   - Use clear, instructional language
   - Include hand shape, location, and movement
   - Test on mobile - descriptions should fit on small screens

2. **For Videos:**
   - Download in small batches (5-10 at a time)
   - Test each batch before continuing
   - Prioritize L1-ESSENTIALS first (most visible to users)
   - Take breaks - manual URL discovery is tedious

3. **Commit Often:**
   ```bash
   # After completing descriptions
   git add practice/sign-descriptions.json src/utils/signDescriptions.ts src/pages/ src/components/
   git commit -m "Add comprehensive sign descriptions for all 50 signs"
   
   # After each batch of videos
   git add data/asllvd_manifest.csv
   git commit -m "Update ASLLVD manifest with real URLs (batch 1: L1-ESSENTIALS)"
   ```

---

## 🎯 END GOAL

When both tracks complete:
- 🎉 All 50 signs have clear, helpful descriptions
- 🎉 All 3 packs are ≥90% populated with quality ASLLVD videos
- 🎉 Site is ready for user testing/demo
- 🎉 Clean, maintainable codebase with centralized configs

**Estimated Total Time: 4-6 hours across 2-3 days**

---

Ready to start? Pick Track 1 (descriptions) for a quick win, or Track 2 (videos) if you want to tackle the main challenge first! 🚀

