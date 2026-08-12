
(function(){
var result=false;
try{
var d=document;
var host='';
try{host=(window.location&&window.location.hostname)||'';}catch(e){host='';}
var isRedditHost=/(^|\.)reddit\.com$/i.test(host);
var ogSite=d.querySelector('meta[property="og:site_name"]');
var isRedditMeta=!!(ogSite&&/reddit/i.test(ogSite.getAttribute('content')||''));
var shredditApp=d.querySelector('shreddit-app');
var hasShredditMarkup=!!shredditApp||!!d.querySelector('[data-testid="shreddit-app"]')||!!d.querySelector('html.theme-beta');
var hasFooterLinks=d.querySelectorAll('.legal-links a[href]').length>0;
var hasSearchInput=!!d.querySelector('input[name="q"]');
var hasTitle=!!(d.querySelector('title')&&d.querySelector('title').textContent.trim());
var isReddit=isRedditHost||isRedditMeta||hasShredditMarkup;
var hasRequiredStructure=hasFooterLinks&&hasSearchInput&&hasTitle;
result=!!(isReddit&&hasRequiredStructure);
}catch(e){
result=false;
}
try{window.__MODIFIER_APPLICABLE__=result;}catch(e){}
return result;
})();

This checks: (1) Reddit identity — hostname ending in `reddit.com`, an `og:site_name` meta of "Reddit", or the presence of `<shreddit-app>`/`html.theme-beta` — and (2) the three DOM anchors the script directly queries (`.legal-links a[href]`, `input[name="q"]`, a non-empty `<title>`). It deliberately does **not** require `shreddit-post`/`shreddit-comment` elements, since the modifier already has graceful fallback text for pages where those haven't loaded yet — but it does require the identity + structural selectors, since without those the toolbar, search box, and footer sections would silently render empty or broken.
