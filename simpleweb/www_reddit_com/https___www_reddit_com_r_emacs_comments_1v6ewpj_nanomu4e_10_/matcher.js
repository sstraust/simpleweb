
(function () {
  "use strict";

  function isCompatibleWithModifier(doc) {
    try {
      doc = doc || document;
      if (!doc || !doc.querySelector || !doc.body) return false;

      /* ---- 1. Must be a reddit.com post-detail URL ---- */
      var loc = (doc.defaultView && doc.defaultView.location) || doc.location || null;
      var host = loc && loc.hostname ? String(loc.hostname).toLowerCase() : "";
      var path = loc && loc.pathname ? String(loc.pathname) : "";

      if (host) {
        if (!/(^|\.)reddit\.com$/.test(host)) return false;
      }
      if (path && path !== "/" && !/\/comments\/[a-z0-9]+/i.test(path)) return false;

      /* Canonical URL is another reliable signal when the page is served from a file. */
      var canonical = doc.querySelector('link[rel="canonical"], #canonical-url-updater[value]');
      var canonicalHref = canonical
        ? canonical.getAttribute("href") || canonical.getAttribute("value") || ""
        : "";
      if (canonicalHref && !/^https?:\/\/(www\.)?reddit\.com\/r\/[^/]+\/comments\//i.test(canonicalHref)) {
        return false;
      }
      if (!host && !canonicalHref) return false;

      /* ---- 2. Exactly one shreddit-post (feeds/profiles carry many; ads are separate tags) ---- */
      var posts = doc.querySelectorAll("shreddit-post");
      if (posts.length !== 1) return false;
      var post = posts[0];

      /* ---- 3. Post attributes the modifier reads ---- */
      function attr(el, n) {
        var v = el.getAttribute(n);
        return v == null ? "" : String(v).trim();
      }

      var title = attr(post, "post-title");
      var permalink = attr(post, "permalink");
      var subName = attr(post, "subreddit-prefixed-name");
      var author = attr(post, "author");
      var created = attr(post, "created-timestamp");
      var score = attr(post, "score");
      var commentCountAttr = attr(post, "comment-count");

      if (!title) return false;
      if (!/^\/r\/[^/]+\/comments\/[a-z0-9]+/i.test(permalink)) return false;
      if (!/^r\/[^/\s]+$/.test(subName)) return false;
      if (!author) return false;
      if (!created || isNaN(new Date(created).getTime())) return false;
      if (!/^-?\d+$/.test(score)) return false;
      if (!/^\d+$/.test(commentCountAttr)) return false;

      /* The <h1> title the modifier falls back to. */
      if (!post.querySelector("h1")) return false;

      /* ---- 4. Post must have renderable content: text body, image, or external link ---- */
      var hasText = false;
      var textEl = post.querySelector('[id$="-post-rtjson-content"]');
      if (textEl && (textEl.textContent || "").trim().length > 0) hasText = true;

      var hasImage = false;
      var img = post.querySelector("#post-image, img.preview-img, [data-post-media-primary]");
      if (img && img.getAttribute && (img.getAttribute("src") || "").trim()) hasImage = true;

      var hasLink = false;
      var contentHref = attr(post, "content-href");
      if (/^https?:\/\//i.test(contentHref)) hasLink = true;

      if (!hasText && !hasImage && !hasLink) return false;

      /* ---- 5. Comment tree must exist and match the flat depth-attribute structure ---- */
      var tree = doc.querySelector("shreddit-comment-tree");
      var comments = doc.querySelectorAll("shreddit-comment");
      if (!tree && comments.length === 0) return false;

      var declaredComments = parseInt(commentCountAttr, 10);
      if (comments.length === 0) {
        /* Zero rendered comments is only coherent if the post claims zero. */
        if (declaredComments > 0) return false;
      } else {
        var renderable = 0;
        var sawDepthZero = false;

        for (var i = 0; i < comments.length; i++) {
          var c = comments[i];
          var id = attr(c, "thingid");
          var depthRaw = attr(c, "depth");

          if (!/^t1_[a-z0-9]+$/i.test(id)) return false;
          if (!/^\d+$/.test(depthRaw)) return false;
          if (parseInt(depthRaw, 10) === 0) sawDepthZero = true;
          if (!attr(c, "author")) return false;

          /* Body container id must follow "<thingid>-comment-rtjson-content". */
          var body = null;
          for (var j = 0; j < c.children.length + 0; j++) { /* no-op guard for odd DOMs */ break; }
          var bodies = c.querySelectorAll('[id$="-comment-rtjson-content"]');
          for (var k = 0; k < bodies.length; k++) {
            if (bodies[k].id === id + "-comment-rtjson-content") { body = bodies[k]; break; }
          }
          if (body && (body.textContent || "").trim().length > 0) renderable++;
        }

        if (!sawDepthZero) return false;
        if (renderable === 0) return false;
      }

      /* ---- 6. Comment bodies are looked up with CSS.escape ---- */
      var view = doc.defaultView || (typeof window !== "undefined" ? window : null);
      var cssApi = view && view.CSS;
      if (comments.length > 0 && !(cssApi && typeof cssApi.escape === "function")) return false;

      /* ---- 7. Reject pages that are primarily something else ---- */
      if (doc.querySelector("shreddit-feed, shreddit-profile-feed, search-results-layout")) return false;

      return true;
    } catch (e) {
      return false;
    }
  }

  var result = isCompatibleWithModifier(document);
  try {
    if (typeof window !== "undefined") {
      window.isCompatibleWithModifier = isCompatibleWithModifier;
      window.__modifierCompatible = result;
    }
    if (typeof console !== "undefined" && console.log) console.log(result);
  } catch (e) {}
  return result;
})();
