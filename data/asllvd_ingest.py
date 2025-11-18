#!/usr/bin/env python3
import csv
import os
import sys
import urllib.request
import urllib.error

manifest_path = "data/asllvd_manifest.csv"
cookie = os.environ.get("ASLLVD_COOKIE")
if not cookie:
    print("Warning: ASLLVD_COOKIE is not set. Aborting download attempts gracefully.")
    print("Summary:")
    print("  attempts: 0")
    print("  completed: 0")
    print("  failed: 0")
    sys.exit(0)

dest_dir = "data/raw/asllvd"
os.makedirs(dest_dir, exist_ok=True)
attempts = 0
completed = 0
failed = 0

rows = []
try:
    with open(manifest_path, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
except FileNotFoundError:
    print(f"Manifest not found: {manifest_path}")
    print("Summary:")
    print("  attempts: 0")
    print("  completed: 0")
    print("  failed: 0")
    sys.exit(0)

for row in rows:
    url = (row.get("src") or "").strip()
    gloss = (row.get("gloss") or "").strip().replace(" ", "_")
    token_id = (row.get("token_id") or "").strip()
    view_id = (row.get("view_id") or "").strip()
    if not url:
        print(f"Skipping entry with missing src: {row}")
        continue
    filename_base = f"{gloss}_{token_id}_{view_id}".strip("_")
    if not filename_base:
        filename_base = "video"
    dest_path = os.path.join(dest_dir, f"{filename_base}.mp4")
    if os.path.exists(dest_path):
        print(f"Skip existing: {dest_path}")
        continue
    attempts += 1
    print(f"Downloading {url} -> {dest_path}")
    try:
        req = urllib.request.Request(url)
        req.add_header("Cookie", f"ASLLVD_COOKIE={cookie}")
        with urllib.request.urlopen(req, timeout=60) as resp:
            if resp.status != 200:
                print(f"Failed to download {url}: HTTP {resp.status}")
                failed += 1
                continue
            with open(dest_path, "wb") as out:
                while True:
                    chunk = resp.read(1024*1024)
                    if not chunk:
                        break
                    out.write(chunk)
        completed += 1
        print(f"Downloaded: {dest_path}")
    except urllib.error.HTTPError as e:
        print(f"HTTPError downloading {url}: {e.code} {e.reason}")
        failed += 1
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        failed += 1

print("Summary:")
print(f"  attempts: {attempts}")
print(f"  completed: {completed}")
print(f"  failed: {failed}")
