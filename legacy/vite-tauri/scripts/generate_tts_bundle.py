"""Generate compact German offline fallback clips using the installed Piper model.

The output contains 30 WAV files: one segmented clip for numbers 1–100,
12 Unit 1 words, eight D8 time phrases, seven greetings, and two voice previews.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import re
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "assets" / "tts_core"
PIPER_ROOT = Path(os.environ.get("APPDATA", "")) / "app.lernen.desktop" / "piper"
MODEL = PIPER_ROOT / "voices" / "de_eva_k_x_low.onnx"
EXE = PIPER_ROOT / "piper.exe"

WORDS = ["Name", "Mann", "Frau", "Herr", "Land", "Sprache", "Stadt", "Freund", "Freundin", "Jahr", "kommen", "heißen", "wohnen"]
TIMES = [
    "acht Uhr dreißig", "sieben Uhr fünfzehn", "viertel vor neun", "halb sieben",
    "zehn Uhr", "fünf nach drei", "zwanzig vor acht", "halb neun",
]
GREETINGS = ["Hallo", "Guten Morgen", "Guten Tag", "Guten Abend", "Auf Wiedersehen", "Wie heißen Sie?"]
PREVIEWS = ["Guten Tag! Ich lerne Deutsch.", "Guten Tag! Ich heiße Alex und lerne Deutsch."]


def number_de(n: int) -> str:
    ones = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"]
    teens = {10: "zehn", 11: "elf", 12: "zwölf", 13: "dreizehn", 14: "vierzehn", 15: "fünfzehn", 16: "sechzehn", 17: "siebzehn", 18: "achtzehn", 19: "neunzehn"}
    tens = {20: "zwanzig", 30: "dreißig", 40: "vierzig", 50: "fünfzig", 60: "sechzig", 70: "siebzig", 80: "achtzig", 90: "neunzig"}
    if n < 10:
        return ones[n]
    if n < 20:
        return teens[n]
    if n == 100:
        return "einhundert"
    unit, ten = n % 10, n // 10 * 10
    unit_word = "ein" if unit == 1 else ones[unit]
    return tens[ten] if unit == 0 else f"{unit_word}und{tens[ten]}"


def normalize_phrase(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[.,!?…;:]", "", text.casefold())).strip()


def main() -> None:
    if not EXE.exists() or not MODEL.exists():
        raise SystemExit(f"Piper/voice Jerman tidak ditemukan: {MODEL}")
    OUT.mkdir(parents=True, exist_ok=True)
    for old_clip in OUT.glob("*.wav"):
        old_clip.unlink()
    clips = [(f"word_{i:02d}", phrase) for i, phrase in enumerate(WORDS, 1)]
    clips += [(f"time_{i:02d}", phrase) for i, phrase in enumerate(TIMES, 1)]
    clips += [(f"greeting_{i:02d}", phrase) for i, phrase in enumerate(GREETINGS, 1)]
    clips += [(f"preview_{i:02d}", phrase) for i, phrase in enumerate(PREVIEWS, 1)]
    numbers = [(number_de(i), number_de(i), f"number_{i:03d}") for i in range(1, 101)]

    with tempfile.TemporaryDirectory(prefix="lernen-tts-") as temp_name:
        temp = Path(temp_name)
        utterances = [(filename, text) for filename, text in clips]
        utterances += [(filename, text) for _, text, filename in numbers]
        for index, (filename, text) in enumerate(utterances, 1):
            output_file = (temp / f"{filename}.wav").as_posix()
            command = [str(EXE), "--model", str(MODEL), "--espeak_data", str(PIPER_ROOT / "espeak-ng-data"), "--json-input", "--output_dir", str(temp), "--quiet"]
            line = json.dumps({"text": text, "output_file": output_file}, ensure_ascii=False)
            proc = subprocess.run(command, input=line + "\n", text=True, encoding="utf-8", capture_output=True, check=False)
            if proc.returncode and "ß" in text:
                line = json.dumps({"text": text.replace("ß", "ss"), "output_file": output_file}, ensure_ascii=False)
                proc = subprocess.run(command, input=line + "\n", text=True, encoding="utf-8", capture_output=True, check=False)
            if proc.returncode:
                raise SystemExit(proc.stderr or f"Piper gagal pada klip {index}: {text}")

        number_path = OUT / "numbers_1_100.wav"
        manifest_numbers: dict[str, dict[str, float]] = {}
        with wave.open(str(temp / "number_001.wav"), "rb") as first:
            params = first.getparams()
            silence = b"\0" * int(params.framerate * 0.14) * params.nchannels * params.sampwidth
        frame_cursor = 0
        with wave.open(str(number_path), "wb") as target:
            target.setparams(params)
            for german, _, filename in numbers:
                with wave.open(str(temp / f"{filename}.wav"), "rb") as source:
                    if source.getparams()[:3] != params[:3]:
                        raise ValueError("Format WAV Piper berubah di antara klip.")
                    frames = source.readframes(source.getnframes())
                duration = len(frames) / (params.framerate * params.nchannels * params.sampwidth)
                manifest_numbers[german] = {"start": frame_cursor / params.framerate, "duration": duration}
                target.writeframesraw(frames)
                target.writeframesraw(silence)
                frame_cursor += len(frames) // (params.nchannels * params.sampwidth) + len(silence) // (params.nchannels * params.sampwidth)

        phrase_map: dict[str, str] = {}
        for filename, phrase in clips:
            out_path = OUT / f"{filename}.wav"
            shutil.copyfile(temp / f"{filename}.wav", out_path)
            phrase_map[normalize_phrase(phrase)] = out_path.name
        number_map = {german: {"start": data["start"], "duration": data["duration"]} for german, data in manifest_numbers.items()}
        number_map.update({str(i): manifest_numbers[number_de(i)] for i in range(1, 101)})
        manifest = {"phrases": phrase_map, "numbers": number_map}
        (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    count = len(list(OUT.glob("*.wav")))
    if count != 30:
        raise SystemExit(f"Paket harus berisi 30 WAV, ditemukan {count}")
    print(f"Fallback TTS dibuat: {count} WAV (termasuk segmen angka 1–100) di {OUT}")


if __name__ == "__main__":
    main()
