const APP_SCHEME = 'sheddinggameapp://';
const DEEP_LINK_PREFIXES = [
  '/lobby',
  '/game',
  '/profile',
  '/profile-settings',
  '/profile-stats',
  '/admin',
];

const path = window.location.pathname;
const search = window.location.search;
const hash = window.location.hash;
const isDeepLinkPath = DEEP_LINK_PREFIXES.some(
  (prefix) => path === prefix || path.startsWith(`${prefix}/`)
);

const launchTarget = isDeepLinkPath
  ? `${APP_SCHEME}${path.replace(/^\/+/, '')}${search}${hash}`
  : APP_SCHEME;

const openButton = document.getElementById('open-app-link');
const status = document.getElementById('deep-link-status');
const pathValue = document.getElementById('deep-link-path');

if (openButton instanceof HTMLAnchorElement) {
  openButton.href = launchTarget;
}

if (status) {
  status.textContent = isDeepLinkPath
    ? 'Open the Shedding Game app to continue with this invite or route.'
    : 'Use the mobile app to play. This website only hosts legal pages and deep-link handoff.';
}

if (pathValue) {
  pathValue.textContent = isDeepLinkPath ? `${path}${search}` : '/';
}

if (isDeepLinkPath) {
  window.setTimeout(() => {
    window.location.assign(launchTarget);
  }, 350);
}
