
(function () {
  'use strict';

  /* ---------------- helpers ---------------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function txt(node) {
    return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function attr(el, name) {
    return (el && el.getAttribute(name)) || '';
  }

  function abs(url) {
    if (!url) return '';
    try { return new URL(url, location.href).href; } catch (e) { return url; }
  }

  function list(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function unwrap(el) {
    var parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  }

  /* Strip a rich-text blob down to plain, eww-friendly markup. */
  var KEEP = {
    P: 1, BR: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, PRE: 1, CODE: 1,
    STRONG: 1, B: 1, EM: 1, I: 1, A: 1, H4: 1, H5: 1, H6: 1, HR: 1
  };

  function clean(node) {
    if (!node) return '';
    var box = document.createElement('div');
    box.appendChild(node.cloneNode(true));

    var all = list('*', box);
    for (var i = all.length - 1; i >= 0; i--) {
      var el = all[i], tag = el.tagName;

      if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
        var h = document.createElement('h4');
        while (el.firstChild) h.appendChild(el.firstChild);
        el.parentNode.replaceChild(h, el);
        continue;
      }
      if (!KEEP[tag]) { unwrap(el); continue; }

      var names = Array.prototype.map.call(el.attributes, function (a) { return a.name; });
      names.forEach(function (n) { if (n !== 'href') el.removeAttribute(n); });
      if (tag === 'A') el.setAttribute('href', abs(el.getAttribute('href')));
    }
    return box.innerHTML.trim();
  }

  function when(post) {
    var t = txt(post.querySelector('faceplate-timeago time'));
    if (t) return t;
    var stamp = attr(post, 'created-timestamp');
    if (!stamp) return '';
    var d = new Date(stamp);
    return isNaN(d) ? '' : d.toLocaleDateString();
  }

  /* ---------------- extraction ---------------- */

  function community() {
    var head = document.querySelector('shreddit-subreddit-header');
    var created = '';
    list('.community-details div', document).some(function (d) {
      var s = txt(d);
      if (/^Created/.test(s)) { created = s; return true; }
      return false;
    });
    return {
      name: attr(head, 'prefixed-name') || 'r/' + attr(head, 'name'),
      display: attr(head, 'display-name') || document.title,
      description: attr(head, 'description'),
      active: attr(head, 'weekly-active-users'),
      contributions: attr(head, 'weekly-contributions'),
      created: created
    };
  }

  function navItems() {
    var seen = {}, items = [];
    function add(label, href) {
      label = label.replace(/\s+/g, ' ').trim();
      href = abs(href);
      if (!label || !href || seen[label]) return;
      seen[label] = 1;
      items.push({ label: label, href: href });
    }

    list('a[role="tab"]').forEach(function (a) { add(txt(a), a.getAttribute('href')); });
    list('shreddit-sort-dropdown [slot="dropdown-items"] a').forEach(function (a) {
      add('Sort: ' + txt(a), a.getAttribute('href'));
    });
    add('Log In', '/login/');
    add('Sign Up', '/register/');
    list('.legal-links a').forEach(function (a) { add(txt(a), a.getAttribute('href')); });
    return items;
  }

  function media(post) {
    var type = attr(post, 'post-type');
    var href = abs(attr(post, 'content-href'));
    var img = post.querySelector('img[data-post-media-primary], img.preview-img');
    var out = '';

    if (type === 'image' && img) {
      out += '<p><a href="' + esc(href) + '"><img src="' + esc(abs(img.getAttribute('src'))) +
             '" alt="' + esc(attr(post, 'post-title')) + '"></a></p>';
    } else if (type === 'image') {
      out += '<p>[image] <a href="' + esc(href) + '">' + esc(href) + '</a></p>';
    } else if (type === 'video') {
      out += '<p>[video] <a href="' + esc(href) + '">' + esc(href) + '</a></p>';
    } else if (type === 'link' || type === 'crosspost') {
      out += '<p>[link] <a href="' + esc(href) + '">' + esc(href) + '</a></p>';
    }
    return out;
  }

  function posts() {
    var seen = {}, out = [];
    list('shreddit-post').forEach(function (p) {
      var id = attr(p, 'id');
      if (!id || seen[id]) return;
      seen[id] = 1;

      var body = p.querySelector('[id$="-post-rtjson-content"]');
      out.push({
        id: id,
        title: attr(p, 'post-title') || txt(p.querySelector('[slot="title"]')),
        link: abs(attr(p, 'permalink')),
        author: attr(p, 'author'),
        score: attr(p, 'score'),
        comments: attr(p, 'comment-count'),
        age: when(p),
        domain: attr(p, 'domain'),
        pinned: p.hasAttribute('stickied'),
        media: media(p),
        body: clean(body)
      });
    });
    return out;
  }

  function ads() {
    return list('shreddit-ad-post').map(function (a) {
      return {
        title: attr(a, 'post-title'),
        author: attr(a, 'author'),
        domain: attr(a, 'domain'),
        cta: attr(a, 'call-to-action'),
        link: abs(attr(a, 'outbound-link-url') || attr(a, 'permalink'))
      };
    });
  }

  function highlights(known) {
    return list('community-highlight-card').map(function (c) {
      var a = c.closest('a');
      return {
        title: txt(c.querySelector('[slot="title"]')),
        link: abs(a && a.getAttribute('href')),
        meta: txt(c.querySelector('[slot="upvotes-and-comments"]'))
      };
    }).filter(function (h) {
      return h.title && known.indexOf(h.link) === -1;
    });
  }

  function rules() {
    return list('faceplate-expandable-section-helper details').map(function (d) {
      return {
        name: txt(d.querySelector('summary h2, summary')),
        text: clean(d.querySelector('[id^="rule-"] [id$="-post-rtjson-content"]'))
      };
    }).filter(function (r) { return r.name; });
  }

  function gettingStarted() {
    var found = '';
    list('#right-sidebar-contents h2').some(function (h) {
      if (!/getting started/i.test(txt(h))) return false;
      var box = h.closest('div').parentNode.querySelector('.i18n-translatable-text .md');
      found = clean(box);
      return true;
    });
    return found;
  }

  /* ---------------- rendering ---------------- */

  var info = community();
  var allPosts = posts();
  var pinned = allPosts.filter(function (p) { return p.pinned; });
  var normal = allPosts.filter(function (p) { return !p.pinned; });
  var extraPinned = highlights(pinned.map(function (p) { return p.link; }));
  var nav = navItems();
  var ruleList = rules();
  var started = gettingStarted();
  var promos = ads();

  function renderPost(p) {
    var out = '<div class="post">';
    out += '<h3><a href="' + esc(p.link) + '">' + esc(p.title) + '</a></h3>';

    var meta = [];
    if (p.author) meta.push('by u/' + p.author);
    if (p.age) meta.push(p.age);
    if (p.score) meta.push(p.score + ' points');
    if (p.comments) meta.push(p.comments + ' comments');
    if (p.domain && !/^self\./.test(p.domain)) meta.push(p.domain);
    out += '<p class="meta"><i>' + esc(meta.join(' | ')) + '</i></p>';

    if (p.media) out += p.media;
    if (p.body) out += '<div class="body">' + p.body + '</div>';
    out += '<p><a href="' + esc(p.link) + '">Read comments &raquo;</a></p>';
    return out + '</div><hr>';
  }

  var html = '';

  /* toolbar: first few items inline, the rest folded */
  var VISIBLE = 6;
  html += '<div class="toolbar"><b>Menu:</b> ';
  html += nav.slice(0, VISIBLE).map(function (n) {
    return '<a href="' + esc(n.href) + '">' + esc(n.label) + '</a>';
  }).join(' | ');
  if (nav.length > VISIBLE) {
    html += '\n<details><summary>Show more</summary><p>';
    html += nav.slice(VISIBLE).map(function (n) {
      return '<a href="' + esc(n.href) + '">' + esc(n.label) + '</a>';
    }).join(' | ');
    html += '</p></details>';
  }
  html += '</div><hr>';

  html += '<h1>' + esc(info.name) + '</h1>';
  if (info.display && info.display !== info.name) {
    html += '<p><b>' + esc(info.display) + '</b></p>';
  }
  if (info.description) html += '<p>' + esc(info.description) + '</p>';

  var stats = [];
  if (info.active) stats.push(info.active + ' weekly active users');
  if (info.contributions) stats.push(info.contributions + ' weekly contributions');
  if (info.created) stats.push(info.created);
  if (stats.length) html += '<p><i>' + esc(stats.join(' | ')) + '</i></p>';
  html += '<hr>';

  if (pinned.length || extraPinned.length) {
    html += '<h2>Pinned &amp; highlighted</h2>';
    extraPinned.forEach(function (h) {
      html += '<div class="post"><h3><a href="' + esc(h.link) + '">' + esc(h.title) + '</a></h3>';
      if (h.meta) html += '<p class="meta"><i>' + esc(h.meta) + '</i></p>';
      html += '</div><hr>';
    });
    pinned.forEach(function (p) { html += renderPost(p); });
  }

  html += '<h2>Posts (' + normal.length + ')</h2>';
  if (!normal.length) {
    html += '<p>No posts found.</p><hr>';
  } else {
    normal.forEach(function (p) { html += renderPost(p); });
  }

  if (ruleList.length || started) {
    html += '<h2>About this community</h2>';
    if (ruleList.length) {
      html += '<h3>Rules</h3><ol>';
      ruleList.forEach(function (r) {
        html += '<li><b>' + esc(r.name) + '</b>' + (r.text ? r.text : '') + '</li>';
      });
      html += '</ol>';
    }
    if (started) html += '<h3>Getting started</h3>' + started;
    html += '<hr>';
  }

  if (promos.length) {
    html += '<h2>Advertisements</h2><ul>';
    promos.forEach(function (a) {
      html += '<li><a href="' + esc(a.link) + '">' + esc(a.title || '(untitled ad)') + '</a>';
      var m = [];
      if (a.author) m.push('u/' + a.author);
      if (a.domain) m.push(a.domain);
      if (a.cta) m.push(a.cta);
      if (m.length) html += ' <i>(' + esc(m.join(' | ')) + ')</i>';
      html += '</li>';
    });
    html += '</ul><hr>';
  }

  html += '<p><i>Rendered from ' + esc(location.href) + '</i></p>';

  /* ---------------- install ---------------- */

  document.title = info.name + ' - ' + info.display;
  list('link[rel="stylesheet"], style', document.head).forEach(function (n) {
    n.parentNode.removeChild(n);
  });
  list('script').forEach(function (n) { n.parentNode.removeChild(n); });

  var style = document.createElement('style');
  style.textContent =
    'body{font-family:serif;max-width:72em;margin:1em auto;padding:0 1em;line-height:1.4}' +
    'h1{font-size:1.6em}h2{font-size:1.3em;margin-top:1.2em}h3{font-size:1.1em;margin:.4em 0}' +
    '.meta{margin:.2em 0}.toolbar a{margin:0 .2em}img{max-width:100%;height:auto}' +
    'pre{white-space:pre-wrap}blockquote{margin-left:1em;border-left:2px solid #888;padding-left:.6em}';
  document.head.appendChild(style);

  document.body.innerHTML = html;
})();
