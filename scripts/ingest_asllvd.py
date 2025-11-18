import csv
import os
import sys
import urllib.request
import urllib.error
import time
from pathlib import Path

manifest_path = Path("data/asllvd_manifest.csv")
output_dir = Path("data/raw/asllvd")
output_dir.mkdir(parents=True, exist_ok=True)

cookie_value = os.environ.get("ASLLVD_COOKIE", "")
if not cookie_value:
    print("[WARN] ASLLVD_COOKIE not set. The ingestion will attempt downloads without auth and may fail.")

headers = {}
if cookie_value:
    headers["Cookie"] = f"ASLLVD={cookie_value}"

attempted = 0
completed = 0
failed = 0
auth_failed = 0
auth_failed_files = []
failed_details = []
start_time = time.time()

if not manifest_path.exists():
    print(f"Manifest not found: {manifest_path}")
    sys.exit(1)

with manifest_path.open("r", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Manifest entries: {len(rows)}")

for row in rows:
    src = row.get("src", "").strip()
    token_id = row.get("token_id", "").strip()
    if not src or not token_id:
        print(f"[WARN] Skipping row with missing src/token_id: {row}")
        continue
    out_path = output_dir / f"{token_id}.mp4"
    # Skip if exists
    if out_path.exists():
        print(f"[SKIP] {token_id} already exists: {out_path}")
        continue
    print(f"[DOWNLOAD] {token_id} -> {src} -> {out_path}")
    attempted += 1

    req = urllib.request.Request(src, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            with out_path.open("wb") as out_file:
                while True:
                    chunk = resp.read(1024 * 1024)
                    if not chunk:
                        break
                    out_file.write(chunk)
        print(f"[OK] {token_id} downloaded: {out_path}")
        completed += 1
    except urllib.error.HTTPError as e:
        code = e.code
        print(f"[ERR] HTTP {code} while downloading {token_id}: {src}")
        failed += 1
        failed_details.append((token_id, code, str(e)))
        if code in (401, 403):
            auth_failed += 1
            auth_failed_files.append(token_id)
    except Exception as e:
        print(f"[ERR] Unexpected error for {token_id}: {e}")
        failed += 1
        failed_details.append((token_id, None, str(e)))

elapsed = time.time() - start_time
print("\nIngestion Summary:")
print(f"  Attempts: {attempted}")
print(f"  Completed: {completed}")
print(f"  Failed: {failed}")
if auth_failed:
    print(f"  Auth failures: {auth_failed} ({,
