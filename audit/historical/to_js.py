#!/usr/bin/env python3
"""Turn ms-decade-tables.json into the app's SOURCED_HISTORY block.
Rules: single label sizes only; a dimension is used only when more than half of that
decade's labels for that size print the same value (otherwise it is left blank and
listed in the note). cm = value printed on the label in cm; if the label printed
inches only, cm = inches x 2.54 (rounded 0.1) and the row says so."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, "ms-decade-tables.json"), encoding="utf-8"))
dec = {}
skipped = []
for row in T:
    if "-" in row["size"]:
        continue
    out = {"label": f"UK {row['size']}", "uk": row["size"]}
    inch, n, derived = {}, {}, []
    for d in ("bust", "waist", "hips"):
        v = row.get(d)
        if not v:
            continue
        if v["labels_agree"] * 2 <= v["labels_total"]:
            skipped.append(f"{row['decade']}s UK {row['size']} {d}: labels disagree ({v['labels_agree']} of {v['labels_total']})")
            continue
        p = v["printed"]
        if len(p["value"]) != 1:
            skipped.append(f"{row['decade']}s UK {row['size']} {d}: printed as a range {p['value']}")
            continue
        cm = v["cm_printed"] or v["cm_derived"]
        out[d] = cm[0]
        if p["unit"] == "in":
            inch[d] = p["value"][0]
        if v["cm_derived"]:
            derived.append(d)
        n[d] = v["labels_agree"]
    if not any(d in out for d in ("bust", "waist", "hips")):
        continue
    if inch: out["inch"] = inch
    out["labels"] = n
    if derived: out["cmFromInches"] = derived
    dec.setdefault(str(row["decade"]), []).append(out)

def js(o):
    if isinstance(o, dict):
        return "{" + ",".join(f"{k}:{js(v)}" for k, v in o.items()) + "}"
    if isinstance(o, list):
        return "[" + ",".join(js(v) for v in o) + "]"
    if isinstance(o, float) and o == int(o):
        return str(int(o))
    return json.dumps(o, ensure_ascii=False)

total = sum(len([1 for x in json.load(open(os.path.join(HERE,'ms-labels.json'))) if x['group']=='women' and x['size'] and x['size']!='multi' and x['decade'] and not x['flags'] and x['dims']]) for _ in [0])
lines = ["  \"ms-w\": {"]
for d in sorted(dec):
    lines.append(f"    \"{d}\": [")
    for r in sorted(dec[d], key=lambda r: int(r["uk"])):
        lines.append("      " + js(r) + ",")
    lines.append("    ],")
lines.append("  },")
open(os.path.join(HERE, "ms-w.js.txt"), "w").write("\n".join(lines))
json.dump({"skipped": skipped, "labels_used": total}, open(os.path.join(HERE, "ms-w-notes.json"), "w"), indent=1)
print("\n".join(lines)); print(skipped, total)
