
(function () {
  'use strict';

  function ok(x) { return !!x; }

  try {
    if (typeof document === 'undefined' || !document || !document.documentElement) return false;

    // ---------- 1. Origin / identity signals ----------
    var host = '';
    try { host = (location && location.hostname) ? location.hostname.toLowerCase() : ''; } catch (e) { host = ''; }
    var hostIsReddit = /(^|\.)reddit\.com$/.test(host);

    var canonical = document.querySelector('link[rel="canonical"]');
    var canonicalHref = canonical ? String(canonical.getAttribute('href') || '') : '';
    var canonicalIsReddit = /^https?:\/\/([a-z0-9-]+\.)?reddit\.com/i.test(canonicalHref);

    var siteMeta = document.querySelector('meta[property="og:site_name"]');
    var siteIsReddit = siteMeta && /reddit/i.test(String(siteMeta.getAttribute('content') || ''));

    // Must look like Reddit by at least one strong signal.
    if (!hostIsReddit && !canonicalIsReddit && !siteIsReddit) return false;

    // If we do know the host and it isn't reddit.com, bail out.
    if (host && !hostIsReddit) return false;

    // ---------- 2. Shreddit app shell ----------
    var app = document.querySelector('shreddit-app');
    if (!ok(app)) return false;

    // ---------- 3. Must be a FEED page, not a post/comments page ----------
    var feed = document.querySelector('shreddit-feed');
    if (!ok(feed)) return false;

    // Comment trees / single-post detail pages are a different layout.
    if (document.querySelector('shreddit-comment-tree')) return false;
    if (document.querySelector('shreddit-comment')) return false;
    if (document.querySelector('comment-body-header')) return false;

    // Search results pages have a different post component set.
    if (document.querySelector('search-telemetry-tracker')) return false;
    if (document.querySelector('shreddit-search-results')) return false;

    // The modifier only understands feeds rendered as a list of shreddit-post
    // elements inside the main content area.
    var main = document.getElementById('main-content');
    if (!ok(main)) return false;

    // ---------- 4. Posts: the core data source ----------
    var posts = document.querySelectorAll('shreddit-post');
    if (!posts || posts.length < 3) return false;

    var usable = 0;
    var withSubreddit = 0;
    var withAuthor = 0;
    var withScore = 0;
    var withComments = 0;
    var withCreated = 0;
    var withType = 0;
    var permalinkOk = 0;

    for (var i = 0; i < posts.length; i++) {
      var p = posts[i];
      var title = p.getAttribute('post-title');
      var permalink = p.getAttribute('permalink');

      if (!title || !String(title).trim()) continue;
      usable++;

      if (permalink && /^\/(r|user)\//.test(String(permalink))) permalinkOk++;
      if (p.getAttribute('subreddit-prefixed-name')) withSubreddit++;
      if (p.getAttribute('author')) withAuthor++;
      if (p.getAttribute('score') !== null && !isNaN(parseInt(p.getAttribute('score'), 10))) withScore++;
      if (p.getAttribute('comment-count') !== null && !isNaN(parseInt(p.getAttribute('comment-count'), 10))) withComments++;
      if (p.getAttribute('created-timestamp')) withCreated++;
      if (p.getAttribute('post-type')) withType++;
    }

    // Need a solid majority of posts carrying the attributes the modifier reads.
    if (usable < 3) return false;
    if (permalinkOk < Math.ceil(usable * 0.8)) return false;
    if (withSubreddit < Math.ceil(usable * 0.8)) return false;
    if (withAuthor < Math.ceil(usable * 0.8)) return false;
    if (withScore < Math.ceil(usable * 0.8)) return false;
    if (withComments < Math.ceil(usable * 0.8)) return false;
    if (withCreated < Math.ceil(usable * 0.8)) return false;
    if (withType < Math.ceil(usable * 0.8)) return false;

    // ---------- 5. Feed sort dropdown (feed-specific control) ----------
    var sortDropdown = document.querySelector('shreddit-sort-dropdown[sort-event="feed-sort-change"]');
    if (!ok(sortDropdown)) return false;
    var sortItems = sortDropdown.querySelectorAll('[slot="dropdown-items"] a[href]');
    if (!sortItems || sortItems.length < 2) return false;

    // ---------- 6. Legal / navigation links used for the toolbar ----------
    var legal = document.querySelectorAll('.legal-links a[href]');
    if (!legal || legal.length < 3) return false;

    // ---------- 7. Text-body extraction path still present ----------
    // At least one text post should expose its body via the expected slot,
    // OR there should be no text posts at all in this feed.
    var textPosts = 0;
    var textPostsWithSlot = 0;
    for (var j = 0; j < posts.length; j++) {
      if (posts[j].getAttribute('post-type') === 'text') {
        textPosts++;
        if (posts[j].querySelector('[slot="text-body"]')) textPostsWithSlot++;
      }
    }
    if (textPosts > 0 && textPostsWithSlot === 0) return false;

    return true;
  } catch (err) {
    return false;
  }
})();
