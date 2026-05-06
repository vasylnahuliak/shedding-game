import { adminDebug } from '../shared/adminDebug';

const admin = {
  screen: {
    title: 'Адмін-панель',
  },
  home: {
    sections: {
      games: {
        title: 'Ігри',
        hint: 'Перегляд повного списку ігор на сервері з фільтрами та пагінацією.',
        ctaTitle: 'Відкрити список ігор',
        ctaDescription: 'Подивитися активні, незапущені та закриті ігри в одному місці.',
      },
      users: {
        title: 'Користувачі',
        hint: 'Пошук користувачів застосунку та перегляд їхньої історії ігор.',
        ctaTitle: 'Відкрити користувачів',
        ctaDescription: 'Знайти користувача, переглянути дані акаунта та його ігри.',
      },
      accountDeletionRequests: {
        title: 'Запити на видалення акаунта',
        hint: 'Перегляд запитів, надісланих із публічної форми видалення акаунта.',
        ctaTitle: 'Відкрити запити',
        ctaDescription: 'Переглянути вхідні запити на видалення з веб-форми.',
      },
    },
  },
  gamesScreen: {
    title: 'Усі ігри',
    loading: 'Завантаження списку ігор...',
    allGames: 'Усі ігри ({{count}})',
    emptyTitle: 'Немає ігор',
    emptyDescription: 'На сервері ще немає жодної кімнати або гри.',
  },
  usersScreen: {
    title: 'Користувачі',
    loading: 'Завантаження користувачів...',
    allUsers: 'Користувачі ({{count}})',
    searchLabel: 'Пошук',
    searchPlaceholder: 'Імʼя або email',
    emptyTitle: 'Немає користувачів',
    emptyDescription: 'У застосунку ще немає користувачів.',
    emptySearchTitle: 'Нічого не знайдено',
    emptySearchDescription: 'Жоден користувач не відповідає цьому пошуку.',
  },
  userGamesScreen: {
    title: 'Історія користувача',
    loading: 'Завантаження історії користувача...',
    statsTitle: 'Статистика',
    gamesTitle: 'Ігри ({{count}})',
    emptyTitle: 'Немає ігор',
    emptyDescription: 'Цей користувач ще не грав жодної гри.',
  },
  requestsScreen: {
    title: 'Запити на видалення',
    loading: 'Завантаження запитів на видалення...',
    allRequests: 'Запити на видалення ({{count}})',
    emptyTitle: 'Запитів ще немає',
    emptyDescription: 'З публічної веб-форми ще не надходили запити на видалення акаунта.',
  },
  status: {
    closed: 'Закрита',
    waiting: 'Очікування',
    playing: 'Гра триває',
    roundOver: 'Кінець раунду',
    finished: 'Завершена',
  },
  filters: {
    openA11y: 'Відкрити фільтри',
    title: 'Фільтри',
    sectionPlayerType: 'Тип гравців',
    sectionGameStatus: 'Статус гри',
    playerType: {
      all: 'Усі типи',
      humansOnly: 'Тільки з людьми',
      botsOnly: 'Тільки з ботами',
    },
    gameStatus: {
      all: 'Усі статуси',
      startedOnly: 'Тільки запущені',
      unstartedOnly: 'Лише очікування',
    },
  },
  card: {
    playersCount_one: '{{count}} гравець',
    playersCount_few: '{{count}} гравці',
    playersCount_many: '{{count}} гравців',
    playersCount_other: '{{count}} гравців',
    rounds: 'Раундів: {{count}}',
    createdAt: 'Створено: {{value}}',
    startedAt: 'Початок: {{value}}',
    closedAt: 'Закрито: {{value}}',
    duration: 'Тривалість партії: {{value}}',
    winner: '🏆 Переможець: {{name}}',
    noWinner: '—',
    points: '{{count}} очок',
    durationMinutes: '{{minutes}} хв {{seconds}} с',
    durationSeconds: '{{seconds}} с',
  },
  requestsCard: {
    submittedAt: 'Надіслано: {{value}}',
    requestId: 'ID запиту: {{value}}',
    locale: 'Мова: {{value}}',
    userId: 'ID користувача: {{value}}',
    displayName: 'Імʼя в застосунку: {{value}}',
    notesLabel: 'Нотатки',
    sources: {
      publicWebForm: 'Веб-форма',
    },
  },
  usersCard: {
    email: 'Email: {{value}}',
    userId: 'ID користувача: {{value}}',
    locale: 'Мова: {{value}}',
    createdAt: 'Створено: {{value}}',
    updatedAt: 'Оновлено: {{value}}',
    gameHistory: 'Історія ігор',
    roles: {
      player: 'Гравець',
      admin: 'Адмін',
      super_admin: 'Суперадмін',
    },
  },
  debug: adminDebug,
} as const;

export default admin;
