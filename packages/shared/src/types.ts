export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type UserType = 'human' | 'bot';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 'waiting' | 'playing' | 'round_over' | 'finished';
export type GamePace = 'debug' | 'quick' | 'long';

export type DebugMode =
  | 'none'
  | 'one_six_four_jacks'
  | 'one_jack_four_sevens'
  | 'one_jack_four_eights'
  | 'one_jack_four_sixes'
  | 'one_jack_four_kings'
  | 'one_jack_four_aces';

export interface PublicUser {
  id: string;
  email: string;
}
