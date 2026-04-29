const lobby = {
  screen: {
    roomNotFound: 'Room not found',
    roomLoading: 'Loading...',
    playersSection: 'Players',
    waitingHost: 'Waiting for host...',
    renameTitle: 'Rename room',
    renameBotTitle: 'Rename bot',
    renamePlaceholder: 'Enter room name',
  },
  actions: {
    addBot: 'Add bot',
    startGame: 'Start game',
  },
  infoModal: {
    title: 'About lobby',
    tips: [
      'The player who creates the room is the host. The host can remove other players from the room.',
      'The host can reorder players. Press and hold, then drag.',
      'The first player in the list goes first in round one.',
      'There is a button to the left of the room name to copy the game link.',
      'Minimum 2 players, maximum 4 players per room.',
      'The host can add and remove bots. It is a great way for beginners to practice the rules.',
      'If the host leaves the room via ❌, the room closes for everyone.',
      'If the host leaves the game via ❌, the game ends for everyone.',
      'When the game ends, the host can automatically create a room with the same players.',
      'A room is closed if there are no actions for {{hours}} {{hoursLabel}}.',
    ],
  },
  invite: {
    shareMessage: 'Join the game! {{url}}',
  },
  playerCard: {
    host: 'Host',
    bot: 'Bot',
    human: 'Human',
    online: 'Online',
    offline: 'Offline',
  },
  botRename: {
    subtitle: 'Choose a name from the list. Custom names are disabled.',
    current: 'Current',
    empty: 'No bot names are available.',
    saveFailed: 'Failed to rename bot.',
  },
  emptySlot: {
    label: 'Empty slot',
  },
} as const;

export default lobby;
