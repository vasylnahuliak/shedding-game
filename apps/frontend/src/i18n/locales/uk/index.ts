/* jscpd:ignore-start */
import admin from './admin';
import alerts from './alerts';
import auth from './auth';
import common from './common';
import errors from './errors';
import game from './game';
import lobby from './lobby';
import rooms from './rooms';
/* jscpd:ignore-end */

const uk = {
  admin,
  alerts,
  auth,
  common,
  errors,
  game,
  lobby,
  rooms,
} as const;

export default uk;
