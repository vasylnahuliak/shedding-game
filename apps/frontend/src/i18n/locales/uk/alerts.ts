const alerts = {
  titles: {
    error: 'Помилка',
    sessionExpired: 'Сесія закінчилась',
    copied: 'Скопійовано',
    roomClosed: 'Кімнату закрито',
    gameEnded: 'Гру завершено',
    accessDenied: 'Доступ заборонено',
    roomUnavailable: 'Кімната недоступна',
    leaveGameConfirm: 'Покинути гру?',
    leaveRoomConfirm: 'Покинути кімнату?',
    closeRoomConfirm: 'Закрити кімнату?',
    youWereKicked: 'Вас видалено',
    roomFull: 'Кімната повна',
    roundMultiplier: 'Множник раунду',
    deadlockResolved: 'Тупик розвʼязано',
  },
  messages: {
    sessionExpired: 'Будь ласка, увійдіть знову',
    emojiSaveFailed: 'Не вдалося зберегти емоджі',
    copyInviteLinkSuccess: 'Посилання скопійовано в буфер обміну',
    copyDebugDataSuccess: 'Debug дані скопійовано в буфер обміну',
    gameEndedByHost: 'Хост завершив гру',
    gameAccessDenied: 'У вас немає доступу до цієї гри',
    roomJoinFailed: 'Не вдалося увійти до кімнати.',
    roomCreateFailed: 'Не вдалося створити кімнату.',
    roomLeaveFailed: 'Не вдалося покинути кімнату',
    roomIsFull: 'Неможливо увійти, всі місця зайняті.',
    roomNoLongerActiveShort:
      'Кімната більше неактивна (гра вже почалась або кімнату закрито). Оберіть іншу кімнату.',
    roomNoLongerActiveLong:
      'Кімната більше неактивна (гра вже почалась або кімнату закрито), тому вас повернуто до списку кімнат.',
    roomNoLongerActiveDetailPrefix: 'Деталі',
    kickedByHost: 'Хост видалив вас з кімнати',
    kickedByTurnTimeout: 'Вас видалено з гри через неактивність на ході',
    lobbyJoinFailed: 'Не вдалося приєднатися до кімнати',
    lobbyRoomFull: 'Ця кімната вже повна. Ви не можете потрапити до неї.',
    leaveGameHost: 'Вам буде зараховано поразку. Бот дограє за вас, а новий хост керуватиме грою.',
    leaveGamePlayer: 'Вам буде зараховано поразку.',
    deadlockResolvedFallback:
      'Сталася тупикова ситуація. Гра автоматично продовжилась після пропуску заблокованого ходу.',
    closeRoomConfirm: 'Кімнату буде закрито для всіх гравців',
    leaveRoomConfirm: 'Ви вийдете з цієї кімнати',
  },
  actions: {
    leave: 'Покинути',
    close: 'Закрити',
  },
  errorBoundary: {
    title: 'Щось пішло не так',
    fallback: 'Сталася неочікувана помилка',
  },
} as const;

export default alerts;
