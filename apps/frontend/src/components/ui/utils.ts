import { twMerge } from 'tailwind-merge';

export function mergeClassNames(
  ...values: Array<string | false | null | undefined>
): string | undefined {
  const className = twMerge(values.filter(Boolean).join(' '));

  return className.length > 0 ? className : undefined;
}
