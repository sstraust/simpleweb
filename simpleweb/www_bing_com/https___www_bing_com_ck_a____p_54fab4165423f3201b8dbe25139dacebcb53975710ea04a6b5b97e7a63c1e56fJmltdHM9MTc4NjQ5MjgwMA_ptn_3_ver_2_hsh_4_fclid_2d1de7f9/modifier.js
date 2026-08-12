" is plain, unwrapped JavaScript — no markdown fences, no script tags — safe to concatenate directly after the page HTML and open in a browser.

source code:
(function(){
var d=document;
function txt(el){return el?el.textContent.replace(/\s+/g,' ').trim():'';}
function esc(s){s=s||'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

var pageTitle=txt(d.querySelector('title'))||'Reddit';
var descMeta=d.querySelector('meta[name="description"]');
var pageDesc=descMeta?descMeta.getAttribute('content')||'':'';

var navLinks=[];
var seen={};
d.querySelectorAll('.legal-links a[href]').forEach(function(a){
  var href=a.getAttribute('href');
  var label=txt(a);
  if(!href||!label||seen[href])return;
  seen[href]=true;
  navLinks.push({href:href,label:label});
});

var posts=[];
d.querySelectorAll('shreddit-post').forEach(function(p){
  var title=p.getAttribute('post-title');
  if(!title)return;
  posts.push({
    title:title,
    href:p.getAttribute('content-href')||p.getAttribute('permalink')||'#',
    author:p.getAttribute('author')||'',
    subreddit:p.getAttribute('subreddit-prefixed-name')||'',
    score:p.getAttribute('score')||'',
    comments:p.getAttribute('comment-count')||'',
    domain:p.getAttribute('domain')||''
  });
});

var comments=[];
d.querySelectorAll('shreddit-comment').forEach(function(c){
  var body=txt(c.querySelector('[slot="comment"]')||c);
  if(!body)return;
  comments.push({
    author:c.getAttribute('author')||'[deleted]',
    score:c.getAttribute('score')||'',
    body:body
  });
});

var searchInput=d.querySelector('input[name="q"]');
var searchValue=searchInput?searchInput.value:'';

var promoHeadline=txt(d.querySelector('#left-sidebar-container p'));

var out=[];
out.push('<h1>'+esc(pageTitle)+'</h1>');
if(pageDesc)out.push('<p>'+esc(pageDesc)+'</p>');

out.push('<div id="toolbar">');
var shown=navLinks.slice(0,8);
var rest=navLinks.slice(8);
shown.forEach(function(l,i){
  if(i)out.push(' | ');
  out.push('<a href="'+esc(l.href)+'">'+esc(l.label)+'</a>');
});
if(rest.length){
  out.push(' | <details style="display:inline"><summary style="display:inline;cursor:pointer">More&#8230;</summary>');
  rest.forEach(function(l){
    out.push(' <a href="'+esc(l.href)+'">'+esc(l.label)+'</a> |');
  });
  out.push('</details>');
}
out.push(' &nbsp; <form action="/search/" method="get" style="display:inline"><input type="text" name="q" value="'+esc(searchValue)+'" size="20"><input type="submit" value="Search"></form>');
out.push('</div>');
out.push('<hr>');

out.push('<h2>Posts</h2>');
if(posts.length){
  out.push('<table id="posts" border="0" cellpadding="4" cellspacing="0" width="100%">');
  posts.forEach(function(p,i){
    out.push('<tr><td valign="top" align="right">'+(i+1)+'.</td><td>');
    out.push('<a href="'+esc(p.href)+'"><b>'+esc(p.title)+'</b></a>');
    if(p.domain)out.push(' <small>('+esc(p.domain)+')</small>');
    out.push('<br><small>');
    var meta=[];
    if(p.score)meta.push(esc(p.score)+' points');
    if(p.subreddit)meta.push('in '+esc(p.subreddit));
    if(p.author)meta.push('by '+esc(p.author));
    if(p.comments)meta.push('<a href="'+esc(p.href)+'">'+esc(p.comments)+' comments</a>');
    out.push(meta.join(' | '));
    out.push('</small></td></tr>');
  });
  out.push('</table>');
}else{
  out.push('<p><i>No posts were present in the page source. Reddit loads the feed dynamically after the page loads; once loaded, posts would be listed here as a numbered table.</i></p>');
}
out.push('<hr>');

out.push('<h2>Comments</h2>');
if(comments.length){
  out.push('<ul id="comments">');
  comments.forEach(function(c){
    out.push('<li><b>'+esc(c.author)+'</b>');
    if(c.score)out.push(' ('+esc(c.score)+' points)');
    out.push(': '+esc(c.body)+'</li>');
  });
  out.push('</ul>');
}else{
  out.push('<p><i>No comments were present in the page source.</i></p>');
}
out.push('<hr>');

out.push('<div id="ads"><b>Promotional</b><br>');
if(promoHeadline)out.push(esc(promoHeadline)+'<br>');
out.push('<a href="https://www.reddit.com/register/">Sign Up</a> | <a href="https://www.reddit.com/login/">Log In</a>');
out.push('</div>');
out.push('<hr>');

out.push('<p id="footer">');
navLinks.forEach(function(l,i){
  if(i)out.push(' - ');
  out.push('<a href="'+esc(l.href)+'">'+esc(l.label)+'</a>');
});
out.push('</p>');

var css='body{font-family:Helvetica,Arial,sans-serif;background:#fff;color:#000;margin:12px;max-width:760px}'+
'h1{font-size:20px;margin-bottom:4px;border-bottom:2px solid #000}'+
'h2{font-size:15px;margin-top:16px;margin-bottom:4px;border-bottom:1px solid #999}'+
'#toolbar{background:#eeeeee;border:1px solid #999;padding:4px 6px}'+
'#posts td{border-bottom:1px solid #ccc;padding:4px}'+
'#comments li{margin-bottom:6px}'+
'#ads{background:#ffffcc;border:1px dashed #999;padding:6px;font-size:12px}'+
'#footer{font-size:11px;color:#555}'+
'a{color:#0000cc}a:visited{color:#660099}';

var newDoc='<head><title>'+esc(pageTitle)+'</title><style>'+css+'</style></head><body>'+out.join('')+'</body>';
d.documentElement.innerHTML=newDoc;
})();
