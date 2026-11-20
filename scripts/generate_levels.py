"""Generator konten Lernen per level (A2/B1/B2).

Sumber ringkas: scripts/konten/<level>.json
Keluaran:
  src/data/lessons/units_<level>.json
  src/data/seed/words_<level>_unit<NN>.json
  src/data/reading/texts_<level>.json

Dijalankan ulang setiap kali definisi unit berubah; keluaran bersifat deterministik
sehingga diff git tetap mudah dibaca.
"""
from __future__ import annotations

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KONTEN = os.path.join(ROOT, "scripts", "konten")
LESSONS = os.path.join(ROOT, "src", "data", "lessons")
SEED = os.path.join(ROOT, "src", "data", "seed")
READING = os.path.join(ROOT, "src", "data", "reading")

SECONDARY_DRILLS = ["D2", "D3", "D4", "D5", "D6", "D7", "D9", "D10"]


def display_no(unit_no: int) -> int:
    return unit_no % 100


def load_existing_words(exclude_prefix: str | None = None) -> set[str]:
    seen: set[str] = set()
    for name in os.listdir(SEED):
        if not name.startswith("words_") or not name.endswith(".json"):
            continue
        if exclude_prefix and name.startswith(exclude_prefix):
            continue
        data = json.load(open(os.path.join(SEED, name), encoding="utf-8"))
        for w in data.get("words", []):
            seen.add(w["de"].lower())
    return seen


def build_lessons(unit: dict, secondary: str) -> list[dict]:
    words = unit["words"]
    grammar = unit["grammar"]

    first5 = [w["de"] for w in words[:5]]
    next5 = [w["de"] for w in words[5:10]]

    lesson1 = {
        "no": 1,
        "title": grammar[0]["title"],
        "minutes": 14,
        "recap": [
            f"Unit ini berfokus pada {unit['title'].lower()}.",
            "; ".join(g["title"] for g in grammar[:3]),
        ],
        "slides": [
            {
                "title": g["title"],
                "body": g["points"],
                "example_de": g.get("de"),
                "example_id": g.get("id"),
            }
            for g in grammar
        ],
        "drill": {"code": unit["drill"], "count": 5},
        "vocab": first5,
    }

    example_words = words[5:9] if len(words) >= 9 else words[:4]
    lesson2 = {
        "no": 2,
        "title": f"Anwendung: {unit['title']}",
        "minutes": 12,
        "recap": [
            "Ubah pengetahuan tata bahasa menjadi kalimat sendiri.",
            f"Fokus kosakata: {', '.join(w['de'] for w in example_words[:4])}.",
        ],
        "slides": [
            {
                "title": w["de"],
                "body": [w["meaning_id"]] + ([f"Plural: {w['plural']}"] if w.get("plural") else []),
                "example_de": w["example_de"],
                "example_id": w["example_id"],
            }
            for w in example_words
        ],
        "drill": {"code": secondary, "count": 5},
        "vocab": next5,
    }

    return [lesson1, lesson2]


def build_checkpoint(unit: dict, secondary: str) -> dict:
    codes = []
    for code in [unit["drill"], secondary, "D1", "D2", "D4"]:
        if code not in codes:
            codes.append(code)
    return {"count": 15, "pass": 70, "codes": codes[:5]}


