\n" to the page and run it, or execute it in your browser's developer console.

source code:
(function() {
  const extractText = (el, selector) => el && el.querySelector(selector) ? el.querySelector(selector).innerText.trim() : '';
  const extractHref = (el, selector) => el && el.querySelector(selector) ? el.querySelector(selector).href : '';

  const navEls = document.querySelectorAll('#sidebar-main-menu a');
  const navLinks = [];
  const seen = new Set();
  
  navEls.forEach(a => {
    const text = a.innerText.trim();
    if (text && !seen.has(text) && text !== 'Skip to content') {
      seen.add(text);
      navLinks.push({ text: text, href: a.href });
    }
  });

  const heroTitle = document.querySelector('.landing-page-hero-title')?.innerText || '';
  const heroSub = document.querySelector('.landing-page-hero-subtitle')?.innerText || '';
  const heroBtn = document.querySelector('.landing-page-hero-buttons a');
  const heroLink = heroBtn ? { text: heroBtn.innerText.trim(), href: heroBtn.href } : null;

  const featureEls = document.querySelectorAll('.landing-page-feature-content-inner');
  const features = Array.from(featureEls).map(f => ({
    title: extractText(f, '.landing-page-feature-title'),
    sub: extractText(f, '.landing-page-feature-subtitle'),
    btnText: extractText(f, 'a'),
    btnHref: extractHref(f, 'a')
  })).filter(f => f.title);

  const cardEls = document.querySelectorAll('.landing-page-content-card');
  const articles = Array.from(cardEls).map(c => ({
    title: extractText(c, '.landing-page-content-card-title'),
    author: extractText(c, '.landing-page-content-author'),
    href: extractHref(c, 'a')
  })).filter(a => a.title);

  const footerEls = document.querySelectorAll('#navigation-footer a');
  const footerLinks = [];
  const fSeen = new Set();
  footerEls.forEach(a => {
    const text = a.innerText.trim() || a.getAttribute('aria-label');
    if (text && !fSeen.has(text)) {
      fSeen.add(text);
      footerLinks.push({ text: text, href: a.href });
    }
  });

  document.documentElement.innerHTML = '<head><title>Chess.com - Web 1.0</title></head><body></body>';
  const body = document.body;

  body.style.fontFamily = 'serif';
  body.style.lineHeight = '1.4';
  body.style.maxWidth = '800px';
  body.style.margin = '0 auto';
  body.style.padding = '10px';
  body.style.color = 'black';
  body.style.backgroundColor = 'white';

  const createMenu = (links, showCount) => {
    const container = document.createElement('div');
    const main = links.slice(0, showCount);
    const extra = links.slice(showCount);

    main.forEach((l, i) => {
      const a = document.createElement('a');
      a.href = l.href;
      a.innerText = l.text;
      container.appendChild(a);
      if (i < main.length - 1) container.appendChild(document.createTextNode(' | '));
    });

    if (extra.length > 0) {
      const details = document.createElement('details');
      details.style.display = 'inline';
      
      const summary = document.createElement('summary');
      summary.innerText = '[Show more...]';
      summary.style.cursor = 'pointer';
      details.appendChild(summary);

      const extraSpan = document.createElement('span');
      extraSpan.appendChild(document.createTextNode(' | '));
      extra.forEach((l, i) => {
        const a = document.createElement('a');
        a.href = l.href;
        a.innerText = l.text;
        extraSpan.appendChild(a);
        if (i < extra.length - 1) extraSpan.appendChild(document.createTextNode(' | '));
      });
      
      details.appendChild(extraSpan);
      container.appendChild(document.createTextNode(' | '));
      container.appendChild(details);
    }
    return container;
  };

  const header = document.createElement('h1');
  header.innerText = 'Chess.com';
  body.appendChild(header);
  body.appendChild(createMenu(navLinks, 6));
  body.appendChild(document.createElement('hr'));

  if (heroTitle) {
    const h2 = document.createElement('h2');
    h2.innerText = heroTitle;
    body.appendChild(h2);

    if (heroSub) {
      const p = document.createElement('p');
      p.innerText = heroSub;
      body.appendChild(p);
    }

    if (heroLink) {
      const btn = document.createElement('a');
      btn.href = heroLink.href;
      btn.innerHTML = '<b>[' + heroLink.text + ']</b>';
      body.appendChild(btn);
      body.appendChild(document.createElement('br'));
      body.appendChild(document.createElement('br'));
    }
  }

  if (features.length > 0) {
    body.appendChild(document.createElement('hr'));
    features.forEach(f => {
      const h3 = document.createElement('h3');
      h3.innerText = f.title;
      body.appendChild(h3);

      const p = document.createElement('p');
      p.innerText = f.sub;
      body.appendChild(p);

      if (f.btnHref) {
        const a = document.createElement('a');
        a.href = f.btnHref;
        a.innerText = '> ' + f.btnText;
        body.appendChild(a);
        body.appendChild(document.createElement('br'));
      }
    });
  }

  if (articles.length > 0) {
    body.appendChild(document.createElement('hr'));
    const h2 = document.createElement('h2');
    h2.innerText = 'Latest Chess News';
    body.appendChild(h2);

    const ul = document.createElement('ul');
    articles.forEach(a => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.href;
      link.innerText = a.title;
      li.appendChild(link);
      li.appendChild(document.createTextNode(' - by ' + a.author));
      ul.appendChild(li);
    });
    body.appendChild(ul);
  }

  body.appendChild(document.createElement('br'));
  body.appendChild(document.createElement('hr'));
  
  const footerLabel = document.createElement('b');
  footerLabel.innerText = 'Site Links & Footer: ';
  body.appendChild(footerLabel);
  body.appendChild(document.createElement('br'));
  body.appendChild(createMenu(footerLinks, 5));
})();