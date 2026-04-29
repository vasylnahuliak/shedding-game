export const toPositiveInt = (rawValue: string | undefined, fallback: number): number => {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};
