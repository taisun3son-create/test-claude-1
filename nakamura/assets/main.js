/* なかむら整体院：メニューの開け閉め・ページの先頭から開く・予約フォーム */
(function () {
  "use strict";

  // ページを移ったら、必ず一番上から開く（# つきのリンクだけはその場所へ）
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.addEventListener("pageshow", function () {
    if (!location.hash) window.scrollTo(0, 0);
  });

  // ヘッダー：少し下へ進んだら下に線を出す
  var hd = document.querySelector(".site-hd");
  if (hd) {
    var onScroll = function () { hd.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // スマホのメニュー
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("gnav");
  if (btn && nav) {
    var label = btn.querySelector("span");
    var setOpen = function (open) {
      btn.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (label) label.textContent = open ? "閉じる" : "メニュー";
    };
    btn.addEventListener("click", function () {
      setOpen(btn.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        btn.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", function () { setOpen(false); });
  }

  // ---------- 予約フォーム ----------
  var form = document.getElementById("rsv");
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var confirmBox = $("rsv-confirm");
  var doneBox = $("rsv-done");

  // 祝日（見本として2026年秋〜2027年春の分）。本番では毎年足す
  var HOLIDAYS = ["2026-11-03", "2026-11-23", "2027-01-01", "2027-01-11", "2027-02-11", "2027-02-23", "2027-03-21", "2027-03-22"];
  var MORI_DAYS = [1, 2, 4, 6]; // 月・火・木・土

  var pad = function (n) { return String(n).padStart(2, "0"); };
  var ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var parse = function (v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); };
  var WEEK = ["日", "月", "火", "水", "木", "金", "土"];

  // 選べる日は、あしたから2か月先まで
  var today = new Date();
  var min = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  var max = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());
  ["f-d1", "f-d2"].forEach(function (id) { $(id).min = ymd(min); $(id).max = ymd(max); });

  // 曜日で時間の枠を変える（平日は19時、土曜は16時が最後の受付）
  function slotsFor(date) {
    var last = date.getDay() === 6 ? 16 : 19;
    var list = [];
    for (var h = 9; h <= last; h++) list.push(h + ":00");
    return list;
  }

  function dayProblem(v) {
    if (!v) return "";
    var d = parse(v);
    if (isNaN(d)) return "日付の形が正しくありません。";
    if (d < min) return "あした以降の日を選んでください。今日・急ぎの方はお電話ください。";
    if (d > max) return "2か月先までの日を選んでください。";
    if (d.getDay() === 0 || HOLIDAYS.indexOf(v) !== -1) return "日曜・祝日はお休みです。ほかの日を選んでください。";
    var staff = form.querySelector('input[name="staff"]:checked').value;
    if (staff === "森" && MORI_DAYS.indexOf(d.getDay()) === -1) return "森の出勤日は月・火・木・土です。ほかの日か、担当を「どちらでも」にしてください。";
    return "";
  }

  function fillTimes(n) {
    var dateEl = $("f-d" + n), timeEl = $("f-t" + n);
    var keep = timeEl.value;
    timeEl.length = 1;
    if (!dateEl.value || dayProblem(dateEl.value)) return;
    slotsFor(parse(dateEl.value)).forEach(function (t) {
      var o = document.createElement("option");
      o.value = o.textContent = t;
      timeEl.appendChild(o);
    });
    if (keep && Array.prototype.some.call(timeEl.options, function (o) { return o.value === keep; })) timeEl.value = keep;
  }

  function showErr(errId, msg, fields) {
    var box = $(errId);
    if (msg) box.querySelector("span").textContent = msg;
    box.classList.toggle("is-shown", !!msg);
    fields.forEach(function (f) { if (msg) f.setAttribute("aria-invalid", "true"); else f.removeAttribute("aria-invalid"); });
    return !msg;
  }

  var checks = {
    name: function () { return showErr("e-name", $("f-name").value.trim() ? "" : "お名前を入れてください。", [$("f-name")]); },
    kana: function () {
      var v = $("f-kana").value.trim();
      var msg = !v ? "ふりがなを入れてください。" : (/^[ぁ-ゖー\s　]+$/.test(v) ? "" : "ふりがなは、ひらがなで入れてください。");
      return showErr("e-kana", msg, [$("f-kana")]);
    },
    tel: function () {
      var v = $("f-tel").value.replace(/[‐－ー−\-\s]/g, "").replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 65248); });
      var msg = !v ? "電話番号を入れてください。" : (/^0\d{9,10}$/.test(v) ? "" : "電話番号は、0から始まる10けたか11けたの数字で入れてください。");
      return showErr("e-tel", msg, [$("f-tel")]);
    },
    mail: function () {
      var v = $("f-mail").value.trim();
      return showErr("e-mail", !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "メールアドレスの形が正しくありません。「@」が入っているか確かめてください。", [$("f-mail")]);
    },
    wish1: function () {
      var d = $("f-d1"), t = $("f-t1");
      var msg = !d.value ? "第1希望の日を選んでください。" : dayProblem(d.value) || (!t.value ? "第1希望の時間を選んでください。" : "");
      return showErr("e-d1", msg, [d, t]);
    },
    wish2: function () {
      var d = $("f-d2"), t = $("f-t2");
      var msg = !d.value ? (t.value ? "第2希望の日を選んでください。" : "") : dayProblem(d.value) || (!t.value ? "第2希望の時間を選んでください。" : "");
      if (!msg && d.value && t.value && d.value === $("f-d1").value && t.value === $("f-t1").value) msg = "第1希望と同じ日時です。ちがう日時を選んでください。";
      return showErr("e-d2", msg, [d, t]);
    },
    agree: function () { return showErr("e-agree", $("f-agree").checked ? "" : "プライバシーポリシーをお読みのうえ、チェックを入れてください。", [$("f-agree")]); }
  };

  // 入力が終わったとき（欄から離れたとき）だけ確かめる。打っている途中には出さない
  [["f-name", "name"], ["f-kana", "kana"], ["f-tel", "tel"], ["f-mail", "mail"]].forEach(function (p) {
    $(p[0]).addEventListener("blur", function () { if (this.value) checks[p[1]](); });
    $(p[0]).addEventListener("input", function () { if (this.getAttribute("aria-invalid")) checks[p[1]](); });
  });
  [1, 2].forEach(function (n) {
    $("f-d" + n).addEventListener("change", function () { fillTimes(n); checks["wish" + n](); });
    $("f-t" + n).addEventListener("change", function () { checks["wish" + n](); });
  });
  form.querySelectorAll('input[name="staff"]').forEach(function (r) {
    r.addEventListener("change", function () {
      [1, 2].forEach(function (n) { fillTimes(n); if ($("f-d" + n).value) checks["wish" + n](); });
    });
  });
  $("f-agree").addEventListener("change", checks.agree);

  function dayLabel(d) { var x = parse(d); return (x.getMonth() + 1) + "月" + x.getDate() + "日（" + WEEK[x.getDay()] + "）"; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true, first = null;
    Object.keys(checks).forEach(function (k) {
      if (!checks[k]() && ok) { ok = false; }
    });
    if (!ok) {
      first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var get = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ""; };
    var rows = [
      ["お名前", get("name") + "（" + get("kana") + "）"],
      ["電話番号", get("tel")],
      ["メール", get("email") || "なし"],
      ["来られるのは", form.querySelector('input[name="visit"]:checked').value],
      ["メニュー", get("menu")],
      ["担当", form.querySelector('input[name="staff"]:checked').value],
      ["第1希望", dayLabel(get("date1")) + " " + get("time1")],
      ["第2希望", get("date2") ? dayLabel(get("date2")) + " " + get("time2") : "なし"],
      ["つらい所など", get("message") || "なし"]
    ];
    var dl = $("confirm-list");
    dl.textContent = "";
    rows.forEach(function (r) {
      var div = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = r[0]; dd.textContent = r[1];
      div.appendChild(dt); div.appendChild(dd); dl.appendChild(div);
    });
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.focus();
  });

  $("rsv-back").addEventListener("click", function () {
    confirmBox.hidden = true;
    form.hidden = false;
    $("f-name").focus();
  });

  $("rsv-send").addEventListener("click", function () {
    // ロボットよけ：見えない欄に何か入っていたら送らない
    if ($("f-web").value) return;
    // 見本なので送らない。納品のときは、ここで Formspree などの送り先へ fetch で送る
    confirmBox.hidden = true;
    doneBox.hidden = false;
    doneBox.focus();
  });
})();
