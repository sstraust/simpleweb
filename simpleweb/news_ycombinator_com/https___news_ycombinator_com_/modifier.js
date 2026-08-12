
(function () {
  "use strict";

  var BASE = "https://news.ycombinator.com/";
  var MAX_NAV = 8;

  function each(list, fn) {
    Array.prototype.forEach.call(list || [], fn);
  }

  function abs(href) {
    if (!href) return "";
    try {
      return new URL(href, BASE).href;
    } catch (e) {
      return href;
    }
  }

  function txt(node) {
    if (!node) return "";
    return node.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function link(href, label) {
    if (!href) return esc(label);
    return '<a href="' + esc(abs(href)) + '">' + esc(label) + "</a>";
  }

  // --- extraction -----------------------------------------------------

  function collectNav() {
    var out = [];
    var seen = {};
    each(document.querySelectorAll("span.pagetop a"), function (a) {
      var label = txt(a);
      if (!label) return;
      if (/^hacker news$/i.test(label)) label = "Home";
      var key = label.toLowerCase();
      if (seen[key]) return;
      seen[key] = 1;
      out.push({ label: label, href: abs(a.getAttribute("href")) });
    });
    return out;
  }

  function collectStories() {
    var stories = [];
    each(document.querySelectorAll("tr.athing.submission"), function (row) {
      var titleA = row.querySelector(".titleline a");
      if (!titleA) return;

      var next = row.nextElementSibling;
      var sub = next ? next.querySelector("td.subtext") : null;

      var scoreEl = sub ? sub.querySelector(".score") : null;
      var userEl = sub ? sub.querySelector("a.hnuser") : null;
      var ageEl = sub ? sub.querySelector(".age a") : null;

      var commentsA = null;
      if (sub) {
        each(sub.querySelectorAll("a"), function (a) {
          if (/comment|discuss/i.test(txt(a))) commentsA = a;
        });
      }

      stories.push({
        rank: txt(row.querySelector(".rank")).replace(/\.$/, ""),
        title: txt(titleA),
        url: abs(titleA.getAttribute("href")),
        site: txt(row.querySelector(".sitestr")),
        score: txt(scoreEl),
        user: txt(userEl),
        userUrl: userEl ? abs(userEl.getAttribute("href")) : "",
        age: txt(ageEl),
        itemUrl: ageEl ? abs(ageEl.getAttribute("href")) : "",
        comments: txt(commentsA),
        commentsUrl: commentsA ? abs(commentsA.getAttribute("href")) : "",
        // Job / sponsored posts carry no score and no vote arrow.
        sponsored: !scoreEl
      });
    });
    return stories;
  }

  function collectFooterLinks() {
    var out = [];
    each(document.querySelectorAll("span.yclinks a"), function (a) {
      out.push({ label: txt(a), href: abs(a.getAttribute("href")) });
    });
    return out;
  }

  function collectSearch() {
    var form = document.querySelector('form[action*="algolia"]');
    if (!form) return null;
    var input = form.querySelector('input[type="text"], input:not([type])');
    return {
      action: abs(form.getAttribute("action")),
      name: input ? input.getAttribute("name") || "q" : "q"
    };
  }

  function collectMoreLink() {
    var a = document.querySelector("a.morelink");
    if (!a) return null;
    return { label: txt(a) || "More", href: abs(a.getAttribute("href")) };
  }

  // --- rendering ------------------------------------------------------

  function renderNav(nav) {
    if (!nav.length) return "";
    function join(items) {
      return items
        .map(function (n) {
          return link(n.href, n.label);
        })
        .join(" | ");
    }
    var html = "<p>" + join(nav.slice(0, MAX_NAV));
    if (nav.length > MAX_NAV) {
      html +=
        "</p><details><summary>Show more navigation</summary><p>" +
        join(nav.slice(MAX_NAV)) +
        "</p></details>";
      return html;
    }
    return html + "</p>";
  }

  function renderStory(s) {
    var html = "<p>";
    if (s.rank) html += esc(s.rank) + ". ";
    html += "<b>" + link(s.url, s.title) + "</b>";
    if (s.site) html += " (" + esc(s.site) + ")";

    var meta = [];
    if (s.score) meta.push(esc(s.score));
    if (s.user) meta.push("by " + link(s.userUrl, s.user));
    if (s.age) meta.push(s.itemUrl ? link(s.itemUrl, s.age) : esc(s.age));
    if (s.comments) meta.push(link(s.commentsUrl, s.comments));
    else if (s.itemUrl) meta.push(link(s.itemUrl, "discuss"));

    if (meta.length) html += "<br>" + meta.join(" | ");
    return html + "</p>";
  }

  function build() {
    var nav = collectNav();
    var stories = collectStories();
    var footer = collectFooterLinks();
    var search = collectSearch();
    var more = collectMoreLink();

    var main = stories.filter(function (s) {
      return !s.sponsored;
    });
    var ads = stories.filter(function (s) {
      return s.sponsored;
    });

    var out = [];
    out.push("<h1>Hacker News</h1>");
    out.push(renderNav(nav));
    out.push("<hr>");

    out.push("<h2>Front Page (" + main.length + " stories)</h2>");
    main.forEach(function (s) {
      out.push(renderStory(s));
    });

    if (more) {
      out.push("<p><b>" + link(more.href, more.label + " stories &raquo;") + "</b></p>");
    }

    out.push("<hr>");
    out.push("<h2>Site Links</h2>");
    if (footer.length) {
      out.push(
        "<p>" +
          footer
            .map(function (f) {
              return link(f.href, f.label);
            })
            .join(" | ") +
          "</p>"
      );
    }

    if (search) {
      out.push(
        '<form method="get" action="' +
          esc(search.action) +
          '"><label>Search Hacker News: <input type="text" name="' +
          esc(search.name) +
          '" size="30"></label> <input type="submit" value="Search"></form>'
      );
    }

    if (ads.length) {
      out.push("<hr>");
      out.push("<h2>Sponsored / Jobs</h2>");
      ads.forEach(function (s) {
        out.push(renderStory(s));
      });
    }

    return out.join("\n");
  }

  function render() {
    var html = build();

    // Drop the original stylesheet and scripts so nothing fights the plain layout.
    each(
      document.querySelectorAll('link[rel="stylesheet"], style, script'),
      function (n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      }
    );

    var style = document.createElement("style");
    style.textContent =
      "body{background:#f6f6ef;color:#000;font-family:Verdana,Geneva,sans-serif;" +
      "font-size:13px;line-height:1.5;margin:1em auto;max-width:52em;padding:0 1em}" +
      "h1{font-size:20px;background:#ff6600;color:#fff;padding:4px 6px;margin:0 0 .5em}" +
      "h2{font-size:15px;border-bottom:1px solid #ccc;margin-top:1.2em}" +
      "a{color:#000}a:visited{color:#828282}p{margin:.6em 0}hr{border:0;border-top:1px solid #ff6600}";

    document.head.appendChild(style);
    document.body.setAttribute("bgcolor", "#f6f6ef");
    document.body.innerHTML = html;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
