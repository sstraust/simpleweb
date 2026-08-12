
(function() {
  // 1. Extract the search query
  const queryInput = document.querySelector('input[name="q"]');
  const query = queryInput ? queryInput.value : '';

  // 2. Extract toolbar options (Region and Time)
  const regionSelect = document.querySelector('select[name="kl"]');
  const timeSelect = document.querySelector('select[name="df"]');

  // 3. Extract the main content (Search Results)
  const results = [];
  const resultNodes = document.querySelectorAll('.result');
  
  resultNodes.forEach(node => {
    const titleA = node.querySelector('.result__title a');
    if (!titleA) return;
    
    // Attempt to parse out the real URL from the DuckDuckGo tracker link
    const rawHref = titleA.getAttribute('href');
    let realHref = rawHref;
    try {
      const params = new URLSearchParams(rawHref.split('?')[1]);
      if (params.has('uddg')) {
        realHref = decodeURIComponent(params.get('uddg'));
      }
    } catch(e) {}

    const snippetNode = node.querySelector('.result__snippet');
    const urlNode = node.querySelector('.result__url');

    results.push({
      title: titleA.innerText.trim(),
      href: realHref,
      snippet: snippetNode ? snippetNode.innerText.trim() : '',
      url: urlNode ? urlNode.innerText.trim() : ''
    });
  });

  // 4. Extract subcontent (Pagination Form)
  const navForm = document.querySelector('.nav-link form');
  let navHtml = '';
  if (navForm) {
    navHtml = '<form action="/html/" method="post">';
    navForm.querySelectorAll('input').forEach(inp => {
      navHtml += `<input type="${inp.type}" name="${inp.name}" value="${inp.value}">\n`;
    });
    navHtml += '</form>';
  }

  // 5. Build Folded Region Toolbar 
  // Displays the first 5 options inline, folds the rest to prevent taking up the whole screen in eww
  let regionHTML = '';
  if (regionSelect) {
    const opts = Array.from(regionSelect.querySelectorAll('option'));
    const firstOpts = opts.slice(0, 5);
    const restOpts = opts.slice(5);

    regionHTML += `<b>Region:</b> `;
    firstOpts.forEach(o => {
      const checked = o.selected ? 'checked' : '';
      regionHTML += `<label><input type="radio" name="kl" value="${o.value}" ${checked}> ${o.innerText}</label> `;
    });
    
    if (restOpts.length > 0) {
      regionHTML += `
      <details style="display:inline; margin-left: 15px;">
        <summary style="cursor:pointer; font-weight:bold;">[ Show more regions ]</summary>
        <div style="margin-top: 10px; padding: 10px; border: 1px solid #000;">`;
      restOpts.forEach(o => {
        const checked = o.selected ? 'checked' : '';
        regionHTML += `<label style="display:inline-block; width:180px;"><input type="radio" name="kl" value="${o.value}" ${checked}> ${o.innerText}</label> `;
      });
      regionHTML += `</div></details>`;
    }
  }

  // 6. Build Time Toolbar
  let timeHTML = '';
  if (timeSelect) {
    timeHTML += `<b>Time:</b> <select name="df">`;
    timeSelect.querySelectorAll('option').forEach(o => {
      const selected = o.selected ? 'selected' : '';
      timeHTML += `<option value="${o.value}" ${selected}>${o.innerText}</option>`;
    });
    timeHTML += `</select>`;
  }

  // 7. Assemble the new Web 1.0 style DOM
  const newDoc = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>DDG Search: ${query}</title>
    <meta charset="utf-8">
  </head>
  <body style="font-family: monospace, sans-serif; max-width: 900px; margin: 0 auto; padding: 10px; color: #000; background: #fff;">

    <!-- TOP TOOLBAR -->
    <div id="header">
      <h1 style="margin: 0 0 10px 0; border-bottom: 2px solid #000;">[ DuckDuckGo ]</h1>
      <form action="/html/" method="post">
        <b>Search:</b> <input type="text" name="q" value="${query}" size="50">
        <input type="submit" value="Search"><br><br>
        ${regionHTML}<br><br>
        ${timeHTML}
      </form>
    </div>
    
    <hr style="border: 1px solid #000; margin: 20px 0;">

    <!-- MAIN CONTENT -->
    <div id="content">
      <h2>Search Results</h2>
      <ol style="padding-left: 0; list-style-type: none;">
        ${results.map((r, i) => `
          <li style="margin-bottom: 25px;">
            <h3 style="margin: 0; font-size: 1.2em;">
              ${i+1}. <a href="${r.href}" style="color: #0000ee; text-decoration: none;"><u>${r.title}</u></a>
            </h3>
            <p style="margin: 5px 0 5px 20px;">${r.snippet}</p>
            <div style="margin-left: 20px; color: #006600; font-size: 0.9em;">[ ${r.url} ]</div>
          </li>
        `).join('')}
      </ol>
    </div>

    <!-- SUBCONTENT: PAGINATION -->
    <div id="subcontent" style="border-top: 1px dotted #000; padding-top: 15px; margin-top: 20px;">
      <h3>More Results</h3>
      ${navHtml}
    </div>

    <!-- SPAM / ADVERTISEMENTS / FOOTER -->
    <div id="footer" style="margin-top: 40px; padding-top: 10px; border-top: 2px solid #000; font-size: 0.8em; color: #666;">
      <a href="//duckduckgo.com/feedback.html" style="color: #666;">Provide Feedback</a> | 
      <i>Re-rendered for Emacs EWW Web 1.0 specifications</i>
    </div>
  </body>
  </html>
  `;

  // 8. Replace the entire document
  document.open();
  document.write(newDoc);
  document.close();
})();