import type {
  BackendMessageCode,
  BackendMessageParamsByCode,
  Card,
  Suit,
} from '@shedding-game/shared';

import { DEFAULT_LOCALE, getSuitName, validateMoveRules } from '@shedding-game/shared';

import type { Room } from '@/types';

type MessageParams<Code extends BackendMessageCode> = Exclude<
  BackendMessageParamsByCode[Code],
  undefined
>;

export type GameMoveError = {
  code: BackendMessageCode;
  params?: Record<string, string | number>;
};

const gameError = <Code extends BackendMessageCode>(
  code: Code,
  params?: MessageParams<Code>
): GameMoveError => {
  if (params === undefined) {
    return { code };
  }

  return {
    code,
    params: params,
  };
};

const mapMoveRuleViolationToError = (
  violation: NonNullable<ReturnType<typeof validateMoveRules>>
): GameMoveError => {
  switch (violation.type) {
    case 'cards_required':
      return gameError('GAME_SELECT_CARDS');
    case 'cards_not_in_hand':
      return gameError('GAME_CARDS_NOT_IN_HAND');
    case 'same_rank_only':
      return gameError('GAME_SAME_RANK_ONLY');
    case 'penalty_requires_seven':
      return gameError('GAME_PENALTY_ACTIVE', { count: violation.penaltyCardsCount });
    case 'cannot_finish_with_six':
      return gameError('GAME_CANNOT_FINISH_WITH_SIX');
    case 'chosen_suit_required_for_jack':
      return gameError('GAME_CHOOSE_SUIT_FOR_JACK');
    case 'after_six_restriction':
      return gameError('GAME_AFTER_SIX_RULE', {
        suitName: getSuitName(DEFAULT_LOCALE, violation.requiredSuit),
      });
    case 'opening_turn_rank_only':
      return gameError('GAME_OPENING_TURN_RULE', { rank: violation.requiredRank });
    case 'active_suit_only':
      return gameError('GAME_ACTIVE_SUIT_RULE', {
        suitName: getSuitName(DEFAULT_LOCALE, violation.requiredSuit),
      });
    case 'must_match_rank_or_suit':
      return gameError('GAME_CARD_MUST_MATCH', {
        suitName: getSuitName(DEFAULT_LOCALE, violation.requiredSuit),
        rank: violation.requiredRank,
      });
  }
};

/**
 * Validates a move and returns an error message if invalid, or null if valid.
 */
export const validateMoveWithReason = (
  room: Room,
  playerId: string,
  cards: Card[],
  chosenSuit?: Suit
): GameMoveError | null => {
  if (room.gameStatus !== 'playing') return gameError('GAME_NOT_ACTIVE');

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return gameError('GAME_NOT_YOUR_TURN');
  if (!Array.isArray(cards)) return gameError('GAME_SELECT_CARDS');

  const violation = validateMoveRules({
    hand: currentPlayer.hand,
    cards,
    chosenSuit,
    discardPile: room.discardPile,
    activeSuit: room.activeSuit,
    penaltyCardsCount: room.penaltyCardsCount,
    isOpeningTurn: room.isOpeningTurn,
  });

  if (!violation) return null;

  return mapMoveRuleViolationToError(violation);
};
