import type { Card as CardType } from '@shedding-game/shared';

import { BulletList } from '@/components/BulletList';
import { Card } from '@/components/Card';
import { modalScrollAreaClassName, ModalShell } from '@/components/Modal';
import { Box } from '@/components/ui/box';
import { StyledScrollView } from '@/components/ui/interop';
import { Text } from '@/components/ui/text';
import { useAppTranslation } from '@/i18n';
import { surfaceEffectClassNames } from '@/theme';

type RulesSectionProps = {
  title: string;
  children: React.ReactNode;
};

const RulesSection = ({ title, children }: RulesSectionProps) => (
  <Box
    className={`gap-3 rounded-[24px] border border-border-default bg-surface-card-strong p-4 ${surfaceEffectClassNames.raised}`}
  >
    <Text className="text-[12px] font-bold uppercase tracking-[1px] text-text-tertiary">
      {title}
    </Text>
    {children}
  </Box>
);

type RulesModalProps = {
  onClose: () => void;
};

export const RulesModal = function RulesModal({ onClose }: RulesModalProps) {
  const { t } = useAppTranslation('game');
  const rules = t('rules.baseRules', { returnObjects: true }) as string[];
  const bridgeRules = t('rules.bridgeRules', { returnObjects: true }) as string[];
  const scoringRules = t('rules.scoringRules', { returnObjects: true }) as string[];
  const specialCards: { card: CardType; text: string }[] = [
    { card: { rank: '6', suit: 'diamonds' }, text: t('rules.specialCards.six') },
    { card: { rank: '7', suit: 'hearts' }, text: t('rules.specialCards.seven') },
    { card: { rank: '8', suit: 'clubs' }, text: t('rules.specialCards.eight') },
    { card: { rank: 'J', suit: 'spades' }, text: t('rules.specialCards.jack') },
    { card: { rank: 'A', suit: 'hearts' }, text: t('rules.specialCards.ace') },
  ];
  const scoringCards: { cards: CardType[]; text: string }[] = [
    {
      cards: [
        { rank: '6', suit: 'clubs' },
        { rank: '7', suit: 'diamonds' },
        { rank: '8', suit: 'hearts' },
        { rank: '9', suit: 'spades' },
      ],
      text: t('rules.scoringCards.zero'),
    },
    {
      cards: [
        { rank: '10', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
      ],
      text: t('rules.scoringCards.ten'),
    },
    { cards: [{ rank: 'J', suit: 'spades' }], text: t('rules.scoringCards.twenty') },
    { cards: [{ rank: 'A', suit: 'hearts' }], text: t('rules.scoringCards.fifteen') },
  ];

  return (
    <ModalShell
      title={t('rules.title')}
      onClose={onClose}
      buttons={[{ title: t('rules.close'), onPress: onClose }]}
    >
      <StyledScrollView
        className={modalScrollAreaClassName}
        contentContainerClassName="pb-md"
        showsVerticalScrollIndicator={false}
      >
        <Box className="gap-4">
          <RulesSection title={t('rules.sectionBasics')}>
            <BulletList items={rules} />
          </RulesSection>

          <RulesSection title={t('rules.sectionSpecialCards')}>
            <Box className="gap-3">
              {specialCards.map((item, i) => (
                <Box
                  key={i}
                  className="flex-row items-center gap-3 rounded-[18px] border border-border-default bg-overlay-scrim px-3.5 py-3"
                >
                  <Card card={item.card} size="small" />
                  <Text className="flex-1 text-[13px] leading-[19px] text-text-primary">
                    {item.text}
                  </Text>
                </Box>
              ))}
            </Box>
          </RulesSection>

          <RulesSection title={t('rules.sectionScores')}>
            <Box className="gap-3">
              {scoringCards.map((item, i) => (
                <Box
                  key={i}
                  className="gap-2 rounded-[18px] border border-border-default bg-overlay-scrim px-3.5 py-3"
                >
                  <Box className="flex-row flex-wrap gap-1">
                    {item.cards.map((card, j) => (
                      <Card key={j} card={card} size="small" />
                    ))}
                  </Box>
                  <Text className="text-[13px] font-semibold text-text-primary">{item.text}</Text>
                </Box>
              ))}
            </Box>
            <BulletList items={scoringRules} />
          </RulesSection>

          <RulesSection title={t('rules.sectionBridge')}>
            <BulletList items={bridgeRules} />
          </RulesSection>
        </Box>
      </StyledScrollView>
    </ModalShell>
  );
};
