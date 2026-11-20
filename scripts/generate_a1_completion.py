"""Build the original Goethe-aligned A1 units 5–12 and their vocabulary seeds."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "scripts" / "konten" / "a1_units_05_12.json"
LESSON_FILE = ROOT / "src" / "data" / "lessons" / "units_a1.json"
SEED_DIR = ROOT / "src" / "data" / "seed"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def existing_words() -> set[str]:
    found: set[str] = set()
    for path in SEED_DIR.glob("words_*.json"):
        if path.name.startswith("words_a1_unit") and int(path.stem[-2:]) in range(5, 13):
            continue
        for word in read_json(path).get("words", []):
            found.add(word["de"].casefold())
    return found


def main() -> None:
    spec = read_json(SPEC)
    units_file = read_json(LESSON_FILE)
    used_words = existing_words()
    generated_units = []
    new_word_count = 0

    for unit in spec["units"]:
        no = unit["unit"]
        if no not in range(5, 13):
            raise ValueError(f"Unit A1 di luar rentang 5–12: {no}")
        words = []
        new_words = []
        for article, de, plural, meaning in unit["words"]:
            key = de.casefold()
            item = {
                "kind": "noun",
                "de": de,
                "article": article,
                "plural": plural,
                "meaning_id": meaning,
                "example_de": f"Das ist {article} {de}.",
                "example_id": f"Ini {meaning}.",
                "tags": f"a1,unit{no},{unit['topic']}",
            }
            words.append(item)
            if key not in used_words:
                used_words.add(key)
                new_words.append(item)
        new_word_count += len(new_words)

        if len(words) < 15:
            raise ValueError(f"A1 unit {no} harus memiliki 15 kosakata untuk dipelajari")
        lessons = []
        for index, lesson in enumerate(unit["lessons"]):
            start = index * 5
            new_vocab = words[start : start + 5]
            review_vocab = words[(start + 5) % len(words) : (start + 8) % len(words)]
            if len(review_vocab) < 3:
                review_vocab += words[: 3 - len(review_vocab)]
            lesson_vocab = new_vocab + review_vocab
            lessons.append(
                {
                    "no": index + 1,
                    "title": lesson["title"],
                    "minutes": lesson.get("minutes", 12),
                    "recap": lesson["recap"],
                    "slides": lesson["slides"],
                    "drill": {"code": lesson["drill"], "count": 5},
                    "vocab": [word["de"] for word in lesson_vocab],
                }
            )
        if len(lessons) != 3 or any(len(lesson["vocab"]) != 8 for lesson in lessons):
            raise ValueError(f"A1 unit {no} perlu tiga pelajaran dengan kosakata")

        generated_units.append(
            {
                "unit": no,
                "title": unit["title"],
                "goals": unit["goals"],
                "lessons": lessons,
                "checkpoint": {"count": 15, "pass": 70, "codes": ["D1", "D2", "D3", "D4", "D5"]},
            }
        )
        write_json(
            SEED_DIR / f"words_a1_unit{no:02d}.json",
            {
                "unit": no,
                "level": "A1",
                "theme": unit["title"],
                "source": "Materi orisinal beracuan Goethe A1; pemetaan Studio D menunggu sumber lengkap",
                "seed_version": 1,
                "words": new_words,
            },
        )

    by_no = {unit["unit"]: unit for unit in units_file["units"]}
    by_no.update({unit["unit"]: unit for unit in generated_units})
    units_file["units"] = [by_no[no] for no in range(1, 13)]
    units_file["source"] = (
        "A1 unit 1–4: kurasi sebelumnya; unit 5–12: materi orisinal beracuan Goethe. "
        "Pemetaan ke Studio D menunggu buku kursus lengkap."
    )
    write_json(LESSON_FILE, units_file)
    print(
        f"A1: {len(generated_units)} unit, {sum(len(u['lessons']) for u in generated_units)} pelajaran, "
        f"{sum(len(u['words']) for u in spec['units'])} kosakata unit, "
        f"{new_word_count} kata baru ditambahkan ke seed."
    )


if __name__ == "__main__":
    main()
