"""Add offline fallback clips for the A1 branching conversations.

Reads src/data/practice/a1_conversation.json, synthesizes every speaker (node)
line with the installed Piper model, writes conv_<hash>.wav into
src/assets/tts_core, and merges the normalized keys into manifest.json.

Rules:
- Keys use exactly the same normalization as src/srs/tts.ts (NFC, lowercase,
  eszett -> ss, strip . , ! ? ... ; :, collapse spaces), so lookups always match.
- The original sentence (capitalization and punctuation kept) is sent to Piper;
  normalized text is only used as the manifest key.
- Existing clips are preserved. --prune removes conv_*.wav files that are no
  longer referenced, which is what keeps the package size honest after the text
  is frozen and lines change.
- A machine-readable report is written for the QA evidence folder.

Usage:
    python scripts/generate_conversation_tts.py [--prune] [--report PATH]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "assets" / "tts_core"
MANIFEST = OUT / "manifest.json"
SOURCE = ROOT / "src" / "data" / "practice" / "a1_conversation.json"
REPORT = ROOT / "outputs" / "qa-2026-11-17" / "audio-konversasi.json"
PIPER_ROOT = Path(os.environ.get("APPDATA", "")) / "app.lernen.desktop" / "piper"
MODEL = PIPER_ROOT / "voices" / "de_eva_k_x_low.onnx"
EXE = PIPER_ROOT / "piper.exe"


def normalize_phrase(text: str) -> str:
    text = unicodedata.normalize("NFC", text).lower().replace("ß", "ss")
    text = re.sub(r"[.,!?…;:]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def clip_name(key: str) -> str:
    return f"conv_{hashlib.sha1(key.encode('utf-8')).hexdigest()[:12]}.wav"


def collect_lines() -> list[dict]:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    lines: list[dict] = []
    seen: set[str] = set()
    for scenario in data.get("scenarios", []):
        for node_id, node in scenario.get("nodes", {}).items():
            text = (node.get("de") or "").strip()
            if not text:
                continue
            key = normalize_phrase(text)
            if key in seen:
                continue
            seen.add(key)
            lines.append(
                {
                    "scenario": scenario.get("id"),
                    "node": node_id,
                    "speaker": node.get("speaker"),
                    "text": text,
                    "key": key,
                }
            )
    return lines


def synthesize(text: str, destination: Path, temp: Path) -> None:
    command = [
        str(EXE),
        "--model",
        str(MODEL),
        "--espeak_data",
        str(PIPER_ROOT / "espeak-ng-data"),
        "--json-input",
        "--output_dir",
        str(temp),
        "--quiet",
    ]
    output_file = (temp / destination.name).as_posix()
    payload = json.dumps({"text": text, "output_file": output_file}, ensure_ascii=False)
    proc = subprocess.run(
        command, input=payload + "\n", text=True, encoding="utf-8", capture_output=True, check=False
    )
    if proc.returncode:
        raise SystemExit(proc.stderr or f"Piper gagal pada baris: {text}")
    shutil.copyfile(temp / destination.name, destination)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prune", action="store_true", help="hapus conv_*.wav yang tidak dipakai")
    parser.add_argument("--report", type=Path, default=REPORT)
    args = parser.parse_args()

    if not EXE.exists() or not MODEL.exists():
        raise SystemExit(f"Piper/voice Jerman tidak ditemukan: {MODEL}")

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    phrases = manifest.setdefault("phrases", {})
    lines = collect_lines()

    generated: list[str] = []
    with tempfile.TemporaryDirectory(prefix="lernen-konv-tts-") as temp_name:
        temp = Path(temp_name)
        for line in lines:
            name = clip_name(line["key"])
            line["file"] = name
            destination = OUT / name
            existing = phrases.get(line["key"])
            if existing and (OUT / existing).exists():
                # Jangan menimpa klip yang sudah dipakai entri lain (mis. baris
                # dialog P4 yang teksnya sama); klip lama jadi yatim kalau ditimpa.
                line["file"] = existing
                continue
            if destination.exists():
                phrases[line["key"]] = name
                continue
            synthesize(line["text"], destination, temp)
            phrases[line["key"]] = name
            generated.append(name)

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    referenced = {line["file"] for line in lines}
    pruned: list[str] = []
    if args.prune:
        for path in OUT.glob("conv_*.wav"):
            if path.name not in referenced:
                path.unlink()
                pruned.append(path.name)

    missing = [line["file"] for line in lines if not (OUT / line["file"]).exists()]
    if missing:
        raise SystemExit(f"Klip konversasi hilang: {missing[:5]}")

    total_bytes = sum((OUT / line["file"]).stat().st_size for line in lines)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "task": "AUDIO-01",
        "generated_at_wib": datetime.now().astimezone().isoformat(timespec="seconds"),
        "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "manifest_sha256": hashlib.sha256(MANIFEST.read_bytes()).hexdigest(),
        "lines": len(lines),
        "new_clips": len(generated),
        "pruned_clips": pruned,
        "audio_bytes": total_bytes,
        "audio_mib": round(total_bytes / 1024 / 1024, 2),
        "items": [
            {
                "scenario": line["scenario"],
                "node": line["node"],
                "speaker": line["speaker"],
                "text": line["text"],
                "text_sha256": hashlib.sha256(line["text"].encode("utf-8")).hexdigest(),
                "file": line["file"],
                "bytes": (OUT / line["file"]).stat().st_size,
            }
            for line in lines
        ],
        "text_freeze": "PENDING Agent 2 (regenerasi akhir setelah teks dibekukan)",
    }
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Audio konversasi siap: {len(lines)} baris, {len(generated)} klip baru, "
        f"{total_bytes / 1024 / 1024:.2f} MiB. Laporan: {args.report}"
    )


if __name__ == "__main__":
    main()
