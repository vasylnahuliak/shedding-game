export const BOT_NAME_TAG = '🤖';

export const BOT_PERSONA_NAMES = [
  'Alexa',
  'Siri',
  'Jarvis',
  'Bender',
  'TARS',
  'Data',
  'Marvin',
  'Rosie',
  'Sonny',
  'KITT',
  'R2D2',
  'Baymax',
] as const;

export type BotPersonaName = (typeof BOT_PERSONA_NAMES)[number];

const BOT_PERSONA_NAME_SET = new Set<string>(BOT_PERSONA_NAMES);
const LEGACY_BOT_NAME_TAGS = [` ${BOT_NAME_TAG}`, ' [BOT]'];

export const formatBotDisplayName = (name: BotPersonaName) => `${name} ${BOT_NAME_TAG}`;

export const getBotPersonaName = (value: string): BotPersonaName | null => {
  const trimmedValue = value.trim();
  const matchingTag = LEGACY_BOT_NAME_TAGS.find((suffix) => trimmedValue.endsWith(suffix));
  const valueWithoutTag = matchingTag ? trimmedValue.slice(0, -matchingTag.length) : trimmedValue;

  return BOT_PERSONA_NAME_SET.has(valueWithoutTag) ? (valueWithoutTag as BotPersonaName) : null;
};

export const getAvailableBotPersonaNames = (
  botDisplayNames: string[],
  currentBotDisplayName?: string
): BotPersonaName[] => {
  const currentBotName = currentBotDisplayName ? getBotPersonaName(currentBotDisplayName) : null;
  const usedNames = new Set(
    botDisplayNames
      .map((name) => getBotPersonaName(name))
      .filter((name): name is BotPersonaName => name !== null)
  );

  if (currentBotName) {
    usedNames.delete(currentBotName);
  }

  return BOT_PERSONA_NAMES.filter((name) => !usedNames.has(name));
};
