import type { ReactionType } from '@shedding-game/shared';
import { create } from 'zustand';

type EmojiReactionState = {
  editingReactionType: ReactionType | null;
};

type EmojiReactionStore = EmojiReactionState & {
  setEditingReactionType: (reactionType: ReactionType | null) => void;
  openEmojiPicker: (reactionType: ReactionType) => void;
  closeEmojiPicker: () => void;
  reset: () => void;
};

const initialState: EmojiReactionState = {
  editingReactionType: null,
};

export const useEmojiReactionStore = create<EmojiReactionStore>((set) => ({
  ...initialState,
  setEditingReactionType: (reactionType) => set({ editingReactionType: reactionType }),
  openEmojiPicker: (reactionType) => set({ editingReactionType: reactionType }),
  closeEmojiPicker: () => set({ editingReactionType: null }),
  reset: () => set(initialState),
}));
