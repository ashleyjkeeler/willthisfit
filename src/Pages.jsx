// Integrate (embed for shops and sites) and Press pages.
import { useState, useMemo } from "react";
import { Mark } from "./brand.jsx";

const SITE = "https://willthisfit.me";

const H2 = ({ children }) => <h2 style={{ fontSize: 26, fontWeight: 500, color: "var(--c-ink)", margin: "0 0 10px", letterSpacing: "-0.01em" }}>{children}</h2>;
const H3 = ({ children }) => <h3 className="ins" style={{ fontSize: 15, fontWeight: 600, color: "var(--c-ink)", margin: "26px 0 8px" }}>{children}</h3>;
const P = ({ children, style }) => <p className="ins" style={{ fontSize: 14, color: "var(--c-ink-2)", lineHeight: 1.7, margin: "0 0 10px", maxWidth: 680, ...style }}>{children}</p>;
const Card = ({ children, style }) => <div className="card" style={{ padding: "26px 28px", marginBottom: 20, ...style }}>{children}</div>;
const Eyebrow = ({ children }) => <div className="ins" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-brand-text)", marginBottom: 8 }}>{children}</div>;

function CopyBox({ code, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ } };
  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      <pre aria-label={label} style={{ background: "var(--c-night)", color: "var(--c-on-night)", borderRadius: "var(--r-md)", padding: "16px 18px", paddingRight: 84, fontSize: 12.5, lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", margin: 0 }}>{code}</pre>
      <button className="btn ins" onClick={copy} style={{ position: "absolute", top: 10, right: 10, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: copied ? "var(--c-mint)" : "rgba(255,255,255,0.12)", color: "white" }}>{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}

const Field = ({ label, children }) => (
  <label className="ins" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--c-ink-3)" }}>{label}{children}</label>
);
const sel = { padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--c-border)", fontSize: 14, background: "var(--c-surface)", color: "var(--c-ink)", textTransform: "none", letterSpacing: 0, fontWeight: 400 };

export function IntegratePage({ brandNames }) {
  const [cfg, setCfg] = useState({ mode: "convert", gender: "women", brand: "", size: "", theme: "light" });
  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));
  const params = useMemo(() => {
    const q = new URLSearchParams();
    if (cfg.mode !== "convert") q.set("mode", cfg.mode);
    if (cfg.gender !== "women") q.set("gender", cfg.gender);
    if (cfg.brand) q.set("brand", cfg.brand);
    if (cfg.size) q.set("size", cfg.size);
    if (cfg.theme !== "light") q.set("theme", cfg.theme);
    return q.toString();
  }, [cfg]);
  const dataAttrs = Object.entries({ mode: cfg.mode !== "convert" && cfg.mode, gender: cfg.gender !== "women" && cfg.gender, brand: cfg.brand, size: cfg.size, theme: cfg.theme !== "light" && cfg.theme })
    .filter(([, v]) => v).map(([k, v]) => ` data-${k}="${String(v).replace(/"/g, "&quot;")}"`).join("");
  const scriptSnippet = `<div data-willthisfit${dataAttrs}></div>\n<script src="${SITE}/embed.js" async></script>`;
  const iframeSnippet = `<iframe src="${SITE}/embed${params ? "?" + params : ""}" title="WillThisFit size checker" loading="lazy" style="width:100%;min-height:640px;border:0;border-radius:12px"></iframe>`;
  const linkParams = (() => { const q = new URLSearchParams(params); q.delete("theme"); return q.toString(); })();
  const linkUrl = `${SITE}/${linkParams ? "?" + linkParams : ""}`;
  const linkSnippet = `Not sure of the size? Check the measurements: ${linkUrl}`;

  return (
    <div className="stagger" style={{ maxWidth: 920, margin: "0 auto" }}>
      <Card>
        <Eyebrow>For shops, sellers and creators</Eyebrow>
        <H2>Add WillThisFit to your site</H2>
        <P>Put the WillThisFit size checker on your shop, blog or store page, so buyers can see what a label size measures before they buy. It's free and takes one line of code. It updates itself as we verify more brands.</P>
        <ul className="ins" style={{ fontSize: 14, color: "var(--c-ink-2)", lineHeight: 1.8, paddingLeft: 20, margin: "6px 0 0" }}>
          <li>Works on Shopify, Wix, Squarespace, WordPress and any site that allows HTML.</li>
          <li>No cookies, no tracking and no sign-in in the embedded version.</li>
          <li>Keep the "Size data by WillThisFit" credit visible. It's included automatically.</li>
        </ul>
      </Card>

      <Card>
        <h3 className="ins" style={{ fontSize: 15, fontWeight: 600, color: "var(--c-ink)", margin: "0 0 10px" }}>1. Choose what it shows</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14 }}>
          <Field label="Tool"><select style={sel} value={cfg.mode} onChange={(e) => set("mode", e.target.value)}><option value="convert">Size converter</option><option value="measure">Find by measurements</option></select></Field>
          <Field label="Sizes for"><select style={sel} value={cfg.gender} onChange={(e) => set("gender", e.target.value)}><option value="women">Women</option><option value="men">Men</option><option value="kids">Kids</option></select></Field>
          <Field label="Brand (optional)"><input style={sel} list="int-brands" value={cfg.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Any brand" /><datalist id="int-brands">{brandNames.map((n) => <option key={n} value={n} />)}</datalist></Field>
          <Field label="Size (optional)"><input style={sel} value={cfg.size} maxLength={10} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 12" /></Field>
          <Field label="Theme"><select style={sel} value={cfg.theme} onChange={(e) => set("theme", e.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select></Field>
        </div>

        <H3>2. Paste this where you want it</H3>
        <P style={{ marginBottom: 0 }}>Recommended: it resizes itself to fit your page.</P>
        <CopyBox code={scriptSnippet} label="Embed code" />
        <details style={{ marginTop: 12 }}>
          <summary className="ins" style={{ fontSize: 13, color: "var(--c-brand-text)", cursor: "pointer" }}>Site doesn't allow scripts? Use an iframe instead</summary>
          <CopyBox code={iframeSnippet} label="Iframe code" />
        </details>

        <H3>Preview</H3>
        <div style={{ border: "1px dashed var(--c-border-strong)", borderRadius: "var(--r-md)", padding: 8, background: "var(--c-surface-2)" }}>
          <iframe key={params} src={`/embed${params ? "?" + params : ""}`} title="WillThisFit size checker preview" loading="lazy" style={{ width: "100%", height: 560, border: 0, borderRadius: 10, background: "var(--c-surface)" }} />
        </div>
      </Card>

      <Card>
        <H3>Selling on Vinted, eBay or Depop?</H3>
        <P>Marketplaces don't allow embedded tools in listings, but you can add a link to your description. It opens WillThisFit with your brand and size already filled in. Some apps don't make links clickable, so the buyer may need to copy it.</P>
        <CopyBox code={linkSnippet} label="Listing text" />
      </Card>

      <Card>
        <H3>Platforms and apps</H3>
        <P>Building a marketplace, resale service or shopping app? We're working on an API: brand and size in, body measurements, a fit verdict and the source out. Get in touch to join the pilot: <a href="mailto:ashleyjkeeler@gmail.com?subject=WillThisFit%20API">ashleyjkeeler@gmail.com</a>.</P>
        <P style={{ fontSize: 12, color: "var(--c-ink-3)" }}>Free to use with the credit in place. Please don't copy or scrape the underlying data; link or embed instead. We may change or withdraw the embed. Brand names belong to their owners, and WillThisFit isn't affiliated with any brand.</P>
      </Card>
    </div>
  );
}

const TOKENS = [
  ["Night", "#0e1e14", "Header, footer, app icon"], ["Forest", "#2d7a4a", "Primary buttons, links on light"], ["Mint", "#4db87a", "Accent on dark, the .me"],
  ["Ink", "#122318", "Body text on light"], ["Paper", "#f5f3ee", "Page background"], ["Surface", "#ffffff", "Cards"],
];
const ASSETS = [
  ["wordmark.svg", "Wordmark", "For light backgrounds", false], ["wordmark-on-dark.svg", "Wordmark", "For dark backgrounds", true],
  ["mark.svg", "Hanger mark", "For light backgrounds", false], ["mark-on-dark.svg", "Hanger mark", "For dark backgrounds", true],
  ["app-icon.svg", "App icon", "Square, any background", false], ["powered-by.svg", "Credit badge", "\"Size data by WillThisFit\"", false],
  ["powered-by-dark.svg", "Credit badge", "Dark version", true], ["og-image.png", "Social image", "1200 × 630", true],
];

export function PressPage({ facts }) {
  return (
    <div className="stagger" style={{ maxWidth: 920, margin: "0 auto" }}>
      <Card>
        <Eyebrow>Press and brand</Eyebrow>
        <H2>About WillThisFit</H2>
        <P><strong style={{ color: "var(--c-ink)" }}>WillThisFit.me is a free size guide for people buying clothes second-hand.</strong> Second-hand shoppers usually can't try clothes on or return them. WillThisFit shows what a label size actually measures at {facts.brands}+ brands, with every chart linked to the brand's own size guide and dated. It also covers vintage sizing by decade, taken from brands' own dated labels.</P>
        <H3>Key facts</H3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          {[[`${facts.brands}+`, "brands"], [`${facts.sizes.toLocaleString("en-GB")}+`, "sizes"], [String(facts.verified), "charts re-checked line by line, Oct 2026"], ["1950s–1990s", "M&S vintage sizing, from 290+ dated labels"]].map(([n, l]) => (
            <div key={l} style={{ background: "var(--c-surface-2)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: "var(--c-brand-text)" }}>{n}</div>
              <div className="ins" style={{ fontSize: 12, color: "var(--c-ink-2)", lineHeight: 1.5 }}>{l}</div>
            </div>
          ))}
        </div>
        <H3>Boilerplate</H3>
        <P style={{ background: "var(--c-surface-2)", borderRadius: "var(--r-md)", padding: "14px 16px", maxWidth: "none" }}>WillThisFit.me is a free, independent size guide for second-hand shoppers. It gives body-measurement size charts for {facts.brands}+ fashion brands, each linked to the brand's own published size guide and dated, plus vintage sizing by decade from brands' archive labels. It's built in the UK to help people buy pre-loved clothes with confidence and keep clothes out of landfill.</P>
        <H3>Contact</H3>
        <P>Ashley Keeler, founder · <a href="mailto:ashleyjkeeler@gmail.com?subject=WillThisFit%20press">ashleyjkeeler@gmail.com</a></P>
      </Card>

      <Card>
        <H2>Logos and credit badge</H2>
        <P>Download and use these to write about WillThisFit or to credit it. Please don't change the colours, stretch the logos or put them on busy images.</P>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginTop: 14 }}>
          {ASSETS.map(([file, name, note, dark]) => (
            <a key={file} href={`/brand/${file}`} download style={{ textDecoration: "none", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", overflow: "hidden", display: "block" }}>
              <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: dark ? "var(--c-night)" : "#ffffff" }}>
                <img src={`/brand/${file}`} alt={`${name}: ${note}`} style={{ maxWidth: "100%", maxHeight: 64 }} />
              </div>
              <div className="ins" style={{ padding: "10px 12px", fontSize: 13, color: "var(--c-ink)" }}><strong>{name}</strong><div style={{ fontSize: 12, color: "var(--c-ink-3)" }}>{note} · {file.endsWith(".png") ? "PNG" : "SVG"}</div></div>
            </a>
          ))}
        </div>
      </Card>

      <Card>
        <H2>Design system</H2>
        <P>The colours, type and shapes the site is built from. These are the same tokens the app uses.</P>
        <H3>Colour</H3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
          {TOKENS.map(([n, hex, use]) => (
            <div key={n} style={{ border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
              <div style={{ height: 56, background: hex }} />
              <div className="ins" style={{ padding: "8px 10px", fontSize: 12, color: "var(--c-ink-2)", lineHeight: 1.5 }}><strong style={{ color: "var(--c-ink)" }}>{n}</strong> <code>{hex}</code><br />{use}</div>
            </div>
          ))}
        </div>
        <H3>Type</H3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
          <div style={{ background: "var(--c-surface-2)", borderRadius: "var(--r-md)", padding: 16 }}>
            <div style={{ fontFamily: "var(--f-display)", fontSize: 30, color: "var(--c-ink)", lineHeight: 1.15 }}>Replace guessing <em style={{ color: "var(--c-brand-text)", fontWeight: 400 }}>with knowing</em></div>
            <div className="ins" style={{ fontSize: 12, color: "var(--c-ink-3)", marginTop: 8 }}>Fraunces: headings, the wordmark, numbers in size tiles</div>
          </div>
          <div style={{ background: "var(--c-surface-2)", borderRadius: "var(--r-md)", padding: 16 }}>
            <div className="ins" style={{ fontSize: 16, color: "var(--c-ink)", lineHeight: 1.6 }}>Body-measurement size charts for every brand, linked to the source and dated.</div>
            <div className="ins" style={{ fontSize: 12, color: "var(--c-ink-3)", marginTop: 8 }}>Instrument Sans: interface, body text, labels</div>
          </div>
        </div>
        <H3>Shapes and components</H3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="btn ins" style={{ padding: "10px 20px", background: "var(--c-brand)", color: "white", borderRadius: 10, fontSize: 14, fontWeight: 600 }}>Primary button</span>
          <span className="pill" style={{ borderColor: "var(--c-brand)", background: "var(--c-brand)", color: "white" }}>Selected pill</span>
          <span className="pill" style={{ borderColor: "var(--c-border)", background: "var(--c-surface)", color: "var(--c-ink-2)" }}>Pill</span>
          <span className="ins" style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "var(--c-brand-tint)", color: "var(--c-brand-text)" }}>91% High confidence</span>
          <span className="ins" style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "var(--c-danger-tint)", color: "var(--c-danger)" }}>Unverified</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Mark size={28} color="var(--c-brand)" /><span className="ins" style={{ fontSize: 12, color: "var(--c-ink-3)" }}>Corners 8, 12, 16 · pills fully round</span></span>
        </div>
        <P style={{ fontSize: 12, color: "var(--c-ink-3)", marginTop: 14 }}>Every colour has a dark-mode pair. The full token list is in the site's stylesheet.</P>
      </Card>
    </div>
  );
}

export function PoweredBy({ href, dark }) {
  return (
    <a href={href} target="_blank" rel="noopener" aria-label="Size data by WillThisFit (opens in a new tab)"
      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px 7px 10px", borderRadius: 999, border: `1px solid ${dark ? "#2a4535" : "#d6d0c4"}`, background: dark ? "#0e1e14" : "#ffffff", textDecoration: "none" }}>
      <Mark size={20} color={dark ? "#4db87a" : "#2d7a4a"} />
      <span className="ins" style={{ fontSize: 12, color: dark ? "#a9c2b2" : "#4f5b52" }}>Size data by <strong style={{ color: dark ? "#e8f2ec" : "#122318", fontWeight: 600 }}>WillThisFit</strong></span>
    </a>
  );
}
