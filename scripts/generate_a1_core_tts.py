"""Generate offline fallback clips for A1 core vocabulary and slide examples.

Reads src/data/lessons/units_a1.json, synthesizes every unique vocab word and
example_de with the installed Piper model, writes a1_word_*.wav / a1_example_*.wav
into src/assets/tts_core, and merges the normalized phrase keys into manifest.json.
Existing clips are preserved.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "assets" / "tts_core"
MANIFEST = OUT / "manifest.json"
SOURCE = ROOT / "src" / "data" / "lessons" / "units_a1.json"
PIPER_ROOT = Path(os.environ.get("APPDATA", "")) / "app.lernen.desktop" / "piper"
MODEL = PIPER_ROOT / "voices" / "de_eva_k_x_low.onnx"
EXE = PIPER_ROOT / "piper.exe"


def normalize_phrase(text: str) -> str:
    text = unicodedata.normalize("NFC", text).lower().replace("ß", "ss")
    text = re.sub(r"[.,!?.;:]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    if not EXE.exists() or not MODEL.exists():
        raise SystemExit(f"Piper/voice Jerman tidak ditemukan: {MODEL}")
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    phrases = manifest.setdefault("phrases", {})

    units = data["units"]
    words = sorted({word for unit in units for lesson in unit["lessons"] for word in lesson["vocab"]})
    examples = sorted(
        {
            slide["example_de"]
            for unit in units
            for lesson in unit["lessons"]
            for slide in lesson["slides"]
            if slide.get("example_de")
        }
    )

    needed: dict[str, str] = {}
    for index, word in enumerate(words, 1):
        key = normalize_phrase(word)
        if key in phrases:
            continue
        filename = f"a1_word_{index:03d}.wav"
        if (OUT / filename).exists():
            phrases[key] = filename
            continue
        needed.setdefault(key, filename)
    for index, example in enumerate(examples, 1):
        key = normalize_phrase(example)
        if key in phrases:
            continue
        filename = f"a1_example_{index:03d}.wav"
        if (OUT / filename).exists():
            phrases[key] = filename
            continue
        needed.setdefault(key, filename)

    generated = 0
    with tempfile.TemporaryDirectory(prefix="lernen-a1-tts-") as temp_name:
        temp = Path(temp_name)
        for key, filename in needed.items():
            destination = OUT / filename
            if destination.exists() or key in phrases:
                phrases.setdefault(key, filename)
                continue
            output_file = (temp / filename).as_posix()
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
            line = json.dumps({"text": key, "output_file": output_file}, ensure_ascii=False)
            proc = subprocess.run(
                command, input=line + "\n", text=True, encoding="utf-8", capture_output=True, check=False
            )
            if proc.returncode:
                raise SystemExit(proc.stderr or f"Piper gagal pada frasa: {key}")
            shutil.copyfile(temp / filename, destination)
            phrases[key] = filename
            generated += 1

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    missing = [name for name in needed.values() if not (OUT / name).exists()]
    if missing:
        raise SystemExit(f"Klip A1 hilang: {missing[:5]}")
    total = sum((OUT / name).stat().st_size for name in set(needed.values()))
    print(
        f"Audio A1 siap: {len(words)} kata, {len(examples)} contoh, {generated} klip baru "
        f"({total / 1024 / 1024:.1f} MiB untuk cakupan ini)."
    )


if __name__ == "__main__":
    main()
