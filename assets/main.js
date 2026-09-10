(function(){
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try{
    reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }catch(e){}

  /* 機能ごとに切り分ける。1か所で例外が出ても、残りの機能は動き続ける。
     以前はここが1本のつながった処理だったため、途中で失敗すると
     メニューも表示演出も丸ごと止まっていた。 */
  function run(name, fn){
    try{ fn(); }
    catch(err){
      if(window.console && window.console.error){ window.console.error('[' + name + ']', err); }
    }
  }

  /* ---------- ヘッダー高さをアンカー位置に反映 ---------- */
  var head = document.querySelector('.head');
  function measureHeader(){
    if(!head) return;
    root.style.setProperty('--head-h', head.offsetHeight + 'px');
  }

  run('header', function(){
    measureHeader();
    window.addEventListener('resize', measureHeader);
    window.addEventListener('load', measureHeader);
  });

  /* ---------- 文字サイズ（設定を保存） ---------- */
  run('fontsize', function(){
    var SIZES = {m:'', l:'fs-l'};

    function applySize(size, persist){
      if(!SIZES.hasOwnProperty(size)) size = 'm';
      root.classList.remove('fs-l');
      if(SIZES[size]) root.classList.add(SIZES[size]);
      var btns = document.querySelectorAll('.js-fs');
      for(var i = 0; i < btns.length; i++){
        btns[i].setAttribute('aria-pressed', String(btns[i].getAttribute('data-size') === size));
      }
      if(persist){
        try{ localStorage.setItem('hidamari-fontsize', size); }catch(e){}
      }
      measureHeader();
    }

    var btns = document.querySelectorAll('.js-fs');
    for(var i = 0; i < btns.length; i++){
      (function(btn){
        btn.addEventListener('click', function(){ applySize(btn.getAttribute('data-size'), true); });
      })(btns[i]);
    }

    var saved = null;
    try{ saved = localStorage.getItem('hidamari-fontsize'); }catch(e){}
    if(saved) applySize(saved, false);
  });

  /* ---------- モバイルメニュー ---------- */
  run('drawer', function(){
    var burger = document.getElementById('burger');
    var drawer = document.getElementById('drawer');
    if(!burger || !drawer) return;

    var drawerClose = document.getElementById('drawerClose');
    var scrim = drawer.querySelector('.drawer__scrim');
    var lastFocus = null;

    function onDrawerKey(e){
      var k = e.key || e.keyCode;
      if(k === 'Escape' || k === 'Esc' || k === 27){ closeDrawer(); return; }
      if(k !== 'Tab' && k !== 9) return;
      var f = drawer.querySelectorAll('a[href], button:not([tabindex="-1"])');
      if(!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }

    function openDrawer(){
      lastFocus = document.activeElement;
      drawer.setAttribute('data-open', 'true');
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      if(drawerClose && drawerClose.focus) drawerClose.focus();
      document.addEventListener('keydown', onDrawerKey);
    }
    function closeDrawer(){
      drawer.setAttribute('data-open', 'false');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onDrawerKey);
      if(lastFocus && lastFocus.focus) lastFocus.focus();
    }

    burger.addEventListener('click', function(e){
      e.preventDefault();
      if(drawer.getAttribute('data-open') === 'true'){ closeDrawer(); } else { openDrawer(); }
    });
    if(drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if(scrim) scrim.addEventListener('click', closeDrawer);

    var links = drawer.querySelectorAll('.drawer__nav a');
    for(var i = 0; i < links.length; i++){
      links[i].addEventListener('click', closeDrawer);
    }

    // 「サービス・料金」の右のボタンで、小項目（料金試算）を出し入れする
    var toggles = drawer.querySelectorAll('.drawer__toggle');
    for(var t = 0; t < toggles.length; t++){
      (function(btn){
        var sub = document.getElementById(btn.getAttribute('aria-controls'));
        if(!sub) return;
        btn.addEventListener('click', function(){
          var open = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!open));
          sub.hidden = open;
        });
      })(toggles[t]);
    }
  });

  /* ---------- ページ先頭へ ---------- */
  run('totop', function(){
    var totop = document.getElementById('totop');
    if(!totop) return;
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(ticking) return;
      ticking = true;
      var raf = window.requestAnimationFrame || function(f){ return setTimeout(f, 16); };
      raf(function(){
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;
        totop.classList.toggle('is-on', y > 700);
        ticking = false;
      });
    }, false);
    totop.addEventListener('click', function(){
      try{ window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'}); }
      catch(e){ window.scrollTo(0, 0); }
      // フォーカス移動でスクロールが起きるとスムーススクロールが中断され、
      // 途中で止まってしまう。preventScroll を付けて、対応していなければ移動しない。
      var logo = document.querySelector('.logo');
      if(logo && logo.focus){
        var moved = false;
        try{
          logo.focus({ get preventScroll(){ moved = true; return true; } });
        }catch(e){}
        if(!moved){ /* preventScroll 非対応。位置がずれるのでフォーカスは移動しない */ }
      }
    });
  });

  /* ---------- 料金のかんたん試算 ---------- */
  run('calc', function(){
    var RATES = {week:2750, biweek:3080, spot:3630};
    var VISITS = {week:4, biweek:2, spot:1};
    var LABELS = {week:'1か月あたりの目安（月4回）', biweek:'1か月あたりの目安（月2回）', spot:'1か月あたりの目安（月1回）'};
    var TRAVEL = 900;

    var cPlan = document.getElementById('c-plan');
    var cHours = document.getElementById('c-hours');
    var cOnce = document.getElementById('c-once');
    var cMonth = document.getElementById('c-month');
    var cMonthLabel = document.getElementById('c-monthlabel');
    if(!cPlan || !cHours || !cOnce || !cMonth || !cMonthLabel) return;

    function yen(n){
      try{ return n.toLocaleString('ja-JP'); }
      catch(e){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    }

    function calc(){
      var plan = cPlan.value;
      var once = RATES[plan] * Number(cHours.value) + TRAVEL;
      cOnce.textContent = yen(once);
      cMonth.textContent = yen(once * VISITS[plan]);
      cMonthLabel.textContent = LABELS[plan];
    }

    cPlan.addEventListener('change', calc);
    cHours.addEventListener('change', calc);
    calc();
  });

  /* ---------- 予約フォーム（デモ動作） ---------- */
  run('form', function(){
    var form = document.getElementById('resform');
    var wrapEl = document.getElementById('form');
    var summary = document.getElementById('formerr');
    var summaryList = document.getElementById('formerr-list');
    if(!form || !wrapEl || !summary || !summaryList) return;

    var RULES = [
      {id:'f-name',  label:'お名前', test:function(v){ return v.replace(/^\s+|\s+$/g, '').length > 0; }},
      {id:'f-tel',   label:'お電話番号', test:function(v){
        var digits = v.replace(/[^0-9]/g, '');
        return digits.length >= 10 && digits.length <= 11;
      }, message:'数字10〜11桁でご記入ください。'},
      {id:'f-area',  label:'お住まいの地域', test:function(v){ return v !== ''; }},
      {id:'f-agree', label:'プライバシーポリシーへの同意', test:null}
    ];

    function isOk(rule, el){
      return rule.id === 'f-agree' ? el.checked : rule.test(el.value);
    }
    function fieldError(rule, show, message){
      var el = document.getElementById(rule.id);
      var msg = document.getElementById(rule.id + '-err');
      if(el) el.setAttribute('aria-invalid', String(show));
      if(msg){
        msg.classList.toggle('is-on', show);
        if(show && message) msg.textContent = message;
      }
    }
    function validate(){
      var bad = [];
      for(var i = 0; i < RULES.length; i++){
        var rule = RULES[i];
        var el = document.getElementById(rule.id);
        if(!el) continue;
        var ok = isOk(rule, el);
        var message = (!ok && rule.message && el.value.replace(/^\s+|\s+$/g, '')) ? rule.message : null;
        fieldError(rule, !ok, message);
        if(!ok) bad.push({rule:rule, message:message});
      }
      return bad;
    }

    for(var i = 0; i < RULES.length; i++){
      (function(rule){
        var el = document.getElementById(rule.id);
        if(!el) return;
        var ev = (el.tagName === 'SELECT' || el.type === 'checkbox') ? 'change' : 'blur';
        el.addEventListener(ev, function(){
          if(ev === 'blur' && el.getAttribute('aria-invalid') !== 'true') return;
          var ok = isOk(rule, el);
          fieldError(rule, !ok, (!ok && rule.message && el.value.replace(/^\s+|\s+$/g, '')) ? rule.message : null);
        });
      })(RULES[i]);
    }

    function scrollTo(el){
      try{ el.scrollIntoView({block:'center', behavior: reduce ? 'auto' : 'smooth'}); }
      catch(e){ el.scrollIntoView(); }
    }

    var sending = false;
    var submitBtn = form.querySelector('button[type="submit"]');
    var sendErr = document.getElementById('formsenderr');
    var endpoint = form.getAttribute('data-endpoint');

    function setSending(on){
      if(!submitBtn) return;
      submitBtn.disabled = on;
      submitBtn.textContent = on ? '送信しています…' : 'この内容で予約を申し込む';
    }

    function showDone(){
      summary.hidden = true;
      if(sendErr) sendErr.hidden = true;
      wrapEl.classList.add('is-done');
      scrollTo(wrapEl);
      var done = document.getElementById('done');
      if(done){
        done.setAttribute('tabindex', '-1');
        if(done.focus) done.focus();
      }
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(sending) return;                      // 二重送信を防ぐ

      // 以後はエラー行の場所を確保する（直したときに下の要素が動かないように）
      form.classList.add('is-validated');

      var bad = validate();
      if(bad.length){
        summaryList.innerHTML = '';
        for(var i = 0; i < bad.length; i++){
          (function(item){
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.href = '#' + item.rule.id;
            a.textContent = item.message || (item.rule.label + 'をご確認ください');
            a.addEventListener('click', function(ev){
              ev.preventDefault();
              var t = document.getElementById(item.rule.id);
              if(t) t.focus();
            });
            li.appendChild(a);
            summaryList.appendChild(li);
          })(bad[i]);
        }
        summary.hidden = false;
        summary.setAttribute('tabindex', '-1');
        scrollTo(summary);
        if(summary.focus) summary.focus();
        return;
      }

      // 自動投稿よけ。人には見えない欄に入力があれば、送らずに成功したように見せる
      var pot = document.getElementById('f-company');
      if(pot && pot.value){ showDone(); return; }

      // 送信先が未設定なら画面上の動作のみ（納品時に data-endpoint を設定する）
      if(!endpoint){ showDone(); return; }

      if(!window.fetch){ form.removeAttribute('novalidate'); form.submit(); return; }

      sending = true;
      setSending(true);
      if(sendErr) sendErr.hidden = true;

      window.fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function(res){
        if(!res.ok) throw new Error('status ' + res.status);
        window.location.href = 'thanks.html';
      }).catch(function(){
        // 通信できなかったときに黙って失敗させない
        sending = false;
        setSending(false);
        if(sendErr){
          sendErr.hidden = false;
          sendErr.setAttribute('tabindex', '-1');
          scrollTo(sendErr);
          if(sendErr.focus) sendErr.focus();
        }
      });
    });
  });
})();
