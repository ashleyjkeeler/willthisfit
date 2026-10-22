#!/usr/bin/env python3
"""Apply verified size charts (audit/verified/*.json) to src/WillThisFit.jsx.

Each JSON file holds ONE brand entry, read from that brand's own official size guide:
{
  "id": "zara-w",                 # existing entry id (or a new id when "new": true)
  "checked": "2026-10",           # month the official page was read
  "chartYear": "2026",
  "sources": [{"label": "...", "url": "https://..."}],
  "rows": [                       # one per size, exactly as published
    {"label": "XS", "uk": "6", "us": "2", "eu": "34",
     "bust": [80, 84],            # [min, max] when the brand publishes a range,
     "waist": 62,                 # or a single number when it publishes one value
     "hips": 88}
  ],
  "audit": "free text: what was wrong before / caveats",
  "new": false,                   # true = add as a new brand entry (needs "entry" block)
  "entry": {...}                  # for new brands: name, origin, tier, notes, fit, confidence, list
}

Ranges are stored as rng:{bust:[min,max],...} on the row, and the single value
(bust/waist/hips/chest) is set to the midpoint so legacy code keeps working.
The matcher uses the range (dimDist). Nothing is ever estimated here: if a
dimension isn't in the JSON row it is left out of the output row.
"""
import json, re, sys, glob, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src", "WillThisFit.jsx")
DIMS = ["bust", "chest", "waist", "hips", "height", "inseam", "underbust", "foot"]
ARRAYS = {"w": "WOMEN_BRANDS", "m": "MEN_BRANDS", "k": "KIDS_BRANDS", "s": "SHOE_BRANDS"}


def js_str(v):
    return json.dumps(str(v), ensure_ascii=False)


def num(v):
    # keep the published precision exactly; only strip float noise from midpoints
    f = round(float(v), 4)
    return int(f) if f == int(f) else f


def row_js(r):
    parts = [f"label:{js_str(r['label'])}"]
    for k in ("uk", "us", "eu"):
        if k in r and r[k] is not None:
            parts.append(f"{k}:{js_str(r[k])}")
    rng = {}
    for d in DIMS:
        if d not in r or r[d] is None:
            continue
        v = r[d]
        if isinstance(v, list):
            lo, hi = num(v[0]), num(v[1])
            rng[d] = (lo, hi)
            parts.append(f"{d}:{num((lo + hi) / 2)}")
        else:
            parts.append(f"{d}:{num(v)}")
    if rng:
        parts.append("rng:{" + ",".join(f"{k}:[{a},{b}]" for k, (a, b) in rng.items()) + "}")
    for k in ("altLabel",):
        if k in r:
            parts.append(f"{k}:{js_str(r[k])}")
    return "{" + ",".join(parts) + "}"


def find_entry(s, eid):
    m = re.search(r'\n  \{\n    id:"%s",.*?\n  \},' % re.escape(eid), s, re.S)
    return m


