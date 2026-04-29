const rooms = {
  screen: {
    title: 'Ігрові кімнати',
    subtitle: 'Приєднайтесь до існуючої кімнати\nабо створіть свою власну гру',
    availableRooms: 'Доступні кімнати',
  },
  units: {
    players_one: '{{count}} гравець',
    players_few: '{{count}} гравці',
    players_many: '{{count}} гравців',
    players_other: '{{count}} гравців',
  },
  roomList: {
    loading: 'Завантаження кімнат...',
    activeGameBadge: 'Активна гра',
    activeGameMeta: '{{players}} • Гра триває',
    waitingMeta: 'Очікування гравців',
    fullMeta: 'Кімната повна',
    emptyTitle: 'Немає активних кімнат',
    emptyDescription: 'Створіть нову кімнату, щоб почати гру з друзями',
  },
  createRoom: {
    title: 'Нова кімната',
    subtitle: 'Створіть кімнату для гри з друзями',
    roomNameLabel: 'Назва кімнати',
    roomNameDefault: '{{name}}',
    gamePaceLabel: 'Темп гри',
    gamePaceHint: 'Натисніть на емодзі, щоб обрати темп і побачити максимум часу на хід.',
    gamePaceOpenDetails: 'Деталі',
    gamePacePickerTitle: 'Оберіть темп гри',
    gamePacePickerSubtitle: 'Кожен варіант нижче показує, скільки максимум триває один хід.',
    createLoading: 'Створення...',
  },
  statistics: {
    title: '📊 Статистика',
    gamesPlayed: 'Зіграно ігор',
    wins: 'Перемоги',
    losses: 'Поразки',
    winRate: 'Відсоток перемог',
    gamesTitle: 'Ігри ({{count}})',
    emptyTitle: 'Ще немає ігор',
    emptyDescription: 'Зіграйте партію, щоб тут з’явилися історія, перемоги та вінрейт.',
    noData: 'Немає даних',
  },
  notices: {
    roomInactiveBase:
      'Кімната більше неактивна (гра вже почалась або кімнату закрито), тому вас повернуто до списку кімнат.',
    detailPrefix: 'Деталі',
  },
  debugModes: {
    none: 'None',
    configTitle: 'Режим відлагодження',
    configSubtitle: 'Розширені опції для тестування логіки гри.',
  },
  gamePaces: {
    debug: {
      title: 'Тест',
      description: 'Дуже короткий темп для локального тестування.',
    },
    quick: {
      title: 'Швидка',
      description: 'Стандартний темп для звичайної live-гри.',
    },
    long: {
      title: 'Довга',
      description: 'Спокійний темп для партій, де гравці можуть відповідати значно пізніше.',
    },
  },
  gamePaceDetails: {
    selectedBadge: 'Обрано',
    maxTurn: 'Максимум часу на хід: {{maxTurn}}',
    roomTitle: 'Темп цієї кімнати',
    roomSubtitle: 'Подивіться, скільки максимум часу є на один хід.',
    openLabel: 'Показати опис темпу {{pace}}',
  },
} as const;

export default rooms;
