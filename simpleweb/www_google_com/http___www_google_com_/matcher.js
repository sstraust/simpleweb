
(function() {
    var hasForm = document.querySelector('form') !== null;
    var hasSearchInput = document.querySelector('[name="q"]') !== null;
    var hasSearchButtons = document.querySelector('[name="btnK"], [name="btnI"]') !== null;
    var hasNavOrFooterLinks = document.querySelector('a.w5hRs, a.gb_6, a.gb_A, .pHiOh') !== null;

    return hasForm && hasSearchInput && hasSearchButtons && hasNavOrFooterLinks;
})();