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
      users: {
        title: 'Users',
        hint: 'Search app users and inspect their game history.',
        ctaTitle: 'Open users',
        ctaDescription: 'Find a user, review account details, and open their games.',
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
  usersScreen: {
    title: 'Users',
    loading: 'Loading users...',
    allUsers: 'Users ({{count}})',
    searchLabel: 'Search',
    searchPlaceholder: 'Name or email',
    emptyTitle: 'No users',
    emptyDescription: 'There are no users in the app yet.',
    emptySearchTitle: 'No matches',
    emptySearchDescription: 'No users match this search.',
  },
  userGamesScreen: {
    title: 'User History',
    loading: 'Loading user history...',
    statsTitle: 'Stats',
    gamesTitle: 'Games ({{count}})',
    emptyTitle: 'No games',
    emptyDescription: 'This user has not played any games yet.',
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
  usersCard: {
    email: 'Email: {{value}}',
    userId: 'User ID: {{value}}',
    locale: 'Locale: {{value}}',
    createdAt: 'Created: {{value}}',
    updatedAt: 'Updated: {{value}}',
    gameHistory: 'Game history',
    roles: {
      player: 'Player',
      admin: 'Admin',
      super_admin: 'Super admin',
    },
  },
  debug: adminDebug,
} as const;

export default admin;
