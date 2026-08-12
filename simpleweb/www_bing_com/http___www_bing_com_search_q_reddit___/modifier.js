
(function(){
function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escAttr(s){ return esc(s).replace(/"/g,'&quot;'); }
function text(el){ return el ? el.textContent.replace(/\s+/g,' ').trim() : ''; }

var qEl = document.getElementById('sb_form_q');
var query = qEl ? (qEl.value || qEl.getAttribute('value') || '') : '';

var countEl = document.querySelector('.sb_count');
var resultCount = text(countEl);

var navItems = [];
document.querySelectorAll('nav.b_scopebar a[href]').forEach(function(a){
  var href = a.getAttribute('href') || '';
  if (href.indexOf('javascript:') === 0) return;
  var label = text(a);
  if (!label) return;
  navItems.push({ label: label, href: href });
});

var results = [];
document.querySelectorAll('#b_results > li.b_algo').forEach(function(li){
  var titleA = li.querySelector('h2 a');
  var title = text(titleA);
  var href = titleA ? titleA.getAttribute('href') : '';
  var cite = text(li.querySelector('.b_attribution cite'));
  var caption = text(li.querySelector('.b_caption p'));
  if (title && href) results.push({ title: title, href: href, cite: cite, caption: caption });
});

var noticeEl = document.getElementById('results_removed_link');
var notice = text(noticeEl);

var pageLinks = [];
document.querySelectorAll('.sb_pagF a[href]').forEach(function(a){
  var label = a.getAttribute('aria-label') || text(a);
  var href = a.getAttribute('href');
  if (href) pageLinks.push({ label: label, href: href });
});

var footerLinks = [];
document.querySelectorAll('#b_footerItems a[href]').forEach(function(a){
  footerLinks.push({ label: text(a), href: a.getAttribute('href') });
});

var NAV_FOLD_AT = 6;
var navHtml = '<p id="nav-line">';
navItems.slice(0, NAV_FOLD_AT).forEach(function(n, i){
  if (i > 0) navHtml += ' | ';
  navHtml += '<a href="' + escAttr(n.href) + '">' + esc(n.label) + '</a>';
});
if (navItems.length > NAV_FOLD_AT) {
  navHtml += ' | <details style="display:inline"><summary style="display:inline;cursor:pointer;">more</summary>';
  navItems.slice(NAV_FOLD_AT).forEach(function(n){
    navHtml += ' | <a href="' + escAttr(n.href) + '">' + esc(n.label) + '</a>';
  });
  navHtml += '</details>';
}
navHtml += '</p>';

var resultsHtml = '<ol>';
results.forEach(function(r){
  resultsHtml += '<li style="margin-bottom:1em;">' +
    '<a href="' + escAttr(r.href) + '"><b>' + esc(r.title) + '</b></a><br>' +
    (r.cite ? '<font color="#006600" size="-1">' + esc(r.cite) + '</font><br>' : '') +
    (r.caption ? esc(r.caption) : '') +
    '</li>';
});
resultsHtml += '</ol>';

var subHtml = '';
if (notice) subHtml += '<p><i>' + esc(notice) + '</i></p>';
if (pageLinks.length) {
  subHtml += '<p>Pages: ';
  pageLinks.forEach(function(p, i){
    if (i > 0) subHtml += ' &nbsp; ';
    subHtml += '<a href="' + escAttr(p.href) + '">' + esc(p.label) + '</a>';
  });
  subHtml += '</p>';
}

var footerHtml = '';
if (footerLinks.length) {
  footerHtml += '<p><small>';
  footerLinks.forEach(function(f, i){
    if (i > 0) footerHtml += ' - ';
    footerHtml += '<a href="' + escAttr(f.href) + '">' + esc(f.label) + '</a>';
  });
  footerHtml += '</small></p>';
}

var pageTitle = esc(document.title || ('Search: ' + query));

var html =
  '<!DOCTYPE html>' +
  '<html><head><meta charset="utf-8"><title>' + pageTitle + '</title>' +
  '<style>body{font-family:Georgia,"Times New Roman",serif;max-width:700px;margin:1em auto;padding:0 1em;color:#000;background:#fff;}' +
  'h1{font-size:1.3em;} hr{margin:1em 0;} a{color:#0000EE;} ol{padding-left:1.3em;}' +
  '#nav-line{background:#eee;padding:0.4em;border:1px solid #ccc;}</style>' +
  '</head><body>' +
  '<form action="/search" method="get">' +
    '<input type="text" name="q" value="' + escAttr(query) + '" size="40">' +
    '<input type="submit" value="Search">' +
  '</form>' +
  navHtml +
  '<hr>' +
  '<h1>Results for: ' + esc(query) + '</h1>' +
  '<p>' + esc(resultCount) + '</p>' +
  '<main>' + resultsHtml + '</main>' +
  '<hr>' +
  '<section>' + subHtml + '</section>' +
  '<hr>' +
  '<footer>' + footerHtml + '</footer>' +
  '</body></html>';

document.open();
document.write(html);
document.close();
})();
