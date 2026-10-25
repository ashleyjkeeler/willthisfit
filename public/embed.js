/*! WillThisFit embed v1 · https://willthisfit.me/integrate
 * Usage: <div data-willthisfit data-mode="convert" data-gender="women" data-brand="Zara" data-size="M" data-theme="light"></div>
 *        <script src="https://willthisfit.me/embed.js" async></script>
 * Creates an iframe that resizes itself to fit. No cookies, no tracking.
 */
(function () {
  var ORIGIN = "https://willthisfit.me";
  var KEYS = ["mode", "gender", "brand", "size", "system", "theme", "unit", "garment"];
  var frames = [];

  function mount(el) {
    if (el.getAttribute("data-willthisfit-ready")) return;
    el.setAttribute("data-willthisfit-ready", "1");
    var q = [];
    KEYS.forEach(function (k) {
      var v = el.getAttribute("data-" + k);
      if (v) q.push(encodeURIComponent(k) + "=" + encodeURIComponent(v.slice(0, 60)));
    });
    var f = document.createElement("iframe");
    f.src = ORIGIN + "/embed" + (q.length ? "?" + q.join("&") : "");
    f.title = "WillThisFit size checker";
    f.loading = "lazy";
    f.setAttribute("allow", "clipboard-write");
    f.style.cssText = "width:100%;height:640px;border:0;border-radius:12px;display:block;color-scheme:normal";
    el.appendChild(f);
    frames.push(f);
  }

  function mountAll() {
    var els = document.querySelectorAll("[data-willthisfit]");
    for (var i = 0; i < els.length; i++) mount(els[i]);
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN || !e.data || e.data.type !== "willthisfit:height") return;
    var h = Math.max(320, Math.min(5000, Number(e.data.height) || 0));
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === e.source) frames[i].style.height = h + "px";
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
  else mountAll();
})();
