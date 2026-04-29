import { existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC_ROOT = new URL('../src/', import.meta.url);
const EXTS = ['.ts', '.tsx'];

function tryResolveFile(baseUrl) {
  const basePath = fileURLToPath(baseUrl);
  for (const ext of EXTS) {
    const candidate = basePath + ext;
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  if (existsSync(basePath) && statSync(basePath).isDirectory()) {
    for (const ext of EXTS) {
      const candidate = `${basePath}/index${ext}`;
      if (existsSync(candidate)) return pathToFileURL(candidate).href;
    }
  }
  return null;
}

export function resolve(specifier, context, nextResolve) {
  let rewritten = null;

  if (specifier.startsWith('@/')) {
    rewritten = tryResolveFile(new URL(specifier.slice(2), SRC_ROOT));
  } else if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    !/\.[cm]?[jt]sx?$|\.json$/.test(specifier)
  ) {
    const parent = context.parentURL ?? import.meta.url;
    rewritten = tryResolveFile(new URL(specifier, parent));
  }

  return nextResolve(rewritten ?? specifier, context);
}
