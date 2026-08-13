
(function () {
  'use strict';

  var REDDIT = 'https://www.reddit.com';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function abs(href) {
    if (!href) return '';
    try { return new URL(href, REDDIT).href; } catch (e) { return href; }
  }

  function num(n) {
    var v = parseInt(n, 10);
    if (isNaN(v)) return null;
    return v.toLocaleString('en-US');
  }

  function when(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function text(el) {
    if (!el) return '';
    return el.textContent.replace(/\s+/g, ' ').trim();
  }

  /* ---------- collect data before the page is torn down ---------- */

  function collectNav() {
    var seen = {};
    var out = [];
    var links = document.querySelectorAll('.legal-links a');
    for (var i = 0; i < links.length; i++) {
      var label = text(links[i]);
      var href = abs(links[i].getAttribute('href'));
      if (!label || !href || seen[label]) continue;
      seen[label] = 1;
      out.push({ label: label, href: href });
    }
    return out;
  }

  function collectDropdown(sortEvent) {
    var dd = document.querySelector('shreddit-sort-dropdown[sort-event="' + sortEvent + '"]');
    if (!dd) return [];
    var out = [];
    var items = dd.querySelectorAll('[slot="dropdown-items"] a');
    for (var i = 0; i < items.length; i++) {
      var label = text(items[i].querySelector('.text-body-2')) || text(items[i]);
      var href = abs(items[i].getAttribute('href'));
      if (label && href) out.push({ label: label, href: href });
    }
    return out;
  }

  function collectBody(post) {
    var host = post.querySelector('[slot="text-body"]');
    if (!host) return '';
    var paras = host.querySelectorAll('p');
    if (!paras.length) return text(host);
    var chunks = [];
    for (var i = 0; i < paras.length; i++) {
      var t = text(paras[i]);
      if (t) chunks.push(t);
    }
    return chunks.join('\n\n');
  }

  function collectPosts() {
    var nodes = document.querySelectorAll('shreddit-post');
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var p = nodes[i];
      var permalink = p.getAttribute('permalink');
      var title = p.getAttribute('post-title');
      if (!title) continue;
      out.push({
        title: title,
        href: abs(permalink),
        subreddit: p.getAttribute('subreddit-prefixed-name') || '',
        author: p.getAttribute('author') || '',
        score: p.getAttribute('score'),
        comments: p.getAttribute('comment-count'),
        created: p.getAttribute('created-timestamp'),
        type: p.getAttribute('post-type') || '',
        domain: p.getAttribute('domain') || '',
        content: p.getAttribute('content-href') || '',
        body: collectBody(p)
      });
    }
    return out;
  }

  function collectAds() {
    var nodes = document.querySelectorAll('shreddit-ad-post');
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      var title = a.getAttribute('post-title');
      if (!title) continue;
      out.push({
        title: title,
        advertiser: a.getAttribute('author') || '',
        domain: a.getAttribute('domain') || '',
        cta: a.getAttribute('call-to-action') || 'Learn More',
        href: a.getAttribute('outbound-link-url') || abs(a.getAttribute('permalink'))
      });
    }
    return out;
  }

  function collectCommunities() {
    var out = [];
    var items = document.querySelectorAll('#popular-communities-list a');
    for (var i = 0; i < items.length; i++) {
      var name = text(items[i].querySelector('.text-body-2 span')) ||
                 text(items[i].querySelector('.text-body-2'));
      var members = text(items[i].querySelector('.text-caption-1'));
      var href = abs(items[i].getAttribute('href'));
      if (name && href) out.push({ name: name, members: members, href: href });
    }
    return out;
  }

  var nav = collectNav();
  var sorts = collectDropdown('feed-sort-change');
  var geos = collectDropdown('feed-country-sort-change');
  var posts = collectPosts();
  var ads = collectAds();
  var communities = collectCommunities();
  var heading = (document.title || 'Reddit').replace(/\s+/g, ' ').trim();

  /* ---------- render ---------- */

  var VISIBLE_NAV = 6;
  var html = [];

  html.push('<h1>' + esc(heading) + '</h1>');

  /* toolbar */
  if (nav.length) {
    html.push('<p><b>Navigation:</b> ');
    var shown = [];
    for (var i = 0; i < nav.length && i < VISIBLE_NAV; i++) {
      shown.push('<a href="' + esc(nav[i].href) + '">' + esc(nav[i].label) + '</a>');
    }
    html.push(shown.join(' | '));
    if (nav.length > VISIBLE_NAV) {
      var rest = [];
      for (var j = VISIBLE_NAV; j < nav.length; j++) {
        rest.push('<a href="' + esc(nav[j].href) + '">' + esc(nav[j].label) + '</a>');
      }
      html.push(' <span id="nav-more" style="display:none"> | ' + rest.join(' | ') + '</span>');
      html.push(' <button type="button" id="nav-toggle">Show more</button>');
    }
    html.push('</p>');
  }

  if (sorts.length) {
    var sortLinks = [];
    for (var s = 0; s < sorts.length; s++) {
      sortLinks.push('<a href="' + esc(sorts[s].href) + '">' + esc(sorts[s].label) + '</a>');
    }
    html.push('<p><b>Sort:</b> ' + sortLinks.join(' | ') + '</p>');
  }

  html.push('<hr>');

  /* main content */
  html.push('<h2>Posts (' + posts.length + ')</h2>');

  if (!posts.length) {
    html.push('<p>No posts found on this page.</p>');
  }

  for (var k = 0; k < posts.length; k++) {
    var p = posts[k];
    html.push('<div>');
    html.push('<h3>' + (k + 1) + '. <a href="' + esc(p.href) + '">' + esc(p.title) + '</a></h3>');

    var meta = [];
    if (p.subreddit) meta.push(esc(p.subreddit));
    if (p.author) meta.push('by u/' + esc(p.author));
    var t = when(p.created);
    if (t) meta.push(esc(t));
    var sc = num(p.score);
    if (sc) meta.push(sc + ' points');
    var cc = num(p.comments);
    if (cc) meta.push(cc + ' comments');
    if (p.type) meta.push(esc(p.type));
    html.push('<p><small>' + meta.join(' &middot; ') + '</small></p>');

    if (p.body) {
      var paras = p.body.split('\n\n');
      for (var b = 0; b < paras.length; b++) {
        html.push('<p>' + esc(paras[b]) + '</p>');
      }
    } else if (p.content && p.content.indexOf(p.href) !== 0) {
      html.push('<p>Link: <a href="' + esc(p.content) + '">' +
                esc(p.domain || p.content) + '</a></p>');
    }

    html.push('<p><a href="' + esc(p.href) + '">Read comments &rarr;</a></p>');
    html.push('</div>');
    html.push('<hr>');
  }

  /* subcontent */
  if (communities.length || geos.length) {
    html.push('<h2>More from this page</h2>');

    if (communities.length) {
      html.push('<h3>Popular Communities</h3>');
      html.push('<ul>');
      for (var c = 0; c < communities.length; c++) {
        var line = '<a href="' + esc(communities[c].href) + '">' +
                   esc(communities[c].name) + '</a>';
        if (communities[c].members) line += ' &mdash; ' + esc(communities[c].members);
        html.push('<li>' + line + '</li>');
      }
      html.push('</ul>');
    }

    if (geos.length) {
      html.push('<h3>Filter by region</h3>');
      html.push('<ul>');
      for (var g = 0; g < geos.length; g++) {
        html.push('<li><a href="' + esc(geos[g].href) + '">' + esc(geos[g].label) + '</a></li>');
      }
      html.push('</ul>');
    }

    html.push('<hr>');
  }

  /* advertisements last */
  if (ads.length) {
    html.push('<h2>Advertisements</h2>');
    html.push('<ul>');
    for (var a2 = 0; a2 < ads.length; a2++) {
      var ad = ads[a2];
      var adLine = '<a href="' + esc(ad.href) + '">' + esc(ad.title) + '</a>';
      var adMeta = [];
      if (ad.advertiser) adMeta.push('u/' + esc(ad.advertiser));
      if (ad.domain) adMeta.push(esc(ad.domain));
      if (ad.cta) adMeta.push(esc(ad.cta));
      if (adMeta.length) adLine += '<br><small>Sponsored &middot; ' + adMeta.join(' &middot; ') + '</small>';
      html.push('<li>' + adLine + '</li>');
    }
    html.push('</ul>');
    html.push('<hr>');
  }

  html.push('<p><small>Rendered from ' + esc(location.href) + '</small></p>');

  /* ---------- swap in the new document ---------- */

  var strip = document.querySelectorAll('script, style, link[rel~="stylesheet"], noscript');
  for (var d = 0; d < strip.length; d++) {
    if (strip[d].parentNode) strip[d].parentNode.removeChild(strip[d]);
  }

  document.documentElement.removeAttribute('class');
  document.documentElement.removeAttribute('style');
  document.documentElement.setAttribute('lang', 'en');

  var body = document.body || document.createElement('body');
  body.removeAttribute('class');
  body.removeAttribute('style');
  body.innerHTML = html.join('\n');
  if (!body.parentNode) document.documentElement.appendChild(body);

  var toggle = document.getElementById('nav-toggle');
  var more = document.getElementById('nav-more');
  if (toggle && more) {
    toggle.addEventListener('click', function () {
      var hidden = more.style.display === 'none';
      more.style.display = hidden ? 'inline' : 'none';
      toggle.textContent = hidden ? 'Show less' : 'Show more';
    });
  }
})();
