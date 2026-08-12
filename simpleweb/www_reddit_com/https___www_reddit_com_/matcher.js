
(function () {
  'use strict';

  function fail(reason) {
    if (typeof console !== 'undefined' && console.log) {
      console.log('[validator] not compatible: ' + reason);
    }
    return false;
  }

  try {
    if (typeof document === 'undefined' || !document || !document.documentElement) {
      return fail('no document');
    }

    var qs = function (sel) {
      try { return document.querySelector(sel); } catch (e) { return null; }
    };
    var qsa = function (sel) {
      try { return document.querySelectorAll(sel); } catch (e) { return []; }
    };

    /* ---- 1. Must be a Reddit "shreddit" rendered page ---- */

    var app = qs('shreddit-app');
    if (!app) return fail('no shreddit-app shell');

    var canonical = qs('link[rel="canonical"]');
    var canonicalHref = canonical ? (canonical.getAttribute('href') || '') : '';
    var ogSite = qs('meta[property="og:site_name"]');
    var ogSiteVal = ogSite ? (ogSite.getAttribute('content') || '') : '';
    var host = '';
    try { host = (window.location && window.location.hostname) || ''; } catch (e) { host = ''; }

    var looksReddit =
      /(^|\.)reddit\.com/i.test(host) ||
      /reddit\.com/i.test(canonicalHref) ||
      /^reddit$/i.test(ogSiteVal.replace(/\s+/g, '')) ||
      !!qs('shreddit-feed') ||
      !!qs('faceplate-partial');
    if (!looksReddit) return fail('not a reddit page');

    /* ---- 2. Must be a FEED page, not a post/comments page ---- */

    if (qs('shreddit-comment-tree') || qs('shreddit-comment') || qs('comment-body-header')) {
      return fail('comments present: this is a post detail page');
    }

    var pageType = (app.getAttribute('pagetype') || '').toLowerCase();
    var routeName = (app.getAttribute('routename') || '').toLowerCase();
    var badRoutes = [
      'post_page', 'postpage', 'comments', 'comment', 'search', 'search_results',
      'profile', 'user_profile', 'settings', 'submit', 'modqueue', 'wiki',
      'login', 'register', 'inbox', 'chat', 'topic'
    ];
    var i;
    for (i = 0; i < badRoutes.length; i++) {
      if (pageType === badRoutes[i] || routeName === badRoutes[i]) {
        return fail('page/route type "' + (pageType || routeName) + '" is not a feed');
      }
    }
    if (/search/i.test(pageType) || /search/i.test(routeName)) {
      return fail('search results page');
    }

    var feed = qs('shreddit-feed');
    if (!feed) return fail('no shreddit-feed container');

    /* ---- 3. Feed must contain enough well-formed shreddit-post entries ---- */

    var posts = qsa('shreddit-post');
    if (!posts || posts.length < 3) {
      return fail('only ' + (posts ? posts.length : 0) + ' shreddit-post element(s)');
    }

    var feedPosts = 0;
    try {
      feedPosts = feed.querySelectorAll('shreddit-post').length;
    } catch (e) {
      feedPosts = 0;
    }
    if (feedPosts < 3) return fail('fewer than 3 posts inside shreddit-feed');

    var wellFormed = 0;
    var withTitleSlot = 0;
    var withSubreddit = 0;
    var withTimestamp = 0;
    var withMetrics = 0;
    var knownTypes = {
      image: 1, video: 1, link: 1, text: 1, gallery: 1,
      multi_media: 1, rich_video: 1, crosspost: 1, predictions: 1, talk: 1
    };
    var withKnownType = 0;

    for (i = 0; i < posts.length; i++) {
      var p = posts[i];
      var permalink = p.getAttribute('permalink');
      var title = p.getAttribute('post-title');
      var titleNode = null;
      try { titleNode = p.querySelector('[slot="title"]'); } catch (e) { titleNode = null; }

      if (permalink && /^\/?r\/|^\/?user\/|^\//.test(permalink) && (title || titleNode)) {
        wellFormed++;
      }
      if (titleNode) withTitleSlot++;
      if (p.getAttribute('subreddit-prefixed-name')) withSubreddit++;
      if (p.getAttribute('created-timestamp')) withTimestamp++;
      if (p.getAttribute('score') !== null || p.getAttribute('comment-count') !== null) {
        withMetrics++;
      }
      var t = (p.getAttribute('post-type') || '').toLowerCase();
      if (t && knownTypes[t]) withKnownType++;
    }

    var total = posts.length;
    var ratio = function (n) { return n / total; };

    if (wellFormed < 3 || ratio(wellFormed) < 0.7) {
      return fail('posts missing permalink/title (' + wellFormed + '/' + total + ')');
    }
    if (ratio(withTitleSlot) < 0.7) {
      return fail('posts missing [slot="title"] (' + withTitleSlot + '/' + total + ')');
    }
    if (ratio(withSubreddit) < 0.6) {
      return fail('posts missing subreddit-prefixed-name (' + withSubreddit + '/' + total + ')');
    }
    if (ratio(withTimestamp) < 0.7) {
      return fail('posts missing created-timestamp (' + withTimestamp + '/' + total + ')');
    }
    if (ratio(withMetrics) < 0.7) {
      return fail('posts missing score/comment-count (' + withMetrics + '/' + total + ')');
    }
    if (ratio(withKnownType) < 0.6) {
      return fail('posts missing recognizable post-type (' + withKnownType + '/' + total + ')');
    }

    /* ---- 4. Media / body containers the modifier reads ---- */

    var hasMediaContainer = !!qs('shreddit-post [slot="post-media-container"]');
    var hasTextBody = !!qs('shreddit-post-text-body');
    var hasThumbnail = !!qs('shreddit-post [slot="thumbnail"]');
    if (!hasMediaContainer && !hasTextBody && !hasThumbnail) {
      return fail('no post media/body/thumbnail containers found');
    }

    /* ---- 5. Footer navigation the modifier harvests ---- */

    var legal = qsa('.legal-links a');
    if (!legal || legal.length < 3) {
      return fail('legal-links navigation missing');
    }

    return true;
  } catch (err) {
    if (typeof console !== 'undefined' && console.log) {
      console.log('[validator] error: ' + (err && err.message ? err.message : err));
    }
    return false;
  }
})();
