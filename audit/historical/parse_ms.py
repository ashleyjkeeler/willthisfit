#!/usr/bin/env python3
"""Parse M&S Company Archive catalogue entries (St Michael garment labels) into
structured "label size -> to-fit body measurement" evidence.

Input : ms-archive-raw.json  (id, t=title, y=archive date, l=label text excerpt)
Output: ms-labels.json       one record per garment with a parsed size + measurement

Rules (accuracy first):
- Only numbers printed on the label (as transcribed by the archive) are used.
- When a label gives both cm and inches, both are kept as printed. If they disagree
  by more than 3 cm the record is flagged 'unit_conflict' and excluded from tables.
- Inch-only labels: cm = in x 2.54 (exact), marked derived.
- Dates come from the archive's own dating. 'c1959', '1960s', '1968-1974' are kept
  as given; decade is assigned only when the whole date range sits in one decade.
"""
import json, re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
raw = json.load(open(os.path.join(HERE, "ms-archive-raw.json"), encoding="utf-8"))

CHILD = re.compile(r"\b(baby|babies|infant|toddler|child|children|kids?|girls?'?|boys?'?|school|months?|yrs|years|age \d|height)\b", re.I)
MEN = re.compile(r"\b(men'?s|gent'?s|gentlemen|male|boxer|y-?front|tie\b|waistcoat)\b", re.I)
WOMEN = re.compile(r"\b(ladies|lady'?s|women'?s|dress|blouse|skirt|knickers|nightdress|nightie|bra\b|brassiere|slip|petticoat|camisole|suspender|girdle|negligee|kaftan|shirtwaister|pantalettes|briefs)\b", re.I)

INCH = r'(?:"|”|“|″|\'\'|ins?\b|inch(?:es)?\b)'
NUM = r"(\d{2,3}(?:\.\d)?(?:\s*(?:cms?|\"|”|″|\'\'|ins?)?\s*(?:/|-|–)\s*\d{2,3}(?:\.\d)?)?)"

def nums(s):
    return [float(x) for x in re.findall(r"\d{2,3}(?:\.\d)?", s)]

def parse_dim(text, dim):
    """Find 'TO FIT <DIM> ...' (or '<DIM> nn' right after a to-fit clause). Returns
    dict with cm/in lists as printed."""
    out = {}
    text = re.sub(r"(?i)\btour\s+de\s+(poitrine|hanches?|taille)\b[,:]?", " ", text)
    text = re.sub(r"(?i)\b(bust|chest|hips?|waist)\s*[,/]\s*(?=\d)", r"\1 ", text)
    # value written before the word: 'to fit a 84cm/33inch bust'
    m = re.search(r"(?i)" + NUM + r"\s*cms?\s*/\s*" + NUM + r"\s*(?:\"|”|ins?|inch(?:es)?)\s*" + dim + r"\b", text)
    if m:
        return {"cm": nums(m.group(1)), "in": nums(m.group(2))}
    # clause after the dimension word, up to the next dimension word / full stop-ish
    for m in re.finditer(r"\b%s(?![a-z])[^A-Za-z0-9]{0,3}(.{0,60})" % dim, text, re.I):
        seg = m.group(1)
        if not re.match(r"\s*[:,/]?\s*(?:of\s+|a\s+)?\d", seg):   # value must follow the word
            continue
        seg = re.split(r"(?i)\b(bust|chest|hips?|waist|length|inside|height|weight|shoe|collar|cb|measur\w*|made|label|care|wash\w*|reverse|\d+\s*%)|[\'’]\s*(?:\.|$|[A-Z])", seg)[0]
        cm = re.search(NUM + r"\s*cms?\b", seg, re.I)
        inch = re.search(NUM + r"\s*" + INCH, seg, re.I)
        bare = re.match(r"\s*[,:]?\s*" + NUM + r"(?!\s*(?:cm|mm|\d))", seg, re.I)
        if cm:
            v = [n for n in nums(cm.group(1)) if n >= 50]      # a cm body girth is never < 50
            if v: out.setdefault("cm", v)
        if inch:
            v = [n for n in nums(inch.group(1)) if 20 <= n < 70]   # an adult girth in inches is 20-70
            if v: out.setdefault("in", v)
        if not cm and not inch and bare:
            v = nums(bare.group(1))
            # bare numbers: < 60 are inches on these labels, >= 60 are cm
            out.setdefault("in" if max(v) < 60 else "cm", v)
        if out: break
    return out

