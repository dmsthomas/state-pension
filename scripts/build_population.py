#!/usr/bin/env python3
"""Build src/data/population.json from ONS 2024-based national population projections.

Input: data/raw/uk_<code>_machine_readable.xlsx (from dataset Z1, 2024-based,
released 28 April 2026). Run scripts/fetch_ons.sh first to download.

Output: a compact age x year matrix per variant, both sexes combined,
scaled from UK to Great Britain (the National Insurance Fund covers GB only),
in thousands.
"""

import json
import os

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
OUT = os.path.join(ROOT, "src", "data", "population.json")

VARIANTS = {
    "principal": "ppp",
    "highMigration": "pph",
    "lowMigration": "ppl",
    "zeroMigration": "ppz",
}

YEAR_FROM = 2025
YEAR_TO = 2075
MAX_AGE = 90  # ages 90+ aggregated into the top bucket

# GB share of UK population: mid-2024 estimates, UK 69.3m, Northern Ireland 1.95m.
GB_SCALE = (69.3 - 1.95) / 69.3


def load_variant(code: str) -> list[list[int]]:
    path = os.path.join(RAW, f"uk_{code}_machine_readable.xlsx")
    wb = openpyxl.load_workbook(path, read_only=True)
    ws = wb["Population"]
    rows = ws.iter_rows(values_only=True)
    header = next(rows)
    years = [int(y) for y in header[2:]]
    col_idx = {y: i + 2 for i, y in enumerate(years)}

    # matrix[age][year_offset], persons
    matrix = [[0.0] * (YEAR_TO - YEAR_FROM + 1) for _ in range(MAX_AGE + 1)]
    for row in rows:
        sex, age_raw = row[0], row[1]
        if sex not in ("Females", "Males"):
            continue
        # top buckets appear as e.g. "105 - 109" or "110 and over"; take the lower bound
        age = int(str(age_raw).split("-")[0].split("and")[0].rstrip("+ "))
        bucket = min(age, MAX_AGE)
        for y in range(YEAR_FROM, YEAR_TO + 1):
            matrix[bucket][y - YEAR_FROM] += float(row[col_idx[y]])
    wb.close()
    # to GB thousands, rounded
    return [[round(v * GB_SCALE / 1000) for v in ages] for ages in matrix]


def main() -> None:
    out = {
        "meta": {
            "source": "ONS 2024-based national population projections (dataset Z1, released 28 April 2026)",
            "url": "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationprojections/datasets/z1zippedpopulationprojectionsdatafilesuk",
            "yearFrom": YEAR_FROM,
            "yearTo": YEAR_TO,
            "maxAge": MAX_AGE,
            "unit": "thousands, both sexes, Great Britain",
            "gbScale": round(GB_SCALE, 4),
            "note": "UK projection scaled to GB by the mid-2024 GB share of UK population; ages 90+ aggregated.",
        },
        "variants": {name: load_variant(code) for name, code in VARIANTS.items()},
    }
    with open(OUT, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    size = os.path.getsize(OUT)
    print(f"wrote {OUT} ({size/1024:.0f} KB)")
    # quick sanity print
    p = out["variants"]["principal"]
    total_2025 = sum(row[0] for row in p)
    over65_2025 = sum(row[0] for row in p[66:])
    print(f"GB total 2025: {total_2025/1000:.1f}m; aged 66+: {over65_2025/1000:.2f}m")


if __name__ == "__main__":
    main()
