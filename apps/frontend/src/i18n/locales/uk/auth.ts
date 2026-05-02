const auth = {
  account: {
    titles: {
      methodChoice: 'Оберіть спосіб входу',
      emailEntry: 'Вхід через email',
      emailSent: 'Перевірте email',
      passwordFallback: 'Вхід через пароль',
      profile: 'Завершіть профіль',
      register: 'Створіть акаунт',
      login: 'Вхід в акаунт',
      forgotPassword: 'Скидання пароля',
      resetPassword: 'Вкажіть новий пароль',
    },
    badges: {
      methodChoice: 'Швидкий вхід',
      emailEntry: 'Magic link',
      emailSent: 'Перевірте пошту',
      passwordFallback: 'Вхід через пароль',
      profile: 'Останній крок',
      forgotPassword: 'Відновлення доступу',
      resetPassword: 'Новий пароль',
    },
    subtitles: {
      methodChoice: 'Оберіть найзручніший спосіб, щоб продовжити гру',
      emailEntry: 'Надішлемо безпечне посилання для входу на цю адресу.',
      emailSent:
        'Якщо цей email можна використати для входу, ми надіслали посилання. Відкрийте його на цьому пристрої, щоб продовжити.',
      passwordFallback: 'Використайте email і пароль, якщо вже додавали пароль до цього акаунта.',
      profile: 'Вкажіть ігрове імʼя для завершення авторизації',
      register: 'Реєстрація через email та пароль',
      login: 'Увійдіть, щоб продовжити гру',
      forgotPassword: 'Вкажіть email, і ми надішлемо інструкції для скидання',
      resetPassword: 'Створіть новий пароль для свого акаунта',
    },
    tabs: {
      login: 'Вхід',
      register: 'Реєстрація',
    },
    divider: 'або через email',
  },
  form: {
    labels: {
      displayName: "Ігрове ім'я",
      email: 'Email',
      password: 'Пароль',
      confirmPassword: 'Підтвердіть пароль',
      newPassword: 'Новий пароль',
      confirmNewPassword: 'Підтвердіть новий пароль',
    },
    actions: {
      showPassword: 'Показати пароль',
      hidePassword: 'Сховати пароль',
    },
    placeholders: {
      displayName: "Введіть ім'я...",
      password: 'Мінімум 8 символів',
      confirmPassword: 'Повторіть пароль',
      email: 'you@example.com',
      newPassword: 'Мінімум 8 символів',
      confirmNewPassword: 'Повторіть новий пароль',
    },
  },
  hints: {
    passwordMin: 'Пароль: мінімум {{count}} символів',
    passwordLeft: 'Ще {{count}} символ(ів) до мінімуму',
    passwordValid: 'Пароль підходить',
    passwordNeedAtLeast: 'Пароль має містити щонайменше {{count}} символів',
    passwordResetPrivacy:
      'Якщо акаунт для цього email існує, ми надішлемо інструкції для скидання пароля.',
  },
  messages: {
    emailSignInLinkSent:
      'Якщо {{email}} можна використати для входу, ми надіслали посилання. Відкрийте його на цьому пристрої, щоб продовжити.',
    passwordResetEmailSent:
      'Якщо акаунт для цього email існує, ми надіслали інструкції для скидання пароля.',
  },
  actions: {
    email: 'Продовжити з Email',
    apple: 'Продовжити з Apple',
    login: 'Увійти',
    google: 'Продовжити з Google',
    register: 'Зареєструватися',
    chooseAnotherMethod: 'Обрати інший спосіб',
    sendSignInLink: 'Надіслати посилання',
    resendSignInLink: 'Надіслати ще раз',
    useAnotherEmail: 'Використати інший email',
    usePasswordInstead: 'Увійти через пароль',
    completeProfile: 'Завершити профіль',
    forgotPassword: 'Забули пароль?',
    sendResetLink: 'Надіслати посилання',
    updatePassword: 'Оновити пароль',
    backToLogin: 'Повернутися до входу через пароль',
    cancelPasswordRecovery: 'Скасувати і увійти знову',
    forceLogout: 'Вийти з акаунта',
    loading: {
      apple: 'Відкриваємо Apple...',
      emailLink: 'Надсилаємо посилання...',
      login: 'Вхід...',
      google: 'Відкриваємо Google...',
      register: 'Реєстрація...',
      profile: 'Збереження...',
      forgotPassword: 'Надсилання...',
      resetPassword: 'Оновлення пароля...',
    },
  },
  footer: {
    text: 'Готові скинути карти?',
    legalNotice: 'Продовжуючи, ви погоджуєтеся з умовами сервісу.',
    legalSeparator: 'та',
  },
} as const;

export default auth;
