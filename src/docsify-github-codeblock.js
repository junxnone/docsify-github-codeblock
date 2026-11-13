/*!
 * docsify-github-codeblock
 *
 * Adds a small "▸ 代码" toggle button after every GitHub permalink
 *   https://github.com/<owner>/<repo>/blob/<40-char sha>/<path>[#L10[-L20]]
 * in the page body. The code is fetched from raw.githubusercontent.com on the
 * first click and shown below the link as a highlighted block; clicking again
 * collapses it ("▾ 收起"). Collapsed by default.
 *
 * Options (all optional): window.$docsify.githubCodeblock = { ... }, see README.
 */
(function () {
  'use strict';

  var DEFAULT_SKIP_EXT = /\.(png|jpe?g|gif|svg|ico|webp|bmp|pdf|zip|gz|tgz|7z|rar|tar|bin|exe|dll|so|onnx|pt|pth|ipynb)$/i;

  var DEFAULTS = {
    labelCollapsed: '▸ 代码',
    labelExpanded: '▾ 收起',
    titleCollapsed: '展开代码',
    titleExpanded: '收起代码',
    copyText: '复制',
    copiedText: '已复制',
    copyFailedText: '复制失败',
    errorText: '无法加载代码',
    rangeErrorText: '行范围超出文件',
    retryText: '收起后再展开即可重试',
    maxHeight: 480,                                   // px, 0 = no limit
    rawBase: 'https://raw.githubusercontent.com',     // e.g. a mirror / proxy
    prismCdn: 'https://cdn.jsdelivr.net/npm/prismjs@1/components/', // '' = never load Prism languages
    languages: {},                                    // extra/override: { ext: 'prism-language' }
    skipExt: DEFAULT_SKIP_EXT                         // RegExp, or a string used as a case-insensitive RegExp
  };

  var PERMALINK = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([0-9a-f]{40})\/([^#?]+)(?:\?[^#]*)?(?:#(.*))?$/;

  // file extension -> Prism language id
  var LANGS = {
    py: 'python', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hh: 'cpp', cu: 'cpp',
    sh: 'bash', bash: 'bash', js: 'javascript', mjs: 'javascript', ts: 'typescript', json: 'json',
    yaml: 'yaml', yml: 'yaml', cmake: 'cmake', md: 'markdown', html: 'markup', htm: 'markup',
    xml: 'markup', css: 'css', java: 'java', go: 'go', rs: 'rust'
  };

  // Prism language components that must be loaded first (beyond the ones docsify bundles)
  var PRISM_DEPS = { cpp: ['c'] };

  // currentColor keeps the button readable on light and dark themes
  var CSS = [
    '.gh-code-btn{margin-left:4px;padding:0 6px;font:12px/18px sans-serif;color:inherit;background:transparent;',
    'border:1px solid currentColor;border-radius:3px;vertical-align:middle;cursor:pointer;opacity:.75}',
    '.gh-code-btn:hover{opacity:1}',
    '.gh-code-btn.open{opacity:1;color:var(--theme-color,#007BE8);border-color:var(--theme-color,#007BE8)}',
    '.gh-code{margin:8px 0;max-width:100%;border:1px solid var(--border-color,#ddd);border-radius:4px;overflow:hidden}',
    '.gh-code[hidden]{display:none}',
    'td .gh-code,th .gh-code{max-width:60vw}',
    '.gh-code-head{display:flex;justify-content:space-between;align-items:center;padding:2px 8px;font-size:12px;',
    'opacity:.8;background:rgba(127,127,127,.08);border-bottom:1px solid var(--border-color,#ddd)}',
    '.gh-code-copy{font-size:12px;background:transparent;border:0;color:var(--theme-color,#007BE8);cursor:pointer}',
    '.markdown-section .gh-code pre{margin:0;overflow:auto}',
    '.gh-code-error pre{color:#c00;white-space:pre-wrap}'
  ].join('');

  var textCache = {};   // raw url -> Promise<string> (failed requests are dropped so they can be retried)
  var langCache = {};   // prism language -> Promise<boolean>

  function options() {
    var user = (window.$docsify && window.$docsify.githubCodeblock) || {};
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) { o[k] = k in user ? user[k] : DEFAULTS[k]; });
    if (typeof o.skipExt === 'string') {
      try { o.skipExt = new RegExp(o.skipExt, 'i'); } catch (e) { o.skipExt = DEFAULT_SKIP_EXT; }
    } else if (!(o.skipExt instanceof RegExp)) {
      o.skipExt = DEFAULT_SKIP_EXT;
    }
    if (!o.languages || typeof o.languages !== 'object') o.languages = {};
    return o;
  }

  function injectCss() {
    if (document.getElementById('docsify-github-codeblock-css')) return;
    var s = document.createElement('style');
    s.id = 'docsify-github-codeblock-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function safeDecode(s) {
    try { return decodeURIComponent(s); } catch (e) { return s; }
  }

  function langOf(path, o) {
    var name = path.split('/').pop();
    if (name === 'CMakeLists.txt') return 'cmake';
    var m = name.match(/\.([^.]+)$/);
    var ext = m && m[1].toLowerCase();
    return (ext && (o.languages[ext] || LANGS[ext])) || 'none';
  }

  // "#L10", "#L10-L20", "#L10C5-L20C3" -> [10, 20]; anything else -> null
  function rangeOf(hash) {
    var m = (hash || '').match(/^L(\d+)(?:C\d+)?(?:-L(\d+)(?:C\d+)?)?$/);
    if (!m) return null;
    var a = +m[1], b = +(m[2] || m[1]);
    return a <= b ? [a, b] : [b, a];
  }

  function fetchText(url) {
    if (!textCache[url]) {
      textCache[url] = fetch(url).then(function (r) {
        if (!r.ok) throw new Error(String(r.status + ' ' + r.statusText).trim());
        return r.text();
      });
      textCache[url].catch(function () { delete textCache[url]; });
    }
    return textCache[url];
  }

  // make sure Prism knows the language; resolves either way (plain text on failure)
  function ensureLang(lang, o) {
    if (lang === 'none' || !window.Prism) return Promise.resolve(false);
    if (Prism.languages[lang]) return Promise.resolve(true);
    if (!o.prismCdn) return Promise.resolve(false);
    if (!langCache[lang]) {
      var chain = (PRISM_DEPS[lang] || []).concat(lang).reduce(function (p, l) {
        return p.then(function () {
          if (Prism.languages[l]) return;
          return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = o.prismCdn + 'prism-' + l + '.min.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        });
      }, Promise.resolve());
      langCache[lang] = chain.then(function () { return !!Prism.languages[lang]; }, function () { return false; });
    }
    return langCache[lang];
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    // http:// or file:// pages: fall back to a hidden textarea
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  // fills `box` (created once per link); returns a Promise<boolean> = loaded ok
  function load(box, a, m, o) {
    var path = safeDecode(m[4]);
    var range = rangeOf(m[5]);
    var raw = o.rawBase.replace(/\/$/, '') + '/' + m[1] + '/' + m[2] + '/' + m[3] + '/' + m[4];
    box.className = 'gh-code';
    box.textContent = '';

    var head = document.createElement('div');
    head.className = 'gh-code-head';
    head.textContent = m[1] + '/' + m[2] + ' : ' + path +
      (range ? '  L' + range[0] + (range[1] !== range[0] ? '-L' + range[1] : '') : '');
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'gh-code-copy';
    copy.textContent = o.copyText;
    head.appendChild(copy);
    box.appendChild(head);

    var pre = document.createElement('pre');
    if (o.maxHeight) pre.style.maxHeight = o.maxHeight + 'px';
    var code = document.createElement('code');
    code.textContent = 'loading...';
    pre.appendChild(code);
    box.appendChild(pre);

    function fail(msg) {
      box.classList.add('gh-code-error');
      code.className = '';
      code.textContent = msg + '：' + a.href;
      copy.remove();
    }

    var lang = langOf(path, o);
    return Promise.all([fetchText(raw), ensureLang(lang, o)]).then(function (res) {
      var all = res[0].replace(/\r\n/g, '\n').split('\n');
      if (all.length > 1 && all[all.length - 1] === '') all.pop();   // trailing newline
      var lines = all;
      if (range) {
        if (range[0] > all.length) {
          fail(o.rangeErrorText + '（L' + range[0] + '-L' + range[1] + '，文件共 ' + all.length + ' 行）');
          return true;   // the file itself loaded fine, retrying won't help
        }
        lines = all.slice(range[0] - 1, range[1]);
      }
      var text = lines.join('\n');
      pre.setAttribute('data-lang', lang);
      code.className = 'language-' + lang;
      code.textContent = text;
      if (res[1]) Prism.highlightElement(code);
      copy.onclick = function () {
        copyText(text).then(function () {
          copy.textContent = o.copiedText;
        }, function () {
          copy.textContent = o.copyFailedText;
        }).then(function () {
          setTimeout(function () { copy.textContent = o.copyText; }, 1500);
        });
      };
      return true;
    }).catch(function (e) {
      fail(o.errorText + '（' + e.message + '，' + o.retryText + '）');
      return false;
    });
  }

  // put the block under the list item / table cell / quote, or after the paragraph
  function place(a, box) {
    var host = a.closest('li, td, th, blockquote');
    if (host) { host.appendChild(box); return; }
    var p = a.closest('p') || a;
    p.parentNode.insertBefore(box, p.nextSibling);
  }

  function attach(a, m, o, n) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gh-code-btn';
    btn.textContent = o.labelCollapsed;
    btn.title = o.titleCollapsed;
    btn.setAttribute('aria-expanded', 'false');
    var box = null;
    var loaded = false;   // true once the code (or a range error) is shown

    function setOpen(open) {
      box.hidden = !open;
      btn.classList.toggle('open', open);
      btn.textContent = open ? o.labelExpanded : o.labelCollapsed;
      btn.title = open ? o.titleExpanded : o.titleCollapsed;
      btn.setAttribute('aria-expanded', String(open));
    }

    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!box) {
        box = document.createElement('div');
        box.id = 'gh-code-' + n;
        btn.setAttribute('aria-controls', box.id);
        place(a, box);
      } else if (!box.hidden) {
        setOpen(false);
        return;
      } else if (loaded) {
        setOpen(true);
        return;
      }
      // first click, or re-expanding after a failed request (= retry)
      setOpen(true);
      load(box, a, m, o).then(function (ok) { loaded = ok; });
    });
    a.insertAdjacentElement('afterend', btn);
  }

  var counter = 0;

  function plugin(hook) {
    hook.mounted(injectCss);
    hook.doneEach(function () {
      var o = options();
      document.querySelectorAll('#main a[href]').forEach(function (a) {
        if (a.hasAttribute('data-gh-code')) return;
        a.setAttribute('data-gh-code', '');
        if (a.closest('h1, h2, h3, h4, h5, h6, pre, code')) return;
        var m = a.href.match(PERMALINK);
        if (!m || o.skipExt.test(m[4])) return;
        attach(a, m, o, ++counter);
      });
    });
  }

  window.$docsify = window.$docsify || {};
  window.$docsify.plugins = (window.$docsify.plugins || []).concat(plugin);
})();