def apply_one(s, v, log):
    eid = v["id"]
    rows = "\n".join("      " + row_js(r) + "," for r in v["rows"])
    srcs = ",".join(
        "{label:%s,url:%s,checked:%s}" % (js_str(x["label"]), js_str(x["url"]), js_str(v["checked"]))
        for x in v["sources"]
    )
    m = find_entry(s, eid)
    if m:
        e = m.group(0)
        old_sizes = re.search(r"\n    sizes:\[(.*?)\n    \]", e, re.S)
        new = e
        new = re.sub(r'lastVerified:"[^"]*"', f'lastVerified:"{v["checked"]}"', new, count=1)
        if 'chartYear:"' in new:
            new = re.sub(r'chartYear:"[^"]*"', f'chartYear:"{v["chartYear"]}"', new, count=1)
        new = re.sub(r"sources:\[.*?\],\n", "sources:[" + srcs + "],\n", new, count=1, flags=re.S)
        new, n = re.subn(r"\n    sizes:\[.*?\n    \],?", "\n    sizes:[\n" + rows + "\n    ],", new, count=1, flags=re.S)
        if n != 1:
            raise SystemExit(f"{eid}: sizes block not found")
        # drop any later duplicate lastVerified/chartYear keys (later keys win in JS)
        head, _, tail = new.partition("\n    sources:[")
        tail = re.sub(r'\s*lastVerified:"[^"]*",?', "", tail)
        tail = re.sub(r'\s*chartYear:"[^"]*",?', "", tail)
        new = head + "\n    sources:[" + tail
        if v.get("notes"):
            new = re.sub(r'notes:"(?:[^"\\]|\\.)*"', "notes:" + js_str(v["notes"]).replace("\\", "\\\\"), new, count=1)
        if "verifiedBy:" not in new:
            new = new.replace("\n    sizes:[", '\n    verifiedBy:"official-page",\n    sizes:[', 1)
        s = s[: m.start()] + new + s[m.end():]
        log.append({"id": eid, "action": "updated", "old": old_sizes.group(1).strip() if old_sizes else None,
                    "audit": v.get("audit", "")})
        return s
    if not v.get("new"):
        raise SystemExit(f"{eid}: no existing entry and not marked new")
    en = v["entry"]
    arr = ARRAYS[en["list"]]
    block = (
        "\n  {\n"
        f'    id:"{eid}", name:{js_str(en["name"])}, origin:{js_str(en["origin"])}, tier:{js_str(en["tier"])}, '
        f'lastVerified:"{v["checked"]}", chartYear:"{v["chartYear"]}",\n'
        f"    sources:[{srcs}],\n"
        f"    notes:{js_str(en['notes'])}, fit:{js_str(en['fit'])},\n"
        f"    inconsistencyWarning:{str(en.get('inconsistencyWarning', False)).lower()}, confidence:{int(en['confidence'])},\n"
        '    verifiedBy:"official-page",\n'
        f"    sizes:[\n{rows}\n    ],\n  }},"
    )
    i = s.index(f"const {arr} = [") + len(f"const {arr} = [")
    s = s[:i] + block + s[i:]
    log.append({"id": eid, "action": "added", "audit": v.get("audit", "")})
    return s


def apply_flags(s, log):
    fp = os.path.join(ROOT, "audit", "flags.json")
    if not os.path.exists(fp):
        return s
    for fl in json.load(open(fp, encoding="utf-8")):
        m = find_entry(s, fl["id"])
        if not m:
            raise SystemExit(f"flag for unknown id {fl['id']}")
        e = m.group(0)
        if "auditFlag:" in e:
            e = re.sub(r'auditFlag:"(?:[^"\\]|\\.)*"', "auditFlag:" + js_str(fl["flag"]).replace("\\", "\\\\"), e, count=1)
        else:
            e = e.replace("\n    sizes:[", "\n    auditFlag:" + js_str(fl["flag"]) + ', verifiedBy:"unverified",\n    sizes:[', 1)
        s = s[: m.start()] + e + s[m.end():]
        log.append({"id": fl["id"], "action": "flagged", "audit": fl["flag"]})
    return s


def main(files):
    s = open(SRC, encoding="utf-8").read()
    log = []
    for f in files:
        v = json.load(open(f, encoding="utf-8"))
        s = apply_one(s, v, log)
    s = apply_flags(s, log)
    open(SRC, "w", encoding="utf-8").write(s)
    os.makedirs(os.path.join(ROOT, "audit", "log"), exist_ok=True)
    stamp = datetime.date.today().isoformat()
    with open(os.path.join(ROOT, "audit", "log", f"{stamp}.jsonl"), "a", encoding="utf-8") as fh:
        for l in log:
            fh.write(json.dumps(l, ensure_ascii=False) + "\n")
    for l in log:
        print(l["action"], l["id"])


if __name__ == "__main__":
    main(sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, "audit", "verified", "*.json"))))
