
(function () {
  "use strict";

  var ORIGIN = "https://www.reddit.com";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function abs(href) {
    if (!href) return "";
    if (/^https?:/i.test(href)) return href;
    if (href.charAt(0) === "/") return ORIGIN + href;
    return href;
  }

  function attr(el, name) {
    return el && el.getAttribute ? el.getAttribute(name) || "" : "";
  }

  function txt(el) {
    return el ? (el.textContent || "").replace(/\s+/g, " ").trim() : "";
  }

  /* ---------- rich text -> simple html ---------- */

  function inline(node) {
    var out = "";
    if (!node) return out;
    for (var i = 0; i < node.childNodes.length; i++) {
      var n = node.childNodes[i];
      if (n.nodeType === 3) {
        out += esc(n.nodeValue);
      } else if (n.nodeType === 1) {
        var t = n.tagName.toLowerCase();
        if (t === "a") {
          out += '<a href="' + esc(abs(n.getAttribute("href"))) + '">' + (inline(n) || esc(n.getAttribute("href"))) + "</a>";
        } else if (t === "br") {
          out += "<br>";
        } else if (t === "strong" || t === "b") {
          out += "<b>" + inline(n) + "</b>";
        } else if (t === "em" || t === "i") {
          out += "<i>" + inline(n) + "</i>";
        } else if (t === "code") {
          out += "<code>" + inline(n) + "</code>";
        } else if (t === "img") {
          var src = n.getAttribute("src");
          if (src) out += '<a href="' + esc(abs(src)) + '">[image]</a>';
        } else if (t === "script" || t === "style" || t === "svg") {
          /* skip */
        } else {
          out += inline(n);
        }
      }
    }
    return out;
  }

  function block(root) {
    if (!root) return "";
    var out = "";
    for (var i = 0; i < root.childNodes.length; i++) {
      var n = root.childNodes[i];
      if (n.nodeType === 3) {
        var s = esc(n.nodeValue).trim();
        if (s) out += "<p>" + s + "</p>";
        continue;
      }
      if (n.nodeType !== 1) continue;
      var t = n.tagName.toLowerCase();
      if (t === "p") {
        var p = inline(n).trim();
        if (p) out += "<p>" + p + "</p>";
      } else if (t === "ul" || t === "ol") {
        var items = n.querySelectorAll(":scope > li");
        if (items.length) {
          out += "<" + t + ">";
          for (var j = 0; j < items.length; j++) out += "<li>" + (block(items[j]) || inline(items[j])) + "</li>";
          out += "</" + t + ">";
        }
      } else if (t === "blockquote") {
        out += "<blockquote>" + (block(n) || inline(n)) + "</blockquote>";
      } else if (t === "pre") {
        out += "<pre>" + esc(n.textContent) + "</pre>";
      } else if (/^h[1-6]$/.test(t)) {
        out += "<h4>" + inline(n) + "</h4>";
      } else if (t === "script" || t === "style" || t === "svg") {
        /* skip */
      } else {
        out += block(n) || (inline(n).trim() ? "<p>" + inline(n).trim() + "</p>" : "");
      }
    }
    return out;
  }

  function bodyHtml(el) {
    var html = block(el);
    if (!html) {
      var t = inline(el).trim();
      if (t) html = "<p>" + t + "</p>";
    }
    return html;
  }

  function ago(el) {
    var time = el ? el.querySelector("time, faceplate-timeago") : null;
    var s = txt(time);
    return s;
  }

  function whenText(iso, el) {
    var a = ago(el);
    if (a) return a;
    if (!iso) return "";
    var d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleString();
  }

  /* ---------- navigation ---------- */

  function buildNav() {
    var links = [];
    var seen = {};
    function add(label, href) {
      label = (label || "").replace(/\s+/g, " ").trim();
      href = abs(href);
      if (!label || !href || seen[label]) return;
      seen[label] = 1;
      links.push({ label: label, href: href });
    }

    var sub = document.querySelector("shreddit-post");
    var subName = attr(sub, "subreddit-prefixed-name");
    if (subName) add(subName, ORIGIN + "/" + subName + "/");
    add("Reddit front page", ORIGIN + "/");

    var legal = document.querySelectorAll(".legal-links a");
    for (var i = 0; i < legal.length; i++) add(txt(legal[i]), legal[i].getAttribute("href"));

    add("Log In", ORIGIN + "/login/");
    add("Sign Up", ORIGIN + "/register/");

    var head = 6;
    var out = "<p>";
    for (var k = 0; k < links.length && k < head; k++) {
      if (k) out += " | ";
      out += '<a href="' + esc(links[k].href) + '">' + esc(links[k].label) + "</a>";
    }
    out += "</p>";

    if (links.length > head) {
      out += "<details><summary>show more (" + (links.length - head) + " more links)</summary><p>";
      for (var m = head; m < links.length; m++) {
        if (m > head) out += " | ";
        out += '<a href="' + esc(links[m].href) + '">' + esc(links[m].label) + "</a>";
      }
      out += "</p></details>";
    }
    return out;
  }

  /* ---------- post ---------- */

  function buildPost() {
    var post = document.querySelector("shreddit-post");
    if (!post) return "<p>(no post found)</p>";

    var title = attr(post, "post-title") || txt(post.querySelector("h1"));
    var author = attr(post, "author");
    var subName = attr(post, "subreddit-prefixed-name");
    var score = attr(post, "score");
    var ncomments = attr(post, "comment-count");
    var permalink = abs(attr(post, "permalink"));
    var when = whenText(attr(post, "created-timestamp"), post.querySelector("faceplate-timeago"));

    var out = "";
    out += "<h1>" + esc(title) + "</h1>";

    var meta = [];
    if (subName) meta.push('<a href="' + esc(ORIGIN + "/" + subName + "/") + '">' + esc(subName) + "</a>");
    if (author) meta.push('posted by <a href="' + esc(ORIGIN + "/user/" + author + "/") + '">u/' + esc(author) + "</a>");
    if (when) meta.push(esc(when));
    if (score) meta.push(esc(score) + " points");
    if (ncomments) meta.push(esc(ncomments) + " comments");
    out += "<p>" + meta.join(" &middot; ") + "</p>";

    var text = post.querySelector('[id$="-post-rtjson-content"]');
    var textHtml = bodyHtml(text);
    if (textHtml) out += textHtml;

    var img = post.querySelector("#post-image, img.preview-img, [data-post-media-primary]");
    var media = abs(attr(post, "content-href"));
    if (img && img.getAttribute("src")) {
      out += '<p><img src="' + esc(abs(img.getAttribute("src"))) + '" alt="' + esc(title) + '"></p>';
    }
    if (media && !/^https?:\/\/(www\.)?reddit\.com/.test(media)) {
      out += '<p>Link: <a href="' + esc(media) + '">' + esc(media) + "</a></p>";
    }
    if (permalink) out += '<p><a href="' + esc(permalink) + '">permalink</a></p>';
    return out;
  }

  /* ---------- comments ---------- */

  function buildComments() {
    var nodes = document.querySelectorAll("shreddit-comment");
    if (!nodes.length) return "";

    var out = "<hr><h2>Comments</h2>";
    var count = 0;

    for (var i = 0; i < nodes.length; i++) {
      var c = nodes[i];
      var id = attr(c, "thingid");
      var author = attr(c, "author") || "[deleted]";
      var score = attr(c, "score");
      var depth = parseInt(attr(c, "depth"), 10) || 0;
      var isOp = c.hasAttribute("is-op");
      var when = whenText(attr(c, "created"), c.querySelector("faceplate-timeago"));
      var link = abs(attr(c, "permalink"));

      var body = id
        ? c.querySelector("#" + CSS.escape(id) + "-comment-rtjson-content")
        : c.querySelector('[id$="-comment-rtjson-content"]');
      var html = bodyHtml(body);
      if (!html) continue;

      var head = '<b><a href="' + esc(ORIGIN + "/user/" + author + "/") + '">' + esc(author) + "</a></b>";
      if (isOp) head += " (OP)";
      var bits = [];
      if (score) bits.push(esc(score) + " points");
      if (when) bits.push(esc(when));
      if (link) bits.push('<a href="' + esc(link) + '">link</a>');
      if (bits.length) head += " &middot; " + bits.join(" &middot; ");

      var open = "", close = "";
      for (var d = 0; d < depth; d++) {
        open += "<blockquote>";
        close += "</blockquote>";
      }

      out += open + "<p>" + head + "</p>" + html + close;
      if (depth === 0) out += "<hr>";
      count++;
    }

    return count ? out : "";
  }

  /* ---------- related posts + community ---------- */

  function buildRelated() {
    var items = document.querySelectorAll("reddit-pdp-right-rail-post");
    var out = "";

    if (items.length) {
      out += "<hr><h2>Related posts</h2><ul>";
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var a = it.querySelector("h3");
        var title = txt(a);
        var href = "";
        var links = it.querySelectorAll("a[href]");
        for (var k = 0; k < links.length; k++) {
          var h = links[k].getAttribute("href");
          if (h && /\/comments\//.test(h)) { href = abs(h); break; }
        }
        if (!title || !href) continue;
        var subLink = it.querySelector('a[href*="/r/"]');
        var sub = txt(subLink);
        var stats = txt(it.querySelector(".text-secondary-plain-weak"));
        out += "<li><a href=" + '"' + esc(href) + '">' + esc(title) + "</a>";
        var tail = [];
        if (sub) tail.push(esc(sub));
        if (stats) tail.push(esc(stats));
        if (tail.length) out += "<br>" + tail.join(" &middot; ");
        out += "</li>";
      }
      out += "</ul>";
    }

    var sh = document.querySelector("shreddit-subreddit-header");
    if (sh) {
      var name = attr(sh, "prefixed-name");
      var desc = attr(sh, "description");
      var subs = attr(sh, "subscribers");
      out += "<hr><h2>About " + esc(name) + "</h2>";
      if (desc) out += "<p>" + esc(desc) + "</p>";
      if (subs) out += "<p>" + esc(subs) + " members</p>";
      out += '<p><a href="' + esc(ORIGIN + "/" + name + "/") + '">Go to ' + esc(name) + "</a></p>";
    }

    return out;
  }

  /* ---------- advertisements (last) ---------- */

  function collectAds() {
    var ads = [];
    function push(el) { if (el && ads.indexOf(el) === -1) ads.push(el); }

    var direct = document.querySelectorAll("shreddit-comments-page-ad, shreddit-sidebar-ad");
    for (var i = 0; i < direct.length; i++) push(direct[i]);

    var tpls = document.querySelectorAll("template");
    for (var t = 0; t < tpls.length; t++) {
      if (!tpls[t].content) continue;
      var inner = tpls[t].content.querySelectorAll("shreddit-comments-page-ad");
      for (var j = 0; j < inner.length; j++) push(inner[j]);
    }
    return ads;
  }

  function buildAds() {
    var ads = collectAds();
    var rows = [];
    for (var i = 0; i < ads.length; i++) {
      var ad = ads[i];
      var title = attr(ad, "title");
      var domain = attr(ad, "domain");
      var url = attr(ad, "outbound-link-url") || attr(ad, "url");
      var advertiser = attr(ad, "author-id");
      var advName = txt(ad.querySelector(".advertiser-name span, .advertiser-name"));
      if (!title && !domain) continue;
      var row = "<li>";
      if (url) row += '<a href="' + esc(abs(url)) + '">' + esc(title || domain) + "</a>";
      else row += esc(title || domain);
      var tail = [];
      if (advName) tail.push(esc(advName));
      else if (advertiser) tail.push(esc(advertiser));
      if (domain) tail.push(esc(domain));
      if (tail.length) row += "<br>" + tail.join(" &middot; ");
      row += "</li>";
      rows.push(row);
    }
    if (!rows.length) return "";
    return "<hr><h2>Advertisements</h2><ul>" + rows.join("") + "</ul>";
  }

  /* ---------- render ---------- */

  function render() {
    var pageTitle = document.title || "reddit";

    var nav = buildNav();
    var post = buildPost();
    var comments = buildComments();
    var related = buildRelated();
    var ads = buildAds();

    var html = "";
    html += nav;
    html += "<hr>";
    html += post;
    html += comments;
    html += related;
    html += ads;
    html += "<hr><p><i>Rendered in plain HTML from " + esc(ORIGIN) + "</i></p>";

    /* drop the original stylesheets/scripts so the simple markup renders cleanly */
    var kill = document.querySelectorAll(
      'link[rel="stylesheet"], style, script[type="module"], shreddit-app'
    );
    for (var i = 0; i < kill.length; i++) {
      if (kill[i].parentNode) kill[i].parentNode.removeChild(kill[i]);
    }

    var style = document.createElement("style");
    style.textContent =
      "body{max-width:76ch;margin:1em auto;padding:0 1em;font-family:serif;line-height:1.4;background:#fff;color:#000}" +
      "img{max-width:100%;height:auto}" +
      "blockquote{margin:0 0 0 1.5em;border-left:1px solid #999;padding-left:.75em}" +
      "pre{white-space:pre-wrap}" +
      "h1{font-size:1.5em}h2{font-size:1.2em}";
    document.head.appendChild(style);
    document.title = pageTitle;

    document.body.innerHTML = html;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
