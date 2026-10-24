#!/usr/bin/env python3
"""Build decade tables of M&S women's 'to fit' body measurements from ms-labels.json.
For each decade + label size + dimension we report the value printed on most labels
(the mode), how many labels agree, and every label that disagrees (kept for review,
not averaged in). Nothing is interpolated: a size/decade with no label stays empty."""
import json, os
from collections import Counter, defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
r = json.load(open(os.path.join(HERE, "ms-labels.json"), encoding="utf-8"))

def key(v):   # canonical printed value: prefer inches (all eras print them), else cm
    if "in" in v: return ("in", tuple(v["in"]))
    return ("cm", tuple(v["cm"]))

T = defaultdict(lambda: defaultdict(list))
for x in r:
    if x["group"] != "women" or not x["size"] or x["size"] == "multi" or x["decade"] is None or x["flags"]:
        continue
    for d in ("bust", "waist", "hips"):
        if d in x["dims"]:
            T[(x["decade"], x["size"])][d].append((key(x["dims"][d]), x["dims"][d].get("cm"), x))

def sz_order(s): return [int(p) for p in s.split("-")]
out = []
for (dec, size) in sorted(T, key=lambda k: (k[0], sz_order(k[1]))):
    row = {"decade": dec, "size": size}
    for d, vals in T[(dec, size)].items():
        c = Counter(k for k, _, _ in vals)
        (unit, val), n = c.most_common(1)[0]
        tie = len(c) > 1 and c.most_common(2)[1][1] == n
        cms = Counter(tuple(cm) for k, cm, _ in vals if k == (unit, val) and cm)
        row[d] = {
            "printed": {"unit": unit, "value": list(val)},
            "cm_printed": list(cms.most_common(1)[0][0]) if cms else None,
            "cm_derived": None if cms else [round(v * 2.54, 1) for v in val] if unit == "in" else None,
            "labels_agree": n, "labels_total": len(vals), "tie": tie,
            "evidence": [x["url"] for k, _, x in vals if k == (unit, val)],
            "disagree": [{"printed": f"{list(k[1])} {k[0]}", "url": x["url"], "date": x["date"], "title": x["title"]}
                         for k, _, x in vals if k != (unit, val)],
        }
    out.append(row)
json.dump(out, open(os.path.join(HERE, "ms-decade-tables.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for row in out:
    cells = []
    for d in ("bust", "waist", "hips"):
        if d in row:
            v = row[d]; p = v["printed"]
            cm = v["cm_printed"] or v["cm_derived"]
            cells.append(f"{d} {'-'.join('%g'%n for n in p['value'])}{p['unit']} ({'-'.join('%g'%n for n in cm)}cm{'*' if v['cm_derived'] else ''}) {v['labels_agree']}/{v['labels_total']}{' TIE' if v['tie'] else ''}")
    print(f"{row['decade']}s  {row['size']:6s} " + " | ".join(cells))
