
(function() {
  const hasSidebarMenu = document.querySelector('#sidebar-main-menu a') !== null;
  const hasHeroTitle = document.querySelector('.landing-page-hero-title') !== null;
  const hasFeatures = document.querySelector('.landing-page-feature-content-inner') !== null;
  const hasContentCards = document.querySelector('.landing-page-content-card') !== null;
  const hasFooter = document.querySelector('#navigation-footer a') !== null;

  return hasSidebarMenu && hasHeroTitle && hasFeatures && hasContentCards && hasFooter;
})();