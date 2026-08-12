
function canApplyModifier(input) {
    let doc;
    
    // Handle different input types: raw HTML string, Document object, or fallback to the global document
    if (typeof input === 'string') {
        doc = new DOMParser().parseFromString(input, 'text/html');
    } else if (input && input.nodeType === 9) { 
        doc = input;
    } else if (typeof document !== 'undefined') {
        doc = document;
    } else {
        return false;
    }

    // Check for the foundational search form structure
    const hasSearchForm = !!doc.querySelector('form[action="/search"]');
    const hasQueryInput = !!doc.querySelector('[name="q"]');
    
    // Check for Google Search specific proprietary CSS classes targeted by the modifier
    const hasGoogleResults = !!doc.querySelector('.MjjYud');
    const hasGoogleTitles = !!doc.querySelector('h3.LC20lb');
    const hasGoogleNav = !!doc.querySelector('a.C6AK7c, .h5JSWd a');

    // Highly cautious evaluation: Must have the search input form and at least one primary structural hook
    return hasSearchForm && hasQueryInput && (hasGoogleResults || hasGoogleTitles || hasGoogleNav);
}

// Support for direct browser concatenation: evaluates the current page and stores the boolean
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.isModifierApplicable = canApplyModifier(document);
}