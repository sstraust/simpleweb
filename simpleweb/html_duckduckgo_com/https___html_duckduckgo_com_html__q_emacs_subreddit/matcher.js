
(function() {
  try {
    const hasDDGForm = document.querySelector('form[action*="/html/"]') !== null;
    const hasQueryInput = document.querySelector('input[name="q"]') !== null;
    const hasResults = document.querySelector('.result') !== null;
    const hasResultTitle = document.querySelector('.result__title a') !== null;
    
    // We also check for elements the script tries to extract optionally but are
    // strong fingerprints of the DuckDuckGo HTML SERP.
    const isDuckDuckGo = document.title.toLowerCase().includes('duckduckgo') || hasDDGForm;

    return Boolean(isDuckDuckGo && hasQueryInput && hasResults && hasResultTitle);
  } catch (err) {
    return false;
  }
})();