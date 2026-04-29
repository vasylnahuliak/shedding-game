import { adminDebug } from '../shared/adminDebug';

const admin = {
  screen: {
    title: 'Admin Panel',
  },
  home: {
    sections: {
      games: {
        title: 'Games',
        hint: 'Browse the full server-side game list with filters and pagination.',
        ctaTitle: 'Open game list',
        ctaDescription: 'See active, waiting, and closed games in one place.',
      },
      accountDeletionRequests: {
        title: 'Account deletion requests',
        hint: 'Review requests submitted from the public account deletion form.',
        ctaTitle: 'Open deletion requests',
        ctaDescription: 'Inspect incoming deletion requests from the web form.',
      },
    },
  },
  gamesScreen: {
    title: 'All Games',
    loading: 'Loading game list...',
    allGames: 'All games ({{count}})',
    emptyTitle: 'No games',
    emptyDescription: 'There are no rooms or games on the server yet.',
  },
  requestsScreen: {
    title: 'Deletion Requests',
    loading: 'Loading deletion requests...',
    allRequests: 'Deletion requests ({{count}})',
    emptyTitle: 'No requests yet',
    emptyDescription: 'No one has submitted an account deletion request from the web form yet.',
  },
  status: {
    closed: 'Closed',
    waiting: 'Waiting',
    playing: 'In progress',
    roundOver: 'Round over',
    finished: 'Finished',
  },
  filters: {
    openA11y: 'Open filters',
    title: 'Filters',
    sectionPlayerType: 'Player type',
    sectionGameStatus: 'Game status',
    playerType: {
      all: 'All types',
      humansOnly: 'Humans only',
      botsOnly: 'Bots only',
    },
    gameStatus: {
      all: 'All statuses',
      startedOnly: 'Started only',
      unstartedOnly: 'Waiting only',
    },
  },
  card: {
    playersCount_one: '{{count}} player',
    playersCount_few: '{{count}} players',
    playersCount_many: '{{count}} players',
    playersCount_other: '{{count}} players',
    rounds: 'Rounds: {{count}}',
    createdAt: 'Created: {{value}}',
    startedAt: 'Started: {{value}}',
    closedAt: 'Closed: {{value}}',
    duration: 'Game duration: {{value}}',
    winner: '🏆 Winner: {{name}}',
    noWinner: '—',
    points: '{{count}} points',
    durationMinutes: '{{minutes}}m {{seconds}}s',
    durationSeconds: '{{seconds}}s',
  },
  requestsCard: {
    submittedAt: 'Submitted: {{value}}',
    requestId: 'Request ID: {{value}}',
    locale: 'Locale: {{value}}',
    userId: 'User ID: {{value}}',
    displayName: 'Display name: {{value}}',
    notesLabel: 'Notes',
    sources: {
      publicWebForm: 'Web form',
    },
  },
  debug: adminDebug,
} as const;

export default admin;
