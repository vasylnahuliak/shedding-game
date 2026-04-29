import { useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';

import type {
  AnimationItem,
  CardAnimationHandle,
  OpponentDrawItem,
  OpponentPlayCardItem,
  PlayCardItem,
} from './CardAnimationLayer.types';
import { FlyingCard } from './FlyingCard';
import { FlyingCardBack } from './FlyingCardBack';
import { FlyingOpponentPlayCard } from './FlyingOpponentPlayCard';
import { FlyingPlayCard } from './FlyingPlayCard';

let nextId = 0;

/** Creates a done handler that runs the stored callback and removes the item */
function useAnimationDone<T extends { id: string }>(
  completionMap: React.RefObject<Map<string, () => void>>,
  setItems: React.Dispatch<React.SetStateAction<T[]>>
) {
  return (id: string) => {
    completionMap.current.get(id)?.();
    completionMap.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };
}

export function CardAnimationLayer({ ref }: { ref?: React.Ref<CardAnimationHandle> }) {
  const [drawItems, setDrawItems] = useState<AnimationItem[]>([]);
  const [opponentItems, setOpponentItems] = useState<OpponentDrawItem[]>([]);
  const [playItems, setPlayItems] = useState<PlayCardItem[]>([]);
  const [opponentPlayItems, setOpponentPlayItems] = useState<OpponentPlayCardItem[]>([]);
  const completionMap = useRef(new Map<string, () => void>());

  const handleDrawDone = useAnimationDone(completionMap, setDrawItems);
  const handleOpponentDone = useAnimationDone(completionMap, setOpponentItems);
  const handlePlayDone = useAnimationDone(completionMap, setPlayItems);
  const handleOpponentPlayDone = useAnimationDone(completionMap, setOpponentPlayItems);

  useImperativeHandle(ref, () => ({
    animateDrawCard({ card, fromX, fromY, toX, toY, delay = 0, disabled, onComplete }) {
      const id = `draw-${++nextId}`;
      if (onComplete) completionMap.current.set(id, onComplete);
      setDrawItems((prev) => [...prev, { id, card, fromX, fromY, toX, toY, delay, disabled }]);
    },
    animateOpponentDraw({ fromX, fromY, toX, toY, delay = 0, onComplete }) {
      const id = `opp-${++nextId}`;
      if (onComplete) completionMap.current.set(id, onComplete);
      setOpponentItems((prev) => [...prev, { id, fromX, fromY, toX, toY, delay }]);
    },
    animatePlayCard({ card, fromX, fromY, toX, toY, delay = 0, onComplete }) {
      const id = `play-${++nextId}`;
      if (onComplete) completionMap.current.set(id, onComplete);
      setPlayItems((prev) => [...prev, { id, card, fromX, fromY, toX, toY, delay }]);
    },
    animateOpponentPlayCard({ card, fromX, fromY, toX, toY, delay = 0, onComplete }) {
      const id = `opp-play-${++nextId}`;
      if (onComplete) completionMap.current.set(id, onComplete);
      setOpponentPlayItems((prev) => [...prev, { id, card, fromX, fromY, toX, toY, delay }]);
    },
    clearAll() {
      completionMap.current.clear();
      setDrawItems([]);
      setOpponentItems([]);
      setPlayItems([]);
      setOpponentPlayItems([]);
    },
  }));

  return (
    <View style={absoluteFillStyle} pointerEvents="none">
      {drawItems.map((item) => (
        <FlyingCard key={item.id} item={item} onDone={handleDrawDone} />
      ))}
      {opponentItems.map((item) => (
        <FlyingCardBack key={item.id} item={item} onDone={handleOpponentDone} />
      ))}
      {playItems.map((item) => (
        <FlyingPlayCard key={item.id} item={item} onDone={handlePlayDone} />
      ))}
      {opponentPlayItems.map((item) => (
        <FlyingOpponentPlayCard key={item.id} item={item} onDone={handleOpponentPlayDone} />
      ))}
    </View>
  );
}

const absoluteFillStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
} as const;
