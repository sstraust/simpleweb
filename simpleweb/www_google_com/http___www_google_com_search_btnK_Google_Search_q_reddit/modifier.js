
(() => {
    // 1. Extract Search Query
    let qInput = document.querySelector('[name="q"]');
    let query = qInput ? (qInput.value || qInput.textContent) : 'Search';

    // 2. Extract Navigation (Toolbar)
    let navLinks = [];
    document.querySelectorAll('a.C6AK7c, .h5JSWd a').forEach(a => {
        let text = a.innerText.trim();
        if (text && !navLinks.find(n => n.text === text)) {
            navLinks.push({ href: a.href, text: text });
        }
    });

    // 3. Extract Main Search Results
    let results = [];
    document.querySelectorAll('.MjjYud').forEach(el => {
        // Find the title (handles both standard links and video carousels)
        let titleEl = el.querySelector('h3.LC20lb') || el.querySelector('[role="heading"] .cHaqb');
        if (!titleEl) return;
        
        let linkEl = titleEl.closest('a') || el.querySelector('a');
        if (!linkEl || !linkEl.href) return;
        
        // Find the snippet text
        let snippetEl = el.querySelector('.VwiC3b') || el.querySelector('.YrbPuc') || el.querySelector('.ZtihLe');
        let snippet = snippetEl ? snippetEl.innerText.replace(/\n/g, ' ').trim() : '';
        
        // Avoid duplicate links
        if (!results.find(r => r.url === linkEl.href)) {
            results.push({
                title: titleEl.innerText.trim(),
                url: linkEl.href,
                snippet: snippet
            });
        }
    });

    // 4. Extract Related Searches / Subcontent
    let related = [];
    document.querySelectorAll('a.ngTNl').forEach(a => {
        let text = a.innerText.trim().replace(/\n/g, ' ');
        if (text) related.push({ href: a.href, text: text });
    });

    // 5. Extract Pagination
    let pages = [];
    document.querySelectorAll('table.gUbm5e a').forEach(a => {
        let text = a.innerText.trim();
        if (text) pages.push({ href: a.href, text: text });
    });

    // 6. Extract Ads / Spam (to place at the bottom)
    let ads = [];
    document.querySelectorAll('#tads, #bottomads').forEach(ad => {
        let adLinks = ad.querySelectorAll('a');
        adLinks.forEach(a => {
            let title = a.querySelector('[role="heading"]') || a;
            let text = title.innerText.trim();
            if (text && a.href && !ads.find(existing => existing.href === a.href)) {
                ads.push({ href: a.href, text: text });
            }
        });
    });

    // --- REBUILD THE PAGE IN WEB 1.0 STYLE ---
    
    document.documentElement.innerHTML = '<head><title>' + query + ' - Simple Search</title></head><body></body>';
    let body = document.body;
    
    // Minimal inline styling (eww will mostly ignore this, but it makes it readable in standard browsers)
    body.style.fontFamily = 'monospace, sans-serif';
    body.style.maxWidth = '800px';
    body.style.margin = '0 auto';
    body.style.padding = '15px';
    body.style.lineHeight = '1.5';

    let html = `<h1>Search: ${query}</h1>`;
    
    // Search Box
    html += `<form action="/search" method="GET">
        <input type="text" name="q" value="${query}" size="40">
        <input type="submit" value="Search">
    </form><hr>`;

    // Toolbar (Folded if too long)
    if (navLinks.length > 0) {
        html += `<p><b>Navigation:</b> `;
        let visible = navLinks.slice(0, 4);
        let hidden = navLinks.slice(4);
        
        html += visible.map(n => `<a href="${n.href}">${n.text}</a>`).join(' | ');
        if (hidden.length > 0) {
            html += ` | <button onclick="document.getElementById('hidden-nav').style.display='inline'; this.style.display='none';">Show More</button>`;
            html += `<span id="hidden-nav" style="display:none;"> | ` + hidden.map(n => `<a href="${n.href}">${n.text}</a>`).join(' | ') + `</span>`;
        }
        html += `</p><hr>`;
    }

    // Main Results Section
    html += `<h2>Results</h2>`;
    if (results.length === 0) {
        html += `<p>No results found.</p>`;
    } else {
        results.forEach(r => {
            html += `<div style="margin-bottom: 1.8em;">
                <h3 style="margin: 0 0 2px 0; font-size: 1.2em;"><a href="${r.url}">${r.title}</a></h3>
                <div style="color: #006600; font-size: 0.9em; margin-bottom: 4px; word-break: break-all;">${r.url}</div>
                <div>${r.snippet}</div>
            </div>`;
        });
    }
    html += `<hr>`;

    // Subcontent Section
    if (related.length > 0) {
        html += `<h2>People also search for</h2><ul>`;
        related.forEach(r => {
            html += `<li><a href="${r.href}">${r.text}</a></li>`;
        });
        html += `</ul><hr>`;
    }

    // Pagination Section
    if (pages.length > 0) {
        html += `<p><b>Pages:</b> `;
        html += pages.map(p => `<a href="${p.href}">${p.text}</a>`).join(' | ');
        html += `</p><hr>`;
    }

    // Advertisements / Spam Section
    if (ads.length > 0) {
        html += `<h3>Sponsored</h3><ul>`;
        ads.forEach(ad => {
            html += `<li><a href="${ad.href}" rel="nofollow">${ad.text}</a></li>`;
        });
        html += `</ul>`;
    }

    body.innerHTML = html;
})();