import { BACKEND_MESSAGE_TEMPLATES } from '@shedding-game/shared';

const errors = {
  auth: {
    unknown: 'Помилка авторизації. Спробуйте ще раз.',
    registerUnknown: 'Помилка реєстрації. Спробуйте ще раз.',
    completeProfileFailed: 'Не вдалося завершити профіль',
    invalidEmail: 'Вкажіть коректний email',
    invalidLoginCredentials: 'Неправильний email або пароль',
    invalidName: 'Вкажіть імʼя гравця',
    usernameTaken: 'Це імʼя вже зайняте',
    passwordMismatch: 'Паролі не збігаються',
    minPassword: 'Пароль має містити мінімум {{count}} символів',
    sessionCreateFailed: 'Не вдалося створити сесію входу',
    profileRequired: 'Потрібно завершити профіль гравця',
    loginFailed: 'Помилка входу',
    registrationNeedsEmailConfirm: 'Реєстрація створена. Підтвердіть email і увійдіть повторно.',
    saveProfileFailed: 'Не вдалося зберегти профіль',
    completeProfileServiceFailed: 'Не вдалося завершити профіль',
    updateProfileFailed: 'Не вдалося оновити профіль',
    deleteAccountFailed: 'Не вдалося видалити акаунт',
    emailLinkRequestFailed: 'Не вдалося надіслати посилання для входу',
    passwordResetRequestFailed: 'Не вдалося надіслати інструкції для скидання пароля',
    passwordResetLinkInvalid: 'Посилання для скидання пароля недійсне або протерміноване',
    passwordResetFailed: 'Не вдалося оновити пароль',
    passwordResetSameAsOld: 'Вкажіть новий пароль, який відрізняється від попереднього',
    passwordResetReauthenticationNeeded:
      'Для зміни пароля потрібне додаткове підтвердження для цієї сесії',
    passwordResetReauthenticationFailed: 'Не вдалося надіслати код підтвердження для зміни пароля',
    passwordResetCodeRequired: 'Введіть код підтвердження з email',
    passwordResetCodeInvalid: 'Код підтвердження недійсний або протермінований',
    passwordResetCancelFailed: 'Не вдалося вийти з режиму скидання пароля',
    providerLinkFailed: 'Не вдалося підключити спосіб входу',
    providerUnlinkFailed: 'Не вдалося відключити спосіб входу',
    providerAlreadyLinked: 'Цей спосіб входу вже підключений до твого акаунта',
    providerLinkingUnavailable: 'Керування способами входу зараз недоступне',
    authMethodNotFound: 'Цей спосіб входу більше недоступний для твого акаунта',
    lastAuthMethodCannotBeRemoved: 'Для цього акаунта має залишатися щонайменше один спосіб входу',
    forceLogoutFailed: 'Не вдалося вийти з акаунта',
  },
  backend: BACKEND_MESSAGE_TEMPLATES.uk,
} as const;

export default errors;
