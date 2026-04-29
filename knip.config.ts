export default {
  $schema: 'https://unpkg.com/knip@5/schema.json',
  exclude: ['dependencies', 'devDependencies', 'optionalPeerDependencies', 'unlisted', 'binaries'],
  workspaces: {
    '.': {
      entry: ['scripts/*.mjs'],
    },
    'apps/backend': {
      project: ['src/**/*.ts'],
    },
    'apps/frontend': {
      entry: ['src/app/**/*.{ts,tsx}'],
      project: ['src/**/*.{ts,tsx}'],
      metro: {
        entry: [
          // Knip doesn't have Metro's module resolution (would make Knip complicated and slow as we'd have to lint once
          // per platform). We can consider platform-specific files to be entry points. Though now Knip won't catch
          // unused platform-specific files (which in turn might contain unused dependencies).
          'index*.js',
          '{src}/**/*.{ios,android,web,native}.{ts,tsx,js,json}',
        ],
      },
    },
    'packages/shared': {
      project: ['src/**/*.ts'],
    },
  },
};
