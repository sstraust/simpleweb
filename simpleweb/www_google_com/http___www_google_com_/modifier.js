
(function() {
    // 1. Sanitize the document: strip out existing modern styles, heavy scripts, and svg assets
    document.querySelectorAll('style, script, link, meta, svg, iframe, noscript').forEach(el => el.remove());

    // 2. Data Extraction
    // Extract top horizontal navigation options
    const navLinks = [];
    const topNavSelectors = ['a.w5hRs', 'a.gb_6', 'a.gb_A'];
    topNavSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            const text = el.innerText.trim();
            if (text) navLinks.push({ text: text, href: el.href || '#' });
        });
    });

    // Extract footer elements (spam/ads/terms/settings)
    const footerLinks = [];
    document.querySelectorAll('.pHiOh').forEach(el => {
        const text = el.innerText.trim();
        if (text) footerLinks.push({ text: text, href: el.getAttribute('href') || '#' });
    });

    // Extract any main promo or subcontent
    const promoEl = document.querySelector('.ktLKi');
    const promoText = promoEl ? promoEl.innerText.trim() : '';

    // Extract search form destination
    const formEl = document.querySelector('form');
    const formAction = formEl ? formEl.getAttribute('action') : '/search';

    // 3. Document Reset
    document.body.innerHTML = '';
    const removeAttributes = ['jsmodel', 'jsaction', 'class', 'style', 'jscontroller', 'data-hveid'];
    removeAttributes.forEach(attr => document.body.removeAttribute(attr));
    
    // Apply Web 1.0 generic document properties
    document.body.bgColor = "#ffffff";
    document.body.text = "#000000";
    document.body.link = "#0000ee";
    document.body.vlink = "#551a8b";

    // 4. Rebuild the DOM (Web 1.0 / EWW style)
    const center = document.createElement('center');

    // Section 1: Navigation Toolbar
    const navDiv = document.createElement('div');
    navDiv.style.marginTop = "10px";
    navDiv.style.marginBottom = "15px";
    navLinks.forEach((link, i) => {
        const a = document.createElement('a');
        a.href = link.href;
        a.innerText = link.text;
        navDiv.appendChild(a);
        if (i < navLinks.length - 1) {
            const sep = document.createElement('span');
            sep.innerHTML = '&nbsp;|&nbsp;';
            navDiv.appendChild(sep);
        }
    });
    center.appendChild(navDiv);
    center.appendChild(document.createElement('hr'));

    // Section 2: Main Content (Header & Form)
    const h1 = document.createElement('h1');
    h1.innerText = 'Google';
    h1.style.fontFamily = 'serif';
    center.appendChild(h1);

    const form = document.createElement('form');
    form.action = formAction;
    form.method = 'GET';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'q';
    input.size = 50;
    form.appendChild(input);

    form.appendChild(document.createElement('br'));
    form.appendChild(document.createElement('br'));

    const btnSearch = document.createElement('input');
    btnSearch.type = 'submit';
    btnSearch.name = 'btnK';
    btnSearch.value = 'Google Search';
    form.appendChild(btnSearch);

    const btnLucky = document.createElement('input');
    btnLucky.type = 'submit';
    btnLucky.name = 'btnI';
    btnLucky.value = "I'm Feeling Lucky";
    btnLucky.style.marginLeft = "10px";
    form.appendChild(btnLucky);

    center.appendChild(form);
    center.appendChild(document.createElement('hr'));

    // Section 3: Subcontent (Promos)
    if (promoText) {
        const promoP = document.createElement('p');
        promoP.innerHTML = '<b>' + promoText + '</b>';
        center.appendChild(promoP);
        center.appendChild(document.createElement('hr'));
    }

    // Section 4: Footer / Spam (With folding logic)
    const footerDiv = document.createElement('div');
    footerDiv.style.marginTop = "20px";
    
    // Fold items beyond the top 3
    const visibleCount = 3;

    footerLinks.forEach((link, i) => {
        const a = document.createElement('a');
        a.href = link.href;
        a.innerText = link.text;

        if (i < visibleCount) {
            footerDiv.appendChild(a);
            if (i < footerLinks.length - 1) {
                const sep = document.createElement('span');
                sep.innerHTML = '&nbsp;|&nbsp;';
                footerDiv.appendChild(sep);
            }
        } else {
            // Setup the fold boundary once
            if (i === visibleCount) {
                const showMore = document.createElement('a');
                showMore.href = '#';
                showMore.innerText = '[Show more]';
                showMore.id = 'show_more_btn';
                showMore.onclick = function(e) {
                    e.preventDefault();
                    document.getElementById('more_links').style.display = 'inline';
                    this.style.display = 'none';
                };
                footerDiv.appendChild(showMore);

                const moreSpan = document.createElement('span');
                moreSpan.id = 'more_links';
                moreSpan.style.display = 'none';
                footerDiv.appendChild(moreSpan);
            }

            const moreSpan = footerDiv.querySelector('#more_links');
            if (i === visibleCount) {
                const sep = document.createElement('span');
                sep.innerHTML = '&nbsp;';
                moreSpan.appendChild(sep);
            }
            moreSpan.appendChild(a);
            if (i < footerLinks.length - 1) {
                const sep = document.createElement('span');
                sep.innerHTML = '&nbsp;|&nbsp;';
                moreSpan.appendChild(sep);
            }
        }
    });

    center.appendChild(footerDiv);
    document.body.appendChild(center);
})();