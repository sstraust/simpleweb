
(function () {
  'use strict';

  try {
    if (typeof document === 'undefined' || !document || !document.documentElement) return false;
    if (!document.body) return false;

    function attr(el, name) {
      if (!el) return '';
      var v = el.getAttribute(name);
      return v == null ? '' : String(v).trim();
    }

    function all(sel, root) {
      try {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
      } catch (e) {
        return [];
      }
    }

    function isRedditHost(host) {
      if (!host) return false;
      host = String(host).toLowerCase();
      return host === 'reddit.com' || host.slice(-11) === '.reddit.com';
    }

    function hostOf(url) {
      if (!url) return '';
      try { return new URL(url, 'https://www.reddit.com').hostname; } catch (e) { return ''; }
    }

    /* ---- 1. The document must belong to reddit.com ---- */
    var redditDoc = false;

    try {
      if (typeof location !== 'undefined' && location && isRedditHost(location.hostname)) redditDoc = true;
    } catch (e) { /* ignore */ }

    if (!redditDoc) {
      var canonical = document.querySelector('link[rel~="canonical"]');
      if (canonical && isRedditHost(hostOf(attr(canonical, 'href')))) redditDoc = true;
    }
    if (!redditDoc) {
      var og = document.querySelector('meta[property="og:url"]');
      if (og && isRedditHost(hostOf(attr(og, 'content')))) redditDoc = true;
    }
    if (!redditDoc) {
      var site = document.querySelector('meta[property="og:site_name"]');
      if (site && attr(site, 'content').toLowerCase() === 'reddit') redditDoc = true;
    }
    if (!redditDoc) return false;

    /* ---- 2. Must be the shreddit application shell ---- */
    var app = document.querySelector('shreddit-app');
    if (!app) return false;

    /* ---- 3. Must be a feed/listing page, not a post-detail or search page ---- */
    var pageType = attr(app, 'pagetype').toLowerCase();
    var badPageTypes = ['post_detail', 'postdetail', 'comments', 'search', 'search_results',
                        'profile', 'settings', 'inbox', 'chat', 'submit', 'wiki', 'modqueue'];
    for (var b = 0; b < badPageTypes.length; b++) {
      if (pageType === badPageTypes[b]) return false;
    }

    var feed = document.querySelector('shreddit-feed');
    if (!feed) return false;

    /* A rendered comment tree means this is a post-detail page, not a feed. */
    if (document.querySelector('shreddit-comment-tree') || document.querySelector('shreddit-comment')) {
      return false;
    }

    /* ---- 4. Posts must expose the attributes the modifier reads ---- */
    var posts = all('shreddit-post');
    if (posts.length < 2) return false;

    var validTotal = 0;
    var validInFeed = 0;
    var withSubreddit = 0;
    var withMeta = 0;

    for (var i = 0; i < posts.length; i++) {
      var p = posts[i];
      var title = attr(p, 'post-title');
      var permalink = attr(p, 'permalink');
      if (!title || !permalink) continue;

      validTotal++;

      if (attr(p, 'subreddit-prefixed-name')) withSubreddit++;
      if (attr(p, 'author') && (attr(p, 'comment-count') || attr(p, 'score'))) withMeta++;

      try {
        if (feed.contains(p)) validInFeed++;
      } catch (e) { /* ignore */ }
    }

    /* Enough well-formed posts, and the bulk of the posts on the page are well-formed. */
    if (validTotal < 2) return false;
    if (validTotal < Math.ceil(posts.length / 2)) return false;

    /* The posts must actually live inside the feed container. */
    if (validInFeed < 2) return false;

    /* Credit-bar data (subreddit / author / counts) must be broadly available. */
    if (withSubreddit < 2 || withSubreddit * 2 < validTotal) return false;
    if (withMeta < 2 || withMeta * 2 < validTotal) return false;

    return true;
  } catch (err) {
    return false;
  }
})();
