/* 整体院 ほどく ― 機能ごとに run() で囲み、1つが失敗してもほかは動くようにしている */
(function () {
  "use strict";
  function run(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn(name, e); } }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var WEEK = "日月火水木金土";
  var CLOSED = 3; // 定休 水曜（getDay() の 3）
  function pad(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  // 日本時間の「いま」
  function nowJST() { return new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60000); }
  // 臨時のお休み（news.json から build.py が書き出す）
  var extraClosed = (document.body.getAttribute("data-closed") || "").split(",").filter(Boolean);
  function isClosed(d) { return d.getDay() === CLOSED || extraClosed.indexOf(ymd(d)) >= 0; }
  function isWeekend(d) { return d.getDay() === 0 || d.getDay() === 6; }

  /* ページを移ったら、いつも一番上から見せる（#つきのリンクだけはその場所へ） */
  run("scrolltop", function () {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    var hash = location.hash;
    var toTop = function () {
      if (hash && hash.length > 1 && document.getElementById(hash.slice(1))) return;
      window.scrollTo(0, 0);
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
    var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    function focusables() { return $$("a[href], button", panel); }
    function open() {
      last = document.activeElement;
      drawer.classList.remove("is-closing");
      drawer.hidden = false; btn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      focusables()[0].focus();
    }
    function close() {
      if (drawer.hidden || drawer.classList.contains("is-closing")) return;
      btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      var hide = function () { drawer.classList.remove("is-closing"); drawer.hidden = true; };
      if (calm.matches) hide(); else { drawer.classList.add("is-closing"); setTimeout(hide, 300); }
      if (last) last.focus();
    }
    btn.addEventListener("click", open);
    $(".drawer-close", drawer).addEventListener("click", close);
    drawer.addEventListener("click", function (e) { if (e.target === drawer) close(); });
    $$("a", panel).forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) {
      if (drawer.hidden || drawer.classList.contains("is-closing")) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        var f = focusables(), first = f[0], end = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
        else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
      }
    });
  });

  /* 今日の受付（日本時間。平日 10:00〜20:00、土日 9:00〜17:00、定休 水曜） */
  run("today", function () {
    var el = $("[data-today]");
    if (!el) return;
    var now = nowJST(), min = now.getHours() * 60 + now.getMinutes();
    var open = isWeekend(now) ? 540 : 600, close = isWeekend(now) ? 1020 : 1200;
    var label = $(".today-label", el), text = $(".today-text", el), state, l, t;
    function nextOpen() {
      var d = new Date(now); d.setDate(d.getDate() + 1);
      for (var i = 0; i < 14 && isClosed(d); i++) d.setDate(d.getDate() + 1);
      return (i === 0 ? "明日" : (d.getMonth() + 1) + "月" + d.getDate() + "日（" + WEEK[d.getDay()] + "）") + " " + (isWeekend(d) ? "9:00" : "10:00") + " から受付します";
    }
    if (isClosed(now)) { state = "closed"; l = "本日はお休みです"; t = nextOpen(); }
    else if (min < open) { state = "closed"; l = "本日は " + (isWeekend(now) ? "9:00" : "10:00") + " から"; t = "最終受付 " + (isWeekend(now) ? "16:00" : "19:00") + "／WEB予約は24時間受付"; }
    else if (min < close - 60) { state = "open"; l = "本日は受付中です"; t = "最終受付 " + (isWeekend(now) ? "16:00" : "19:00") + "。当日はお電話がいちばん早いです"; }
    else { state = "closed"; l = "本日の受付は終わりました"; t = nextOpen(); }
    el.setAttribute("data-state", state); label.textContent = l; text.textContent = t;
  });

  /* スクロールでじんわり出す。同じときに画面に入ったものは、0.15秒ずつずらす */
  run("reveal", function () {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach(function (i) { i.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      var n = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty("--d", Math.min(n++, 3) * 0.15 + "s");
        e.target.classList.add("is-in"); io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (i) { io.observe(i); });
  });

  /* 地図：押したときだけ Google マップを読み込む */
  run("map", function () {
    var fig = $(".guide-map"), btn = $("[data-map-load]");
    if (!fig || !btn) return;
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = fig.getAttribute("data-map-src"); f.title = "辻堂駅のまわりの地図";
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

  /* 受付カレンダー（今月と来月）。JSが動かないときは、下の文章の案内だけが出る */
  run("calendar", function () {
    var box = $("[data-calendar]");
    if (!box) return;
    var today = nowJST(); today.setHours(0, 0, 0, 0);
    var html = "";
    for (var m = 0; m < 2; m++) {
      var first = new Date(today.getFullYear(), today.getMonth() + m, 1);
      var days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      var lead = (first.getDay() + 6) % 7; // 月曜はじまり
      var rows = "<tr>" + new Array(lead + 1).join("<td></td>");
      for (var d = 1; d <= days; d++) {
        var day = new Date(first.getFullYear(), first.getMonth(), d), cls, note;
        if (day < today) { cls = "is-past"; note = ""; }
        else if (isClosed(day)) { cls = "is-closed"; note = "休"; }
        else { cls = "is-open"; note = ""; }
        if (+day === +today) cls += " is-today";
        var label = (day.getMonth() + 1) + "月" + d + "日 " + WEEK[day.getDay()] + "曜日 " + (cls.indexOf("is-closed") >= 0 ? "お休み" : cls.indexOf("is-past") >= 0 ? "" : "受付あり");
        rows += '<td class="' + cls + '"><span aria-label="' + label + '">' + d + (note ? "<small>" + note + "</small>" : "") + "</span></td>";
        if ((lead + d) % 7 === 0 && d < days) rows += "</tr><tr>";
      }
      rows += "</tr>";
      html += '<div class="cal"><table><caption>' + first.getFullYear() + "年 " + (first.getMonth() + 1) + "月</caption>" +
        "<thead><tr><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th><th>日</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
    }
    box.innerHTML = html;
    box.hidden = false;
  });

  /* ご予約フォーム */
  run("form", function () {
    var form = $("#rsv-form");
    if (!form) return;
    var summary = $(".form-summary", form);
    var times = { week: ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"], end: ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"] };

    // ?menu=sango などで来たら、そのメニューをえらんでおく
    var q = new URLSearchParams(location.search).get("menu");
    if (q) { var pre = form.querySelector('input[name="menu"][value="' + q + '"]'); if (pre) pre.checked = true; }

    // 日付は「あした以降・2か月先まで」。日付をえらぶと、その曜日の受付時間だけ出す
    var tmr = nowJST(); tmr.setDate(tmr.getDate() + 1);
    var max = nowJST(); max.setMonth(max.getMonth() + 2);
    $$(".wish", form).forEach(function (w) {
      var date = $("input[type=date]", w), time = $("select", w);
      date.min = ymd(tmr); date.max = ymd(max);
      date.addEventListener("change", function () {
        var v = date.value, keep = time.value;
        time.innerHTML = '<option value="">時間</option>';
        if (!v) return;
        var d = new Date(v + "T00:00:00");
        (isWeekend(d) ? times.end : times.week).forEach(function (t) {
          var o = document.createElement("option"); o.value = o.textContent = t; time.appendChild(o);
        });
        if (keep) time.value = keep;
      });
    });

    function wishText(n) {
      var w = $$(".wish", form)[n], dv = $("input[type=date]", w).value, tv = $("select", w).value;
      if (!dv) return "";
      var d = new Date(dv + "T00:00:00");
      return (d.getMonth() + 1) + "月" + d.getDate() + "日（" + WEEK[d.getDay()] + "）" + (tv ? " " + tv + "〜" : "");
    }
    // 送る前に、えらんだ日時とメニューをはっきり見せる
    function syncConfirm() {
      var m = form.querySelector('input[name="menu"]:checked');
      $("[data-c=menu]").textContent = m ? m.getAttribute("data-label") : "まだえらばれていません";
      for (var i = 0; i < 3; i++) $("[data-c=w" + (i + 1) + "]").textContent = wishText(i) || (i === 0 ? "まだえらばれていません" : "なし");
    }
    form.addEventListener("change", syncConfirm); syncConfirm();

    function check(field) {
      var box = field.closest(".field"), ok = true, msg = "";
      if (!box) return true;
      var v = (field.value || "").trim();
      if (field.type === "radio") { ok = !!form.querySelector('input[name="' + field.name + '"]:checked'); msg = "メニューをえらんでください（迷ったら「相談してから決めたい」）"; }
      else if (field.type === "checkbox" && field.required) { ok = field.checked; msg = "プライバシーポリシーをお読みのうえ、チェックを入れてください"; }
      else if (field.required && !v) { ok = false; msg = field.getAttribute("data-msg") || "入力してください"; }
      else if (v && field.type === "tel" && !/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(v.replace(/[－ー‐]/g, "-"))) { ok = false; msg = "電話番号の形をご確認ください（例：090-1234-5678）"; }
      else if (v && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { ok = false; msg = "メールアドレスの形をご確認ください（例：hodoku@example.com）"; }
      else if (field.type === "date" && v) {
        var d = new Date(v + "T00:00:00");
        if (isClosed(d)) { ok = false; msg = (d.getDay() === CLOSED ? "水曜は定休日です" : "この日は臨時のお休みです") + "。ほかの日をおえらびください"; }
        else if (v < field.min || v > field.max) { ok = false; msg = "あしたから2か月先までの日付をおえらびください"; }
        else if (!$("select", field.closest(".wish")).value) { ok = false; msg = "時間もえらんでください"; }
      }
      box.classList.toggle("is-invalid", !ok);
      var err = $(".err", box); if (err) err.textContent = msg;
      field.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }
    $$("input, select, textarea", form).forEach(function (f) {
      f.addEventListener("change", function () { if (form.classList.contains("is-validated")) check(f.tagName === "SELECT" && f.closest(".wish") ? $("input[type=date]", f.closest(".wish")) : f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.classList.add("is-validated");
      if ($(".hp input", form).value) return; // ロボット対策（人には見えない欄）
      var fields = $$("input:not([type=radio]), select:not(.wish select), textarea", form).filter(function (f) { return f.closest(".field") && !f.closest(".hp"); });
      fields.unshift(form.querySelector('input[name="menu"]'));
      var bad = fields.filter(function (f) { return !check(f); });
      if (bad.length) {
        summary.textContent = "入力内容をご確認ください（" + bad.length + "か所）。赤い文字のところを直してください。";
        summary.classList.add("is-show"); summary.focus();
        return;
      }
      summary.classList.remove("is-show");
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; $("span", btn).textContent = "送信しています…";
      var endpoint = form.getAttribute("data-endpoint");
      var done = function () {
        $(".done-wish").textContent = wishText(0);
        form.hidden = true;
        var ok = $(".form-done"); ok.hidden = false; ok.focus();
      };
      if (!endpoint) { setTimeout(done, 400); return; } // 見本なので送り先は空（送ったふりだけ）
      fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () {
          btn.disabled = false; $("span", btn).textContent = "予約の希望を送る";
          summary.textContent = "送信できませんでした。時間をおいてもう一度お試しいただくか、お電話ください。";
          summary.classList.add("is-show"); summary.focus();
        });
    });
  });
})();