def main() -> int:
    level_arg = sys.argv[1].lower() if len(sys.argv) > 1 else "a2"
    src_path = os.path.join(KONTEN, f"{level_arg}.json")
    if not os.path.exists(src_path):
        print(f"definisi tidak ditemukan: {src_path}")
        return 1

    spec = json.load(open(src_path, encoding="utf-8"))
    level = spec["level"]
    existing = load_existing_words(f"words_{level.lower()}_")

    units_out = []
    texts_out = []
    duplicates: list[str] = []
    words_total = 0
    lessons_total = 0

    for unit in spec["units"]:
        unit_no = unit["no"]
        dno = display_no(unit_no)
        secondary = SECONDARY_DRILLS[unit_no % len(SECONDARY_DRILLS)]
        if secondary == unit["drill"]:
            secondary = SECONDARY_DRILLS[(unit_no + 1) % len(SECONDARY_DRILLS)]

        # --- seed kata -------------------------------------------------
        words = []
        for w in unit["words"]:
            key = w["de"].lower()
            if key in existing:
                duplicates.append(f"{level} unit {dno}: {w['de']}")
                continue
            existing.add(key)
            words.append(
                {
                    "kind": w.get("kind", "noun"),
                    "de": w["de"],
                    "article": w.get("article"),
                    "plural": w.get("plural"),
                    "meaning_id": w["meaning"],
                    "example_de": w["ex_de"],
                    "example_id": w["ex_id"],
                    "tags": f"{level.lower()},unit{dno},{unit.get('topic', 'umum')}",
                }
            )

        unit_file = {
            "unit": unit_no,
            "level": level,
            "theme": unit["title"],
            "source": f"Konten {level} (kurikulum Goethe) + kurasi manual",
            "seed_version": 1,
            "words": words,
        }
        with open(os.path.join(SEED, f"words_{level.lower()}_unit{dno:02d}.json"), "w", encoding="utf-8") as fh:
            json.dump(unit_file, fh, ensure_ascii=False, indent=2)

        # --- pelajaran -------------------------------------------------
        lessons = build_lessons({**unit, "words": words}, secondary)
        words_total += len(words)
        lessons_total += len(lessons)
        units_out.append(
            {
                "unit": unit_no,
                "title": unit["title"],
                "goals": unit["goals"],
                "lessons": lessons,
                "checkpoint": build_checkpoint(unit, secondary),
            }
        )

        # --- teks bacaan ----------------------------------------------
        text = unit.get("text")
        if text:
            texts_out.append(
                {
                    "title": text["title"],
                    "level": level,
                    "tags": f"seed · {level} · unit {dno}",
                    "sentences": [{"de": d, "id": i} for d, i in text["sentences"]],
                }
            )

    # --- kosakata tambahan (tanpa contoh kalimat, 3 kartu per entri) -------
    extras_out = []
    for kind, de, article, plural, meaning in spec.get("extras", []):
        key = de.lower()
        if key in existing:
            duplicates.append(f"{level} extras: {de}")
            continue
        existing.add(key)
        extras_out.append(
            {
                "kind": kind,
                "de": de,
                "article": article,
                "plural": plural,
                "meaning_id": meaning,
                "example_de": None,
                "example_id": None,
                "tags": f"{level.lower()},wortschatz",
            }
        )
    if extras_out:
        base = (spec["units"][0]["no"] // 100) * 100 if spec["units"] else 0
        with open(os.path.join(SEED, f"words_{level.lower()}_extras.json"), "w", encoding="utf-8") as fh:
            json.dump(
                {
                    "unit": base + 50,
                    "level": level,
                    "theme": "Wortschatz tambahan",
                    "source": f"Kosakata tambahan {level} (kurasi manual, tanpa contoh kalimat)",
                    "seed_version": 1,
                    "words": extras_out,
                },
                fh,
                ensure_ascii=False,
                indent=2,
            )
        words_total += len(extras_out)

    with open(os.path.join(LESSONS, f"units_{level.lower()}.json"), "w", encoding="utf-8") as fh:
        json.dump(
            {
                "level": level,
                "source": f"Konten {level} - kurikulum Goethe + kurasi manual (dibuat scripts/generate_levels.py)",
                "units": units_out,
            },
            fh,
            ensure_ascii=False,
            indent=2,
        )

    if texts_out:
        with open(os.path.join(READING, f"texts_{level.lower()}.json"), "w", encoding="utf-8") as fh:
            json.dump(
                {
                    "level": level,
                    "source": f"Teks pendek orisinal level {level} - kurikulum Goethe",
                    "texts": texts_out,
                },
                fh,
                ensure_ascii=False,
                indent=2,
            )

    total_words = words_total
    total_lessons = lessons_total
    print(
        f"{level}: {len(units_out)} unit · {total_words} kata · {total_lessons} pelajaran · "
        f"{len(texts_out)} teks"
    )
    if duplicates:
        print("Dilewati karena duplikat:")
        for d in duplicates:
            print(" -", d)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
