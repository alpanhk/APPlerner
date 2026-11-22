#!/usr/bin/env python3
"""Audit path lengkap dan SHA-256 aset paket pelengkap dari akar repo."""
import hashlib, json, pathlib, collections, sys
root = pathlib.Path(__file__).resolve().parents[2]
assets = json.loads((root / 'arena-pilot/indeks.json').read_text())['assets']
counts = collections.Counter()
for asset in assets:
    path = root / asset['path']
    state = 'hilang' if not path.is_file() else ('cocok' if hashlib.sha256(path.read_bytes()).hexdigest() == asset['sha256'] else 'hash berbeda')
    counts[state] += 1
    if state != 'cocok': print(f"{state}: {asset['id']} {asset['path']}")
print(f"Total {len(assets)}: cocok {counts['cocok']}, hilang {counts['hilang']}, hash berbeda {counts['hash berbeda']}")
sys.exit(0 if len(assets) == 125 and counts['cocok'] == 125 else 1)
