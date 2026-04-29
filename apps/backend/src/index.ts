// NOTE: Import "instrument" before server bootstrap so Sentry initializes early.
// SOURCE: https://docs.sentry.io/platforms/node/guides/express/
import './instrument';
import './server';
