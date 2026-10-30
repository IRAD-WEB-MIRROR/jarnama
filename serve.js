/* Attelkom Jarnama ad server.
   <script src="https://ads.attelkom.net/serve.js" data-theme="current state" defer></script>
   <div class="jarnama" data-size="728x90"></div>
   <div class="jarnama" data-size="240x400" data-theme="sketchy"></div>   (a slot can override the theme)
   Slots added after load are filled by window.jarnamaFill().
   Each slot gets a random active ad of its size that fits the slot's themes (see fits() below); empty slots stay hidden. */
(function () {
  var me = document.currentScript;
  var base = me.src.replace(/serve\.js.*$/, "");
  var pageThemes = (me.getAttribute("data-theme") || "current").split(/\s+/);
  // Era themes set the look, the others the kind of advertiser.
  // An ad fits when its era (if it has one) is among the requested eras (if any were asked for),
  // and its advertiser type (if it has one) is among the requested types.
  var ERAS = ["dialup", "flash", "current"];
  function fits(adThemes, want) {
    adThemes = adThemes || [];
    var wantEra = want.filter(function (t) { return ERAS.indexOf(t) >= 0; });
    var wantType = want.filter(function (t) { return ERAS.indexOf(t) < 0; });
    var adEra = adThemes.filter(function (t) { return ERAS.indexOf(t) >= 0; });
    var adType = adThemes.filter(function (t) { return ERAS.indexOf(t) < 0; });
    var eraOk = !wantEra.length || !adEra.length || adEra.some(function (t) { return wantEra.indexOf(t) >= 0; });
    var typeOk = !adType.length || adType.some(function (t) { return wantType.indexOf(t) >= 0; });
    var anyOk = adThemes.some(function (t) { return want.indexOf(t) >= 0; });
    return eraOk && typeOk && anyOk;
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function fill(ads) {
    var slots = document.querySelectorAll(".jarnama[data-size]:not([data-filled])");
    Array.prototype.forEach.call(slots, function (slot) {
      slot.setAttribute("data-filled", "");
      var size = slot.getAttribute("data-size"), t = today();
      var want = slot.getAttribute("data-theme") ? slot.getAttribute("data-theme").split(/\s+/) : pageThemes;
      var pool = ads.filter(function (a) {
        return a.active !== false && a.size === size &&
          fits(a.themes, want) &&
          (!a.start || a.start <= t) && (!a.end || a.end >= t);
      });
      if (!pool.length) { slot.style.display = "none"; return; }
      var ad = pool[Math.floor(Math.random() * pool.length)];
      var wh = size.split("x"), w = wh[0], h = wh[1], src = base + ad.file;
      var inner = /\.html?$/.test(ad.file)
        ? '<iframe src="' + src + '" width="' + w + '" height="' + h + '" scrolling="no" frameborder="0" title="' + (ad.alt || "Advertisement") + '"></iframe>'
        : '<img src="' + src + '" width="' + w + '" height="' + h + '" alt="' + (ad.alt || "") + '">';
      var href = !ad.link ? "#" : /^https?:/.test(ad.link) ? ad.link : base + ad.link;
      slot.innerHTML = '<a href="' + href + '" rel="sponsored noopener" target="_blank">' + inner + "</a>";
      slot.style.display = "";
    });
  }
  // Pages that add slots later (e.g. the Kartalar place panel) call window.jarnamaFill().
  var loaded = null;
  window.jarnamaFill = function () { if (loaded) fill(loaded); };
  fetch(base + "campaigns.json", { cache: "no-cache" }).then(function (r) { return r.json(); })
    .then(function (d) { loaded = d.ads || []; fill(loaded); }).catch(function () {});
})();
