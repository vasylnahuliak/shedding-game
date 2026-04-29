const rooms = {
  screen: {
    title: 'Game Rooms',
    subtitle: 'Join an existing room\nor create your own game',
    availableRooms: 'Available rooms',
  },
  units: {
    players_one: '{{count}} player',
    players_few: '{{count}} players',
    players_many: '{{count}} players',
    players_other: '{{count}} players',
  },
  roomList: {
    loading: 'Loading rooms...',
    activeGameBadge: 'Active game',
    activeGameMeta: '{{players}} • Game in progress',
    waitingMeta: 'Waiting for players',
    fullMeta: 'Room is full',
    emptyTitle: 'No active rooms',
    emptyDescription: 'Create a new room to start playing with friends',
  },
  createRoom: {
    title: 'New room',
    subtitle: 'Create a room to play with friends',
    roomNameLabel: 'Room name',
    roomNameDefault: '{{name}}',
    gamePaceLabel: 'Game pace',
    gamePaceHint: 'Tap the emoji to choose a pace and see the maximum turn time.',
    gamePaceOpenDetails: 'Details',
    gamePacePickerTitle: 'Choose a game pace',
    gamePacePickerSubtitle: 'Each option below shows the maximum time allowed for one turn.',
    createLoading: 'Creating...',
  },
  statistics: {
    title: '📊 Statistics',
    gamesPlayed: 'Games played',
    wins: 'Wins',
    losses: 'Losses',
    winRate: 'Win rate',
    gamesTitle: 'Games ({{count}})',
    emptyTitle: 'No games yet',
    emptyDescription: 'Play a game to see your history, wins, and win rate here.',
    noData: 'No data',
  },
  notices: {
    roomInactiveBase:
      'This room is no longer active (the game has started or the room was closed), so you were returned to the rooms list.',
    detailPrefix: 'Details',
  },
  debugModes: {
    none: 'None',
    configTitle: 'Debug mode',
    configSubtitle: 'Advanced options for game logic testing.',
  },
  gamePaces: {
    debug: {
      title: 'Debug',
      description: 'Very short timers for local testing, timeout checks, and UI verification.',
    },
    quick: {
      title: 'Quick',
      description: 'Standard live-game pace. This matches the current default timing.',
    },
    long: {
      title: 'Long',
      description: 'Relaxed pace for games where players may step away and return later.',
    },
  },
  gamePaceDetails: {
    selectedBadge: 'Selected',
    maxTurn: 'Maximum time per turn: {{maxTurn}}',
    roomTitle: 'Room pace',
    roomSubtitle: 'See how much time a player can spend on one turn.',
    openLabel: 'Show {{pace}} pace details',
  },
} as const;

export default rooms;
