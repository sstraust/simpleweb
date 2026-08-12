
(function () {
  "use strict";

  function detect() {
    try {
      if (typeof document === "undefined" || !document || !document.body) return false;

      var doc = document;

      // --- 1. Top-level shell: HN uses <html op="..."> and table#hnmain -------
      var main = doc.getElementById("hnmain");
      if (!main || String(main.tagName).toLowerCase() !== "table") return false;

      // Header nav block that collectNav() depends on.
      var pagetopLinks = doc.querySelectorAll("span.pagetop a");
      if (pagetopLinks.length < 4) return false;

      var navText = "";
      Array.prototype.forEach.call(pagetopLinks, function (a) {
        navText += " " + (a.textContent || "").toLowerCase();
      });
      // The front-page nav bar: new / past / comments / ask / show / jobs / submit
      var navHits = 0;
      ["new", "past", "comments", "ask", "show", "jobs", "submit"].forEach(function (w) {
        if (navText.indexOf(w) !== -1) navHits++;
      });
      if (navHits < 4) return false;

      // --- 2. Story rows -----------------------------------------------------
      var rows = doc.querySelectorAll("tr.athing.submission");
      if (rows.length < 10) return false; // a listing page, not an item/comment page

      // Comment pages (item?id=) are dominated by tr.athing.comtr.
      var commentRows = doc.querySelectorAll("tr.athing.comtr, tr.comtr");
      if (commentRows.length > 0) return false;

      var wellFormed = 0;
      var ranked = 0;
      var withSubtext = 0;
      var withScore = 0;
      var withUser = 0;
      var withAge = 0;
      var withItemLink = 0;

      Array.prototype.forEach.call(rows, function (row) {
        var titleA = row.querySelector(".titleline a");
        if (!titleA) return;
        var href = titleA.getAttribute("href");
        var label = (titleA.textContent || "").trim();
        if (!label) return;
        if (href === null) return;
        wellFormed++;

        var rankEl = row.querySelector(".rank");
        if (rankEl && /^\s*\d+\.?\s*$/.test(rankEl.textContent || "")) ranked++;

        var next = row.nextElementSibling;
        var sub = next ? next.querySelector("td.subtext") : null;
        if (!sub) return;
        withSubtext++;

        if (sub.querySelector(".score")) withScore++;
        if (sub.querySelector("a.hnuser")) withUser++;

        var ageA = sub.querySelector(".age a");
        if (ageA) {
          withAge++;
          var ah = ageA.getAttribute("href") || "";
          if (/item\?id=\d+/.test(ah)) withItemLink++;
        }
      });

      // Nearly every submission row must carry a usable title link.
      if (wellFormed < 10) return false;
      if (wellFormed < rows.length * 0.9) return false;

      // Ranking numbers are what renderStory() prints first.
      if (ranked < wellFormed * 0.9) return false;

      // Metadata rows must follow the "next sibling holds td.subtext" contract.
      if (withSubtext < wellFormed * 0.9) return false;

      // Most stories (all but job posts) must have score + user + age.
      if (withScore < wellFormed * 0.7) return false;
      if (withUser < wellFormed * 0.7) return false;
      if (withAge < wellFormed * 0.9) return false;
      if (withItemLink < withAge * 0.9) return false;

      // --- 3. Pagination + footer chrome ------------------------------------
      // Front-page style listings end with a "More" link.
      var more = doc.querySelector("a.morelink");
      if (!more) return false;

      var yclinks = doc.querySelectorAll("span.yclinks a");
      if (yclinks.length < 4) return false;

      // Search form the modifier re-renders.
      if (!doc.querySelector('form[action*="algolia"]')) return false;

      return true;
    } catch (e) {
      return false;
    }
  }

  var result = detect();
  if (typeof window !== "undefined") {
    window.__pageMatchesModifier = result;
  }
  return result;
})();