def ok(a): return 4 <= a <= 32 and a % 2 == 0
def parse_size(text):
    t = text
    m = re.search(r"\b(\d{1,2})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{1,2})\b(?!\s*(?:cm|in|\"|”))", t)
    if m and all(ok(int(g)) for g in m.groups()):
        return "multi", m.group(0)
    R = r"(\d{1,2})\s*(?:-|–|/)\s*(\d{1,2})"
    for pat in (r"\bsize\s*" + R, R + r"\s*(?:GB|standard|short|long)\b", r"\(\s*" + R + r"\s*\)",
                r"\b" + R + r"\s*[.,]\s*(?:3[2-9]|[45]\d)\s*-\s*(?:3[4-9]|[45]\d)\b", r"(?:made in [a-z .]+?|^)\s*[.,]?\s*" + R + r"\s*[.,]"):
        m = re.search(pat, t, re.I)
        if m:
            a_, b_ = int(m.group(1)), int(m.group(2))
            if ok(a_) and ok(b_) and b_ - a_ == 2:     # M&S dual sizes are adjacent (10-12), never 10/18 (a colour code)
                return f"{a_}-{b_}", m.group(0)
    for pat in (r"\bsize\s*(\d{1,2})(?:\s*(?:[SLT]|short|long|tall|petite))?\b", r"\b(\d{1,2})\s*GB\b", r"\b(\d{1,2})\s*standard\b",
                r"\b(\d{1,2})\s*(?:short|long|extra long|ex long)\b",
                r"\b(\d{1,2})\s*[ .,/]\s*(?:3[2-9]|[45]\d)\s*(?:taille|eur|standard|long|court|\.|,|$)", r"\(\s*(\d{1,2})\s*(?:ST|S|L|PFS)?\s*\)"):
        m = re.search(pat, t, re.I)
        if m and ok(int(m.group(1))):
            return m.group(1), m.group(0)
    return None, None

def parse_date(y):
    y = y.strip()
    yrs = [int(v) for v in re.findall(r"(1[89]\d\d|20[0-2]\d)", y)]
    if not yrs:
        return None, None, y
    approx = bool(re.search(r"\bc\.?\s?\d|circa|late|early|mid|\ds\b", y, re.I))
    lo, hi = min(yrs), max(yrs)
    if re.search(str(hi) + r"s\b", y):
        hi += 9                           # '1960s' or '1980s-1990s' -> to the end of that decade
    decade = lo // 10 * 10 if lo // 10 == hi // 10 else None
    return (lo, hi), decade, y

PAIRS = {"'": "'’", "‘": "’'", '"': '"”', "“": '”"'}
def label_text(t):
    """Only the label wording the archive quotes, not the cataloguer's own description."""
    segs = []
    for m in re.finditer(r"(?i)(reads?|states?|says|reading|printed|underneath[^'\"‘“]{0,40})\s*[:,]?\s*(['\"‘“])", t):
        start, closers = m.end(), PAIRS[m.group(2)]
        end = None
        for k in range(start, min(len(t), start + 500)):
            c = t[k]
            if c in closers:
                prev = t[k-1] if k > start else ""
                nxt = t[k+1] if k + 1 < len(t) else ""
                if prev.isdigit() or c == nxt or prev == c:   # inch marks 38" or 33''
                    continue
                if prev.isalpha() and nxt.isalpha():          # apostrophe inside a word
                    continue
                end = k
                break
        segs.append(t[start:end if end else start + 400])
    return " | ".join(segs), bool(segs)

recs = []
for x in raw:
    text, quoted = label_text(x["l"])
    if not quoted:
        text = x["l"]
    title = x["t"]
    whole = title + " " + text
    if CHILD.search(whole):
        group = "children"
    elif MEN.search(title) or (re.search(r"to\s*fit\s*chest", text, re.I) and not WOMEN.search(title)):
        group = "men"
    elif WOMEN.search(whole) or re.search(r"to\s*fit\s*(bust|hips)", text, re.I):
        group = "women"
    else:
        group = "unknown"
    segs = text.split(" | ") if quoted else [text]
    parts = []          # each: [size, size_text, dims]
    for sg in segs:
        sz, szt = parse_size(sg)
        dd = {}
        for d, key in (("bust", "bust"), ("chest", "chest"), ("hips?", "hips"), ("waist", "waist")):
            v = parse_dim(sg, d)
            if v:
                dd[key] = v
        if sz and parts and parts[-1][2] and parts[-1][0] and parts[-1][0] != sz:
            parts.append([sz, szt, dd])          # a second garment / label with its own size
        elif not parts:
            parts.append([sz, szt, dd])
        else:
            if sz and not parts[-1][0]:
                parts[-1][0], parts[-1][1] = sz, szt
            for k, v in dd.items():
                parts[-1][2].setdefault(k, v)
    rng, decade, ytxt = parse_date(x["y"])
    for size, size_src, dims in parts:
        flags = []
        for k, v in dims.items():
            if "cm" in v and "in" in v and len(v["cm"]) == len(v["in"]):
                if any(abs(c - i * 2.54) > 3 for c, i in zip(v["cm"], v["in"])):
                    flags.append("unit_conflict:" + k)
        recs.append({
            "id": x["id"], "url": f"https://msheritage.access.preservica.com/uncategorized/{x['id']}/",
            "title": title, "date": ytxt, "years": rng, "decade": decade, "group": group,
            "size": size, "size_text": size_src, "dims": dims, "flags": flags + ([] if quoted else ["unquoted"]), "label_text": text, "label_excerpt": x["l"],
        })

json.dump(recs, open(os.path.join(HERE, "ms-labels.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print("records", len(recs))
print("groups", Counter(r["group"] for r in recs))
print("with size+bust/hips (women)", sum(1 for r in recs if r["group"] == "women" and r["size"] and ("bust" in r["dims"] or "hips" in r["dims"])))
print("flags", Counter(f for r in recs for f in r["flags"]))
print("no decade", sum(1 for r in recs if r["decade"] is None))
