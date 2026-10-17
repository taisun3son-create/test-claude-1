/* 栗の木舎 ― 機能ごとに run() で囲み、1つが失敗してもほかは動くようにしている */
(function () {
  "use strict";
  function run(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn(name, e); } }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ページを移ったら、いつも一番上から見せる（#つきのリンクだけはその場所へ）。
     ブラウザや埋めこみ表示が前のページのスクロール位置を引き継ぐことがあるため */
  run("scrolltop", function () {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    var toTop = function () {
      if (location.hash && location.hash.length > 1 && document.getElementById(location.hash.slice(1))) return;
      window.scrollTo(0, 0);
      // 枠の中で表示されているとき、外側の枠も先頭へ戻す
      if (window.self !== window.top && document.body.scrollIntoView) document.body.scrollIntoView({ block: "start" });
    };
    toTop();
    window.addEventListener("pageshow", function (e) { if (!e.persisted) toTop(); });
  });

  /* ドロワー（Escape・背景で閉じる、フォーカスを中に閉じこめる） */
  run("drawer", function () {
    var btn = $(".menu-btn"), drawer = $("#drawer");
    if (!btn || !drawer) return;
    var panel = $(".drawer-panel", drawer), last;
    function focusables() { return $$("a[href], button", panel); }
    function open() {
      last = document.activeElement;
      drawer.hidden = false; btn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      focusables()[0].focus();
    }
    function close() {
      drawer.hidden = true; btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      if (last) last.focus();
    }
    btn.addEventListener("click", open);
    $(".drawer-close", drawer).addEventListener("click", close);
    drawer.addEventListener("click", function (e) { if (e.target === drawer) close(); });
    $$("a", panel).forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (drawer.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        var f = focusables(), first = f[0], end = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
        else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
      }
    });
  });

  /* 今日は営業中かどうか（日本時間で判定。定休は火・水、10:00〜17:00） */
  run("today", function () {
    var el = $("[data-today]");
    if (!el) return;
    var now = new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60000);
    var day = now.getDay(), min = now.getHours() * 60 + now.getMinutes();
    var closedDay = day === 2 || day === 3;
    var label = $(".today-label", el), text = $(".today-text", el);
    var state, l, t;
    if (closedDay) { state = "closed"; l = "本日は定休日"; t = "木曜 10:00 から営業します（定休 火曜・水曜）"; }
    else if (min < 600) { state = "closed"; l = "本日は 10:00 から"; t = "10:00〜17:00（L.O. 16:30）"; }
    else if (min < 1020) { state = "open"; l = "ただいま営業中"; t = "本日 17:00 まで（L.O. 16:30）"; }
    else {
      state = "closed"; l = "本日の営業は終了";
      t = (day === 1 ? "次は木曜" : "明日") + " 10:00 から営業します";
    }
    el.setAttribute("data-state", state); label.textContent = l; text.textContent = t;
  });

  /* スクロールでふわっと出す */
  run("reveal", function () {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach(function (i) { i.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (i) { io.observe(i); });
  });

  /* 写真の横すべり（前・次ボタン） */
  run("gallery", function () {
    var track = $(".gallery-track");
    if (!track) return;
    $$("[data-gl]").forEach(function (b) {
      b.addEventListener("click", function () {
        var li = $("li", track), step = li ? li.getBoundingClientRect().width + 14 : 300;
        track.scrollBy({ left: step * Number(b.getAttribute("data-gl")), behavior: "smooth" });
      });
    });
  });

  /* 地図：押したときだけ Google マップを読み込む（表示が速く、Googleに情報が行くのも押した人だけ） */
  run("map", function () {
    var fig = $(".guide-map"), btn = $("[data-map-load]");
    if (!fig || !btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = fig.getAttribute("data-map-src"); f.title = "小布施駅のまわりの地図";
      f.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      $("svg", fig).replaceWith(f); btn.remove(); f.focus();
    });
  });

  /* ページ先頭へ */
  run("totop", function () {
    var b = $(".to-top");
    if (!b) return;
    var on = function () { b.classList.toggle("is-show", window.scrollY > 600); };
    window.addEventListener("scroll", on, { passive: true }); on();
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
      var t = $(".logo"); if (t) t.focus({ preventScroll: true });
    });
  });

  /* メニューのタブ（JSが動かないときは全部が縦に並ぶ） */
  run("tabs", function () {
    var tabs = $$(".tab");
    if (!tabs.length) return;
    function show(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
      if (history.replaceState) history.replaceState(null, "", "#" + tab.getAttribute("aria-controls"));
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(t); });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (n) { e.preventDefault(); show(tabs[(i + n + tabs.length) % tabs.length], true); }
      });
    });
    var hash = location.hash.slice(1);
    show(tabs.filter(function (t) { return t.getAttribute("aria-controls") === hash; })[0] || tabs[0]);
  });

  /* お知らせの絞り込みと、#で来たときに開く */
  run("news", function () {
    var items = $$(".news-full .news-item");
    if (!items.length) return;
    var btns = $$(".filter .chip"), empty = $(".news-empty");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var cat = b.getAttribute("data-filter"), n = 0;
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        items.forEach(function (it) {
          var on = cat === "all" || it.getAttribute("data-cat") === cat;
          it.hidden = !on; if (on) n++;
        });
        if (empty) empty.hidden = n > 0;
      });
    });
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains("news-item")) {
      items.forEach(function (it) { $("details", it).open = it === target; });
    }
  });

  /* ご予約フォーム */
  run("form", function () {
    var form = $("#rsv-form");
    if (!form) return;
    var summary = $(".form-summary", form);

    // ご用件で、出す項目を切りかえる
    function sync() {
      var kind = (form.querySelector('input[name="kind"]:checked') || {}).value || "seat";
      $$(".only-seat", form).forEach(function (el) { el.hidden = kind !== "seat"; });
      $$(".only-goods", form).forEach(function (el) { el.hidden = !(kind === "goods" || kind === "gift"); });
    }
    $$('input[name="kind"]', form).forEach(function (r) { r.addEventListener("change", sync); });
    var q = new URLSearchParams(location.search).get("kind");
    if (q) { var pre = form.querySelector('input[name="kind"][value="' + q + '"]'); if (pre) pre.checked = true; }
    sync();

    // 日付は「あした以降」、定休日（火・水）はえらべないことを伝える
    var date = form.querySelector('input[name="date"]');
    if (date) {
      var d = new Date(); d.setDate(d.getDate() + 1);
      date.min = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }

    function check(field) {
      var box = field.closest(".field"), ok = true, msg = "";
      if (!box || box.closest("[hidden]")) return true;
      var v = (field.value || "").trim();
      if (field.type === "radio") { ok = !!form.querySelector('input[name="' + field.name + '"]:checked'); msg = "えらんでください"; }
      else if (field.type === "checkbox") { ok = field.checked; msg = "同意のうえ、チェックを入れてください"; }
      else if (field.required && !v) { ok = false; msg = "入力してください"; }
      else if (v && field.type === "tel" && !/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(v.replace(/[－ー‐]/g, "-"))) { ok = false; msg = "電話番号の形をご確認ください（例：090-1234-5678）"; }
      else if (v && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { ok = false; msg = "メールアドレスの形をご確認ください"; }
      else if (v && field.name === "date") {
        var wd = new Date(v + "T00:00:00").getDay();
        if (wd === 2 || wd === 3) { ok = false; msg = "火曜・水曜は定休日です。ほかの日をおえらびください"; }
        else if (field.min && v < field.min) { ok = false; msg = "あした以降の日付をおえらびください"; }
      }
      box.classList.toggle("is-invalid", !ok);
      var err = $(".err", box); if (err) err.textContent = msg;
      field.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }
    $$("input, select, textarea", form).forEach(function (f) {
      f.addEventListener("change", function () { if (form.classList.contains("is-validated")) check(f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("is-validated");
      if (form.querySelector(".hp input").value) return; // ロボット対策（人には見えない欄）
      var fields = $$("input:not([type=radio]), select, textarea", form).filter(function (f) { return f.closest(".field"); });
      $$('input[type=radio]', form).forEach(function (r) { if (fields.indexOf(form.querySelector('input[name="' + r.name + '"]')) < 0) fields.push(form.querySelector('input[name="' + r.name + '"]')); });
      var bad = fields.filter(function (f) { return !check(f); });
      if (bad.length) {
        summary.textContent = "入力内容をご確認ください（" + bad.length + "か所）。";
        summary.classList.add("is-show"); summary.focus();
        return;
      }
      summary.classList.remove("is-show");
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = "送信しています…";
      var endpoint = form.getAttribute("data-endpoint");
      var done = function () {
        form.hidden = true;
        var ok = $(".form-done"); ok.hidden = false; ok.focus();
      };
      if (!endpoint) { setTimeout(done, 400); return; }
      fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () {
          btn.disabled = false; btn.textContent = "この内容で送る";
          summary.textContent = "送信できませんでした。時間をおいてもう一度お試しいただくか、お電話ください。";
          summary.classList.add("is-show"); summary.focus();
        });
    });
  });
})();
