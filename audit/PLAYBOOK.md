# Size-chart audit playbook

This is how every audit run works, whether by hand or as a scheduled task. **Accuracy is paramount: any guesswork undermines the whole database.**

## Rules (never break these)
1. **Official sources only.** A number counts only if it was read on the brand's **own** website (or its own size-guide API or product-page size guide) on the day of the run. Retailer pages, aggregators, blogs and AI summaries are not evidence.
2. **Read numbers verbatim.** Extract tables from the page itself (DOM text via the browser) and record exactly what is printed. Never use WebFetch's summarised output for numbers.
3. **No estimates, no conventions.** If the brand doesn't publish a value (US size, waist for tops, a size row), leave it out. The only allowed conversion is inches to cm at exactly 2.54, rounded to 0.1. Keep the inch originals in `_in`.
4. **Ranges stay ranges.** A published range becomes `[min, max]`; `apply.py` stores it as `rng` plus a derived midpoint.
5. **Can't verify? Flag it, don't change it.** Blocked pages, no body chart, or ambiguous tables get an entry in `audit/flags.json` with a plain-English reason. The stored numbers stay unchanged.
6. **Cookies:** always reject optional cookies. Never sign in to a brand site, never enter personal data, never accept terms.

## One run
1. Set up the repo: `git pull`, `npm ci`.
2. Open `audit/queue.json`. Take the first **8** entries with `"status": "todo"`, in file order (priority 1 = the batch-2 brands, then women's, men's, kids', shoes).
3. For each entry:
   1. Find the brand's official UK size guide. Start from `stored_source`, but expect URLs to have moved; search the brand's own site.
   2. Read the relevant chart from the page's DOM (tops/general chart for clothing entries). Check the rows by position against the column headers.
   3. If it can be verified: write `audit/verified/<id>.json` in the format documented at the top of `audit/apply.py`, with `checked` = this month (`YYYY-MM`), the official URL(s), and an `audit` note on what was wrong before.
   4. If it can't: add `{ "id", "flag" }` to `audit/flags.json`.
   5. Set the queue entry's `status` to `verified`, `flagged` or `skipped` (temporary failure, e.g. browser unavailable), and add a `note` and `checked` date.
4. Apply and check:
   ```
   python3 audit/apply.py audit/verified/<new files>.json
   npm run build
   node audit/verify.mjs      # must print 0 failures
   node tests/api.test.mjs    # must pass
   ```
   - If `verify.mjs` fails, fix the cause, or revert that brand and flag it. Never commit with failures.
5. Release (standing rule: every change gets a version bump and a Help/changelog entry).
   - Bump the patch version in `APP_VERSION`.
   - Add a `CHANGELOG` line naming the brands verified or flagged.
   - Commit, then push to `main` (Netlify deploys automatically).
6. Report: append a dated section to `audit/runs.md`, listing each brand, its outcome, what changed (old value to new value for notable fixes) and the official URL.

## If the run can't work properly
- **Browser unavailable** (desktop app offline): mark the run's entries `skipped`, change nothing else, and write a one-line note in `audit/runs.md`.
- **A site needs approval:** request it. If the request isn't answered, skip that brand.
- **Uncertain about anything:** flag it, don't guess.
