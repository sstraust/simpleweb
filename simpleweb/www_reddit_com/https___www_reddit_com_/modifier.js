
(function () {
  'use strict';

  var BASE = 'https://www.reddit.com';
  var NAV_VISIBLE = 7;

  function abs(href) {
    if (!href) return '';
    if (/^https?:/i.test(href)) return href;
    if (href.charAt(0) === '/') return BASE + href;
    return BASE + '/' + href;
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function text(node) {
    return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function count(value) {
    var n = parseInt(value, 10);
    if (isNaN(n)) return null;
    return n.toLocaleString('en-US');
  }

  function posted(stamp) {
    if (!stamp) return '';
    var d = new Date(stamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString();
  }

  /* ---------- navigation ---------- */

  function navItems() {
    var seen = {};
    var items = [];

    function add(label, href) {
      label = (label || '').replace(/\s+/g, ' ').trim();
      if (!label || !href) return;
      var key = label.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      items.push({ label: label, href: abs(href) });
    }

    add('Popular', '/r/popular/');
    add('Home', '/?feed=home');

    var sortMenu = document.querySelector('shreddit-sort-dropdown [slot="dropdown-items"]');
    if (sortMenu) {
      var sorts = sortMenu.querySelectorAll('a');
      for (var s = 0; s < sorts.length; s++) {
        add('Sort: ' + text(sorts[s]), sorts[s].getAttribute('href'));
      }
    }

    var footer = document.querySelectorAll('.legal-links a');
    for (var f = 0; f < footer.length; f++) {
      add(text(footer[f]), footer[f].getAttribute('href'));
    }

    var login = document.getElementById('login-button');
    var signup = document.getElementById('signup-button');
    if (login) add('Log In', login.getAttribute('href'));
    if (signup) add('Sign Up', signup.getAttribute('href'));

    return items;
  }

  function navHtml() {
    var items = navItems();
    var out = [];
    var head = [];
    var tail = [];
    var i;

    for (i = 0; i < items.length; i++) {
      var link = '<a href="' + esc(items[i].href) + '">' + esc(items[i].label) + '</a>';
      if (i < NAV_VISIBLE) head.push(link);
      else tail.push(link);
    }

    out.push('<p><b>Navigation:</b> ' + head.join(' | ') + '</p>');
    if (tail.length) {
      out.push('<details><summary>Show more navigation (' + tail.length + ')</summary>');
      out.push('<p>' + tail.join(' | ') + '</p></details>');
    }
    out.push('<form action="' + BASE + '/search/" method="get">');
    out.push('<label>Search Reddit: <input type="text" name="q" size="40"></label> ');
    out.push('<input type="submit" value="Search"></form>');
    return out.join('\n');
  }

  /* ---------- posts ---------- */

  function bodyText(post) {
    var body = post.querySelector('shreddit-post-text-body [id$="-post-rtjson-content"]');
    if (!body) return '';
    var paras = body.querySelectorAll('p');
    var out = [];
    for (var i = 0; i < paras.length; i++) {
      var line = text(paras[i]);
      if (line) out.push('<p>' + esc(line) + '</p>');
    }
    if (!out.length) {
      var whole = text(body);
      if (whole) out.push('<p>' + esc(whole) + '</p>');
    }
    return out.join('\n');
  }

  function mediaHtml(post) {
    var kind = post.getAttribute('post-type') || '';
    var href = post.getAttribute('content-href') || '';
    var domain = post.getAttribute('domain') || '';
    var out = [];

    if (kind === 'image') {
      var img = post.querySelector('[slot="post-media-container"] img.preview-img, [slot="post-media-container"] img');
      if (img && img.getAttribute('src')) {
        out.push('<p><img src="' + esc(img.getAttribute('src')) + '" alt="' +
          esc(post.getAttribute('post-title') || 'post image') + '" loading="lazy"></p>');
      }
      if (href) out.push('<p><a href="' + esc(href) + '">View full image</a></p>');
    } else if (kind === 'video') {
      var poster = post.querySelector('shreddit-player');
      var still = poster ? poster.getAttribute('poster') : null;
      if (still) out.push('<p><img src="' + esc(still) + '" alt="video thumbnail" loading="lazy"></p>');
      if (href) out.push('<p><a href="' + esc(href) + '">Watch video</a></p>');
    } else if (kind === 'link' && href) {
      out.push('<p>Link: <a href="' + esc(href) + '">' + esc(domain || href) + '</a></p>');
    } else if (kind === 'gallery' || kind === 'multi_media') {
      if (href) out.push('<p><a href="' + esc(href) + '">View gallery / media</a></p>');
    }
    return out.join('\n');
  }

  function postHtml(post, index) {
    var title = post.getAttribute('post-title') || text(post.querySelector('[slot="title"]'));
    var permalink = abs(post.getAttribute('permalink') || '');
    var sub = post.getAttribute('subreddit-prefixed-name') || '';
    var author = post.getAttribute('author') || '';
    var score = count(post.getAttribute('score'));
    var comments = count(post.getAttribute('comment-count'));
    var stamp = posted(post.getAttribute('created-timestamp'));

    var meta = [];
    if (sub) meta.push('<a href="' + esc(BASE + '/' + sub + '/') + '">' + esc(sub) + '</a>');
    if (author) meta.push('by <a href="' + esc(BASE + '/user/' + author + '/') + '">u/' + esc(author) + '</a>');
    if (stamp) meta.push(esc(stamp));
    if (score !== null) meta.push(esc(score) + ' points');
    if (comments !== null) {
      meta.push('<a href="' + esc(permalink) + '">' + esc(comments) + ' comments</a>');
    }

    var out = [];
    out.push('<h3>' + index + '. <a href="' + esc(permalink) + '">' + esc(title) + '</a></h3>');
    out.push('<p><small>' + meta.join(' &middot; ') + '</small></p>');
    var media = mediaHtml(post);
    if (media) out.push(media);
    var body = bodyText(post);
    if (body) out.push(body);
    return out.join('\n');
  }

  function postsHtml() {
    var posts = document.querySelectorAll('shreddit-post');
    var out = ['<h2>Popular Posts</h2>'];
    if (!posts.length) {
      out.push('<p>No posts found on this page.</p>');
      return out.join('\n');
    }
    for (var i = 0; i < posts.length; i++) {
      out.push('<hr>');
      out.push(postHtml(posts[i], i + 1));
    }
    return out.join('\n');
  }

  /* ---------- subcontent: communities and about links ---------- */

  function communitiesHtml() {
    var links = document.querySelectorAll('#popular-communities-list a');
    if (!links.length) return '';
    var out = ['<h2>Popular Communities</h2>', '<ul>'];
    for (var i = 0; i < links.length; i++) {
      var name = text(links[i].querySelector('.text-neutral-content')) || text(links[i]);
      var members = text(links[i].querySelector('.text-secondary-weak'));
      out.push('<li><a href="' + esc(abs(links[i].getAttribute('href'))) + '">' + esc(name) + '</a>' +
        (members ? ' &mdash; ' + esc(members) : '') + '</li>');
    }
    out.push('</ul>');
    return out.join('\n');
  }

  function aboutHtml() {
    var links = document.querySelectorAll('.legal-links a');
    if (!links.length) return '';
    var out = ['<h2>About Reddit</h2>', '<p>'];
    var parts = [];
    for (var i = 0; i < links.length; i++) {
      parts.push('<a href="' + esc(abs(links[i].getAttribute('href'))) + '">' + esc(text(links[i])) + '</a>');
    }
    out.push(parts.join(' | '));
    out.push('</p>');
    return out.join('\n');
  }

  /* ---------- advertisements (kept last) ---------- */

  function adsHtml() {
    var ads = document.querySelectorAll('shreddit-ad-post');
    if (!ads.length) return '';
    var out = ['<h2>Sponsored / Advertisements</h2>', '<ul>'];
    for (var i = 0; i < ads.length; i++) {
      var ad = ads[i];
      var title = ad.getAttribute('post-title') || '';
      var href = ad.getAttribute('outbound-link-url') || abs(ad.getAttribute('permalink') || '');
      var domain = ad.getAttribute('domain') || '';
      var advertiser = ad.getAttribute('author') || '';
      var cta = ad.getAttribute('call-to-action') || '';
      out.push('<li><a href="' + esc(href) + '">' + esc(title) + '</a><br>' +
        '<small>' + (advertiser ? 'u/' + esc(advertiser) + ' &middot; ' : '') +
        (domain ? esc(domain) + ' &middot; ' : '') + 'Promoted' +
        (cta ? ' &middot; ' + esc(cta) : '') + '</small></li>');
    }
    out.push('</ul>');
    return out.join('\n');
  }

  /* ---------- assemble ---------- */

  var pageTitle = (document.title || 'Reddit').replace(/\s+/g, ' ').trim();

  var page = [];
  page.push('<h1>' + esc(pageTitle) + '</h1>');
  page.push(navHtml());
  page.push('<hr>');
  page.push(postsHtml());
  page.push('<hr>');
  var communities = communitiesHtml();
  if (communities) page.push(communities);
  var about = aboutHtml();
  if (about) page.push(about);
  var ads = adsHtml();
  if (ads) {
    page.push('<hr>');
    page.push(ads);
  }
  page.push('<hr>');
  page.push('<p><small>Rendered in plain HTML from ' +
    esc(location && location.href ? location.href : BASE) + '</small></p>');

  document.documentElement.innerHTML =
    '<head><meta charset="utf-8"><title>' + esc(pageTitle) + '</title></head>' +
    '<body>' + page.join('\n') + '</body>';
})();
