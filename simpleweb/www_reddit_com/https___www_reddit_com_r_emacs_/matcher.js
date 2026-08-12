
(function () {
  'use strict';

  function q(sel, root) {
    try { return (root || document).querySelector(sel); } catch (e) { return null; }
  }

  function all(sel, root) {
    try { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    catch (e) { return []; }
  }

  function attr(el, name) {
    return (el && el.getAttribute && el.getAttribute(name)) || '';
  }

  try {
    if (typeof document === 'undefined' || !document.body) return false;

    /* ---- 1. Must be a Reddit "shreddit" (new web3x) rendered page ---- */
    var app = q('shreddit-app');
    if (!app) return false;

    var host = '';
    try { host = String(location.hostname || '').toLowerCase(); } catch (e) { host = ''; }
    if (host && !/(^|\.)reddit\.com$/.test(host)) return false;

    /* ---- 2. Must be a community (subreddit) feed page, not PDP/search/profile ---- */
    var pageType = attr(app, 'pagetype').toLowerCase();
    var routeName = attr(app, 'routename').toLowerCase();
    if (pageType !== 'community') return false;
    if (routeName && routeName !== 'subreddit') return false;

    /* ---- 3. Subreddit header the modifier reads community info from ---- */
    var header = q('shreddit-subreddit-header');
    if (!header) return false;
    var prefixed = attr(header, 'prefixed-name');
    var subName = attr(header, 'name');
    if (!prefixed && !subName) return false;
    if (prefixed && !/^r\//i.test(prefixed)) return false;

    /* ---- 4. The feed container ---- */
    if (!q('shreddit-feed')) return false;
    if (!q('main')) return false;

    /* ---- 5. Posts: the core of what the modifier renders ---- */
    var posts = all('shreddit-post');
    if (posts.length < 3) return false;

    var good = 0;
    var haveLink = 0;
    var haveType = 0;
    var haveId = 0;
    for (var i = 0; i < posts.length; i++) {
      var p = posts[i];
      var title = attr(p, 'post-title') || (q('[slot="title"]', p) ? q('[slot="title"]', p).textContent.trim() : '');
      var permalink = attr(p, 'permalink');
      var type = attr(p, 'post-type');
      var id = attr(p, 'id');
      if (title) good++;
      if (permalink && permalink.charAt(0) === '/') haveLink++;
      if (type) haveType++;
      if (/^t3_/.test(id)) haveId++;
    }

    /* the vast majority of posts must expose the attributes the modifier uses */
    if (good < Math.ceil(posts.length * 0.8)) return false;
    if (haveLink < Math.ceil(posts.length * 0.8)) return false;
    if (haveType < Math.ceil(posts.length * 0.8)) return false;
    if (haveId < Math.ceil(posts.length * 0.8)) return false;

    /* posts must belong to this subreddit's feed (subreddit-scoped permalinks) */
    var scoped = 0;
    for (var j = 0; j < posts.length; j++) {
      if (/^\/r\/[^\/]+\/comments\//i.test(attr(posts[j], 'permalink'))) scoped++;
    }
    if (scoped < Math.ceil(posts.length * 0.6)) return false;

    /* ---- 6. Post credit-bar metadata used for the "meta" line ---- */
    var withAuthor = 0;
    var withScore = 0;
    for (var k = 0; k < posts.length; k++) {
      if (attr(posts[k], 'author')) withAuthor++;
      if (attr(posts[k], 'score') !== '' || attr(posts[k], 'comment-count') !== '') withScore++;
    }
    if (withAuthor < Math.ceil(posts.length * 0.7)) return false;
    if (withScore < Math.ceil(posts.length * 0.7)) return false;

    /* ---- 7. Right rail / navigation affordances the modifier harvests ---- */
    var hasSort = !!q('shreddit-sort-dropdown [slot="dropdown-items"] a');
    var hasTabs = all('a[role="tab"]').length > 0;
    var hasLegal = all('.legal-links a').length > 0;
    if (!hasSort && !hasTabs && !hasLegal) return false;

    /* ---- 8. Rich text bodies are addressed by the -post-rtjson-content id suffix ---- */
    var rt = all('[id$="-post-rtjson-content"]');
    var textPosts = 0;
    for (var m = 0; m < posts.length; m++) {
      var t = attr(posts[m], 'post-type');
      if (t === 'text' || t === 'multi_media' || t === 'crosspost') textPosts++;
    }
    if (textPosts > 0 && rt.length === 0) return false;

    /* ---- 9. Reject obviously different page shapes ---- */
    if (q('shreddit-comment-tree') || q('shreddit-comment')) return false;
    if (q('reddit-search-results') || q('search-telemetry-tracker')) return false;
    if (q('shreddit-profile-card') || q('shreddit-user-header')) return false;

    return true;
  } catch (e) {
    return false;
  }
})();
