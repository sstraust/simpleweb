
(function () {
  'use strict';

  var SITE = 'https://www.reddit.com';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function abs(href) {
    if (!href) return '';
    try { return new URL(href, SITE).href; } catch (e) { return href; }
  }

  function txt(node) {
    return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function count(v) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return null;
    return n.toLocaleString('en-US');
  }

  function list(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function when(post) {
    var t = txt(post.querySelector('faceplate-timeago time'));
    if (t) return t;
    var ts = post.getAttribute('created-timestamp');
    if (!ts) return '';
    var d = new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toUTCString();
  }

  /* ---------- extraction ---------- */

  function bodyParagraphs(post) {
    var box = post.querySelector('[id$="-post-rtjson-content"]') ||
              post.querySelector('shreddit-post-text-body .md');
    if (!box) return [];
    var out = [];
    var paras = list('p', box);
    if (paras.length) {
      paras.forEach(function (p) {
        var t = txt(p);
        if (t) out.push(t);
      });
    } else {
      var t = txt(box);
      if (t) out.push(t);
    }
    return out;
  }

  function outboundLink(post) {
    var href = post.getAttribute('content-href');
    if (!href) return null;
    var permalink = post.getAttribute('permalink') || '';
    if (permalink && href.indexOf(permalink) !== -1) return null;
    var domain = post.getAttribute('domain') || '';
    if (domain.indexOf('self.') === 0) return null;
    return { href: abs(href), domain: domain || href };
  }

  function collectPosts() {
    return list('shreddit-post').map(function (post) {
      return {
        title: post.getAttribute('post-title') || '(untitled)',
        permalink: abs(post.getAttribute('permalink')),
        subreddit: post.getAttribute('subreddit-prefixed-name') || '',
        subredditHref: abs('/' + (post.getAttribute('subreddit-prefixed-name') || '')),
        author: post.getAttribute('author') || '',
        score: count(post.getAttribute('score')),
        comments: count(post.getAttribute('comment-count')),
        age: when(post),
        type: post.getAttribute('post-type') || '',
        link: outboundLink(post),
        body: bodyParagraphs(post)
      };
    });
  }

  function collectAds() {
    var ads = list('shreddit-ad-post').map(function (ad) {
      return {
        title: ad.getAttribute('post-title') || '(sponsored)',
        author: ad.getAttribute('author') || '',
        href: abs(ad.getAttribute('outbound-link-url') || ad.getAttribute('permalink')),
        domain: txt(ad.querySelector('.ad-link-bar__domain')) || ad.getAttribute('domain') || ''
      };
    });
    list('shreddit-sidebar-ad').forEach(function (ad) {
      if (ad.hasAttribute('is-blank')) return;
      var href = ad.getAttribute('outbound-link-url') || ad.getAttribute('url');
      if (!href) return;
      ads.push({ title: 'Sidebar promotion', author: '', href: abs(href), domain: '' });
    });
    return ads;
  }

  function dropdown(sortEvent) {
    var box = document.querySelector('shreddit-sort-dropdown[sort-event="' + sortEvent + '"]');
    if (!box) return [];
    return list('[slot="dropdown-items"] a', box).map(function (a) {
      var li = a.closest('li');
      return {
        label: txt(a.querySelector('.text-body-2')) || txt(a),
        href: abs(a.getAttribute('href')),
        selected: !!(li && li.hasAttribute('rpl-selected'))
      };
    }).filter(function (o) { return o.label; });
  }

  function collectSiteLinks() {
    var seen = {}, out = [];
    list('.legal-links a').forEach(function (a) {
      var label = txt(a);
      var href = abs(a.getAttribute('href'));
      if (!label || seen[label]) return;
      seen[label] = true;
      out.push({ label: label, href: href });
    });
    return out;
  }

  function collectAuthLinks() {
    var out = [];
    ['#login-button', '#signup-button'].forEach(function (sel) {
      var a = document.querySelector(sel);
      if (a) out.push({ label: txt(a), href: abs(a.getAttribute('href')) });
    });
    return out;
  }

  function collectCommunities() {
    return list('#popular-communities-list a').map(function (a) {
      return {
        name: txt(a.querySelector('.text-body-2')) || txt(a),
        members: txt(a.querySelector('.text-caption-1')),
        href: abs(a.getAttribute('href'))
      };
    }).filter(function (c) { return c.name; });
  }

  /* ---------- rendering ---------- */

  function anchor(item) {
    return '<a href="' + esc(item.href) + '">' + esc(item.label || item.name) + '</a>';
  }

  function inlineLinks(items, sep) {
    return items.map(anchor).join(sep || ' | ');
  }

  function renderToolbar(nav, auth) {
    var parts = nav.slice(0, 5).concat(auth);
    return '<p><b>' + inlineLinks(parts, ' | ') + '</b></p>';
  }

  function renderSearch() {
    return '<form method="get" action="' + SITE + '/search/">' +
           '<label>Search Reddit: <input type="text" name="q" size="30"></label> ' +
           '<input type="submit" value="Search">' +
           '</form>';
  }

  /* Long menus: show the first few, fold the remainder behind "show more". */
  function renderMenu(label, items, keep) {
    if (!items.length) return '';
    var shown = items.slice(0, keep);
    var rest = items.slice(keep);
    var html = '<p>' + esc(label) + ': ' + shown.map(function (i) {
      var a = anchor(i);
      return i.selected ? '<b>' + a + '</b>' : a;
    }).join(' | ');
    if (rest.length) {
      html += '<details><summary>show more (' + rest.length + ')</summary>' +
              rest.map(anchor).join(' | ') + '</details>';
    }
    return html + '</p>';
  }

  function renderPost(p, index) {
    var out = [];
    out.push('<h3>' + (index + 1) + '. <a href="' + esc(p.permalink) + '">' + esc(p.title) + '</a></h3>');

    var meta = [];
    if (p.subreddit) meta.push('<a href="' + esc(p.subredditHref) + '">' + esc(p.subreddit) + '</a>');
    if (p.author) meta.push('by <a href="' + esc(abs('/user/' + p.author + '/')) + '">u/' + esc(p.author) + '</a>');
    if (p.age) meta.push(esc(p.age));
    if (p.score) meta.push(esc(p.score) + ' points');
    if (p.comments) meta.push(esc(p.comments) + ' comments');
    out.push('<p><small>' + meta.join(' &middot; ') + '</small></p>');

    if (p.link) {
      var kind = p.type === 'image' ? 'Image' : (p.type === 'gallery' ? 'Gallery' : 'Link');
      out.push('<p>' + kind + ': <a href="' + esc(p.link.href) + '">' + esc(p.link.domain) + '</a></p>');
    }

    p.body.forEach(function (para) {
      out.push('<p>' + esc(para) + '</p>');
    });

    out.push('<p><a href="' + esc(p.permalink) + '">Read' +
             (p.comments ? ' ' + esc(p.comments) : '') + ' comments &raquo;</a></p>');
    out.push('<hr>');
    return out.join('\n');
  }

  function renderCommunities(cs) {
    if (!cs.length) return '';
    return '<h2>Popular Communities</h2><ul>' + cs.map(function (c) {
      return '<li><a href="' + esc(c.href) + '">' + esc(c.name) + '</a>' +
             (c.members ? ' &mdash; <small>' + esc(c.members) + '</small>' : '') + '</li>';
    }).join('') + '</ul>';
  }

  function renderAds(ads) {
    if (!ads.length) return '';
    return '<h2>Sponsored / Advertisements</h2>' + ads.map(function (a) {
      var meta = [];
      if (a.author) meta.push('u/' + a.author);
      if (a.domain) meta.push(a.domain);
      return '<p><a href="' + esc(a.href) + '">' + esc(a.title) + '</a>' +
             (meta.length ? '<br><small>' + esc(meta.join(' &middot; ')) + '</small>' : '') + '</p>';
    }).join('');
  }

  /* ---------- assemble ---------- */

  var app = document.querySelector('shreddit-app');
  var pageType = app ? (app.getAttribute('pagetype') || '') : '';
  var heading = 'Reddit' + (pageType ? ' \u2014 ' + pageType.charAt(0).toUpperCase() + pageType.slice(1) : '');

  var posts = collectPosts();
  var ads = collectAds();
  var sorts = dropdown('feed-sort-change');
  var regions = dropdown('feed-country-sort-change');
  var siteLinks = collectSiteLinks();
  var auth = collectAuthLinks();
  var communities = collectCommunities();

  var page = [];
  page.push('<h1>' + esc(heading) + '</h1>');
  page.push(renderToolbar(siteLinks, auth));
  page.push(renderSearch());
  page.push('<hr>');
  page.push(renderMenu('Sort', sorts, 5));
  page.push(renderMenu('Region', regions, 4));
  page.push('<hr>');

  page.push('<h2>Posts</h2>');
  if (posts.length) {
    posts.forEach(function (p, i) { page.push(renderPost(p, i)); });
  } else {
    page.push('<p>No posts found on this page.</p>');
  }
  page.push('<p><a href="' + SITE + '/r/popular/">More posts on r/popular &raquo;</a></p>');

  page.push('<hr>');
  page.push(renderCommunities(communities));

  if (siteLinks.length) {
    page.push('<h2>Site Links</h2><p>' + inlineLinks(siteLinks, ' | ') + '</p>');
  }

  page.push('<hr>');
  page.push(renderAds(ads));

  var style = 'body{background:#fff;color:#000;font-family:Georgia,serif;max-width:44em;' +
              'margin:1em auto;padding:0 1em;line-height:1.4}' +
              'h1{font-size:1.6em}h2{font-size:1.3em;margin-top:1.2em}h3{font-size:1.1em;margin-bottom:.2em}' +
              'a{color:#0000ee}a:visited{color:#551a8b}hr{border:0;border-top:1px solid #999}' +
              'small{color:#444}summary{cursor:pointer}';

  var doc = '<head><meta charset="utf-8"><title>' + esc(heading) + '</title>' +
            '<style>' + style + '</style></head><body>' + page.join('\n') + '</body>';

  var root = document.documentElement;
  Array.prototype.slice.call(root.attributes).forEach(function (attr) {
    root.removeAttribute(attr.name);
  });
  root.setAttribute('lang', 'en');
  root.innerHTML = doc;
})();
