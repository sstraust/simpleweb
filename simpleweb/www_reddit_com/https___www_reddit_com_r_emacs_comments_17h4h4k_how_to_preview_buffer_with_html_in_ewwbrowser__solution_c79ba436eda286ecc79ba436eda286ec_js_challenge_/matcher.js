(.*)` instead of `source code:([\s\S]*)`), it will still seamlessly capture the entire executable string.

source code:
(function(doc){if(!doc||typeof doc.querySelector!=='function')return false;var post=doc.querySelector('shreddit-post');return !!(post&&(post.hasAttribute('post-title')||post.hasAttribute('author')));})(typeof document!=='undefined'?document:null);
