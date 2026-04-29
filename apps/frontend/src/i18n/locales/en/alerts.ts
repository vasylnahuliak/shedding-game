const alerts = {
  titles: {
    error: 'Error',
    sessionExpired: 'Session expired',
    copied: 'Copied',
    roomClosed: 'Room closed',
    gameEnded: 'Game ended',
    accessDenied: 'Access denied',
    roomUnavailable: 'Room unavailable',
    leaveGameConfirm: 'Leave game?',
    leaveRoomConfirm: 'Leave room?',
    closeRoomConfirm: 'Close room?',
    youWereKicked: 'You were kicked',
    roomFull: 'Room is full',
    roundMultiplier: 'Round multiplier',
    deadlockResolved: 'Deadlock resolved',
  },
  messages: {
    sessionExpired: 'Please sign in again',
    emojiSaveFailed: 'Failed to save emoji',
    copyInviteLinkSuccess: 'Link copied to clipboard',
    copyDebugDataSuccess: 'Debug data copied to clipboard',
    gameEndedByHost: 'Host ended the game',
    gameAccessDenied: 'You do not have access to this game',
    roomJoinFailed: 'Failed to join room.',
    roomCreateFailed: 'Failed to create room.',
    roomLeaveFailed: 'Failed to leave room',
    roomIsFull: 'Cannot join, all seats are taken.',
    roomNoLongerActiveShort:
      'This room is no longer active (the game has started or the room was closed). Please choose another room.',
    roomNoLongerActiveLong:
      'This room is no longer active (the game has started or the room was closed), so you were returned to the rooms list.',
    roomNoLongerActiveDetailPrefix: 'Details',
    kickedByHost: 'Host removed you from the room',
    kickedByTurnTimeout: 'You were removed from the game due to turn inactivity',
    lobbyJoinFailed: 'Failed to join room',
    lobbyRoomFull: 'This room is already full. You cannot join it.',
    leaveGameHost:
      'You will receive a loss. A bot will finish the game for you, and a new host will manage the game.',
    leaveGamePlayer: 'You will receive a loss.',
    deadlockResolvedFallback:
      'A deadlock occurred. The game continued automatically after skipping the blocked turn.',
    closeRoomConfirm: 'The room will be closed for all players',
    leaveRoomConfirm: 'You will leave this room',
  },
  actions: {
    leave: 'Leave',
    close: 'Close',
  },
  errorBoundary: {
    title: 'Something went wrong',
    fallback: 'An unexpected error occurred',
  },
} as const;

export default alerts;
