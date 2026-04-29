import path from 'path';
import { fileURLToPath } from 'url';

import pluginQuery from '@tanstack/eslint-plugin-query';
import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import expoConfig from 'eslint-config-expo/flat.js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname);

const frontendTsconfig = path.join(rootDir, 'apps', 'frontend', 'tsconfig.json');
const backendTsconfig = path.join(rootDir, 'apps', 'backend', 'tsconfig.json');
const sharedTsconfig = path.join(rootDir, 'packages', 'shared', 'tsconfig.json');

const toWorkspaceGlobs = (directory, extensions) => [
  path.join(rootDir, directory, `**/*.{${extensions}}`),
  `${directory}/**/*.{${extensions}}`,
];

const frontendFiles = toWorkspaceGlobs('apps/frontend', 'js,jsx,ts,tsx');
const frontendTypeAwareFiles = toWorkspaceGlobs('apps/frontend', 'ts,tsx');
const frontendLowerLevelFiles = [
  ...toWorkspaceGlobs('apps/frontend/src/api', 'ts,tsx'),
  ...toWorkspaceGlobs('apps/frontend/src/components', 'ts,tsx'),
  ...toWorkspaceGlobs('apps/frontend/src/hooks', 'ts,tsx'),
  ...toWorkspaceGlobs('apps/frontend/src/i18n', 'ts,tsx'),
  ...toWorkspaceGlobs('apps/frontend/src/monitoring', 'ts,tsx'),
  ...toWorkspaceGlobs('apps/frontend/src/navigation', 'ts,tsx'),
  ...toWorkspaceGlobs('apps/frontend/src/services', 'ts,tsx'),
  ...toWorkspaceGlobs('apps/frontend/src/shared', 'ts,tsx'),
  ...toWorkspaceGlobs('apps/frontend/src/types', 'ts,tsx'),
  ...toWorkspaceGlobs('apps/frontend/src/utils', 'ts,tsx'),
];
const backendFiles = toWorkspaceGlobs('apps/backend', 'js,ts');
const backendTypeAwareFiles = toWorkspaceGlobs('apps/backend', 'ts');
const packageFiles = toWorkspaceGlobs('packages', 'js,jsx,ts,tsx');
const packageTypeAwareFiles = toWorkspaceGlobs('packages', 'ts,tsx');
const backendAndSharedTypeAwareFiles = [...backendTypeAwareFiles, ...packageTypeAwareFiles];
const workspaceJsFiles = [
  ...toWorkspaceGlobs('apps', 'js,jsx'),
  ...toWorkspaceGlobs('packages', 'js,jsx'),
];
const workspaceTypeAwareFiles = [
  ...toWorkspaceGlobs('apps', 'ts,tsx'),
  ...toWorkspaceGlobs('packages', 'ts,tsx'),
];
const workspaceSourceJsFiles = [
  ...toWorkspaceGlobs('apps', 'js,jsx').map((pattern) => pattern.replace('/**/*.', '/src/**/*.')),
  ...toWorkspaceGlobs('packages', 'js,jsx').map((pattern) =>
    pattern.replace('/**/*.', '/src/**/*.')
  ),
];
const workspaceIgnores = [
  '**/*.d.ts',
  '**/*.tsbuildinfo',
  '**/dist/**',
  '**/node_modules/**',
  '**/.expo/**',
  '**/web-build/**',
  '**/ios/**',
  '**/android/**',
  '**/DerivedData/**',
  '**/.gradle/**',
  '**/.cxx/**',
  '**/.kotlin/**',
  '**/reports/**',
  '**/.agents/**',
  '**/.turbo/**',
  '**/.vscode/**',
  '**/.lock',
  '**/package-lock.json',
  'apps/**/dist/**',
  'packages/**/dist/**',
];

const removePluginFromConfig = (config, pluginName) => {
  if (!config.plugins?.[pluginName]) {
    return config;
  }

  const { [pluginName]: _plugin, ...plugins } = config.plugins;

  return {
    ...config,
    plugins,
  };
};

const removePluginAndRulesFromConfig = (config, pluginName) => {
  const configWithoutPlugin = removePluginFromConfig(config, pluginName);

  if (!Object.keys(config.rules ?? {}).some((ruleName) => ruleName.startsWith(`${pluginName}/`))) {
    return configWithoutPlugin;
  }

  const rules = Object.fromEntries(
    Object.entries(config.rules ?? {}).filter(
      ([ruleName]) => !ruleName.startsWith(`${pluginName}/`)
    )
  );

  return {
    ...configWithoutPlugin,
    rules,
  };
};

const expoConfigWithoutDuplicatePlugins = expoConfig.map((config) => {
  const configWithoutReactHooks = removePluginAndRulesFromConfig(config, 'react-hooks');

  return removePluginAndRulesFromConfig(configWithoutReactHooks, '@typescript-eslint');
});

const importSortConfig = {
  plugins: { 'simple-import-sort': simpleImportSort },
  rules: {
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          ['^react', '^react-native'],
          ['^@?\\w'],
          ['^@shared', '^shared', '^@shedding-game/shared$'],
          ['^@/', '^~/'],
          ['^\\.\\.'],
          ['^\\./'],
          ['^.+\\.s?css$'],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',
  },
};

const sharedPackageBoundaryPatterns = [
  {
    group: ['@shedding-game/shared/*'],
    message: 'Import from "@shedding-game/shared" public entrypoint only.',
  },
];

const restrictedTouchableImportNames = [
  'TouchableHighlight',
  'TouchableNativeFeedback',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
];

const restrictedTouchableImportPaths = ['react-native', 'react-native-gesture-handler'].map(
  (name) => ({
    name,
    importNames: restrictedTouchableImportNames,
    message: 'Use Pressable from "react-native" instead of Touchable* components.',
  })
);

const BAN_FORWARD_REF_MESSAGE =
  'forwardRef is not needed in React 19+. Pass ref as a regular prop instead.';

const BAN_USE_CONTEXT_MESSAGE =
  "useContext is not needed in React 19+. Use 'use(Context)' instead.";

const frontendRestrictedImportPaths = [
  ...restrictedTouchableImportPaths,
  {
    name: 'react',
    importNames: ['forwardRef'],
    message: BAN_FORWARD_REF_MESSAGE,
  },
  {
    name: 'react',
    importNames: ['useContext'],
    message: BAN_USE_CONTEXT_MESSAGE,
  },
  {
    name: 'react-native',
    importNames: ['Alert'],
    message: 'Use showAlert from "@/utils/alert" instead - default Alert does not work on web.',
  },
  {
    name: 'react-native',
    importNames: ['Modal'],
    message:
      'Use navigation-level modal routes, ModalRouteFrame, or root overlay providers instead of react-native Modal.',
  },
  {
    name: 'react-native',
    importNames: ['Animated'],
    message:
      'Use react-native-reanimated instead of Animated for better performance and web support.',
  },
  {
    name: 'react-native-reanimated',
    importNames: ['runOnJS'],
    message: 'Use `scheduleOnRN` from `react-native-worklets` instead.',
  },
  {
    name: 'react-native',
    importNames: ['KeyboardAvoidingView'],
    message: 'Use KeyboardAvoidingView from react-native-keyboard-controller instead.',
  },
];

const namedEffectCallbackSelector =
  'CallExpression[callee.name=/^(useEffect|useLayoutEffect)$/] > :matches(ArrowFunctionExpression, FunctionExpression[id=null]):first-child';

const nonUseCallbackFocusEffectSelector =
  'CallExpression[callee.name="useFocusEffect"] > :not(CallExpression[callee.name="useCallback"]):first-child';

const unnamedUseCallbackFocusEffectSelector =
  'CallExpression[callee.name="useFocusEffect"] > CallExpression[callee.name="useCallback"]:first-child > :matches(ArrowFunctionExpression, FunctionExpression[id=null]):first-child';

const typeAwareParserOptions = {
  projectService: {
    allowDefaultProject: ['apps/backend/prisma.config.ts'],
  },
  tsconfigRootDir: rootDir,
};

const typeAwareRules = {
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      minimumDescriptionLength: 6,
      'ts-check': false,
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': true,
      'ts-nocheck': true,
    },
  ],
  '@typescript-eslint/consistent-type-exports': 'error',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      fixStyle: 'separate-type-imports',
      prefer: 'type-imports',
    },
  ],
  '@typescript-eslint/no-base-to-string': 'off',
  '@typescript-eslint/no-deprecated': 'error',
  '@typescript-eslint/no-confusing-void-expression': 'off',
  '@typescript-eslint/no-dynamic-delete': 'off',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-misused-promises': [
    'error',
    {
      checksConditionals: true,
      checksSpreads: true,
      checksVoidReturn: {
        arguments: false,
        attributes: false,
        properties: false,
        returns: true,
        variables: true,
      },
    },
  ],
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/no-redundant-type-constituents': 'off',
  '@typescript-eslint/no-unnecessary-condition': 'off',
  '@typescript-eslint/no-unnecessary-type-arguments': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/require-await': 'off',
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
};

export default defineConfig([
  {
    ignores: workspaceIgnores,
    linterOptions: {
      reportUnusedInlineConfigs: 'error',
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: [...frontendFiles, ...backendFiles, ...packageFiles],
    ignores: workspaceIgnores,
    settings: {
      'import/resolver': {
        typescript: {
          noWarnOnMultipleProjects: true,
          project: [frontendTsconfig, backendTsconfig, sharedTsconfig],
        },
      },
    },
  },
  {
    files: [...frontendFiles, ...backendFiles, ...packageFiles],
    ignores: workspaceIgnores,
    rules: {
      'max-lines': [
        'error',
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    files: workspaceJsFiles,
    ignores: workspaceIgnores,
    extends: [tseslint.configs.recommended, tseslint.configs.disableTypeChecked],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      ...importSortConfig.rules,
    },
    plugins: {
      ...importSortConfig.plugins,
    },
  },
  {
    files: workspaceSourceJsFiles,
    ignores: workspaceIgnores,
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message: 'Source files under src must be TypeScript.',
        },
      ],
    },
  },
  {
    files: workspaceTypeAwareFiles,
    ignores: workspaceIgnores,
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: typeAwareParserOptions,
    },
    plugins: {
      ...importSortConfig.plugins,
    },
    rules: {
      ...importSortConfig.rules,
      ...typeAwareRules,
    },
  },
  {
    files: [...frontendFiles, ...backendFiles, ...packageFiles],
    ignores: workspaceIgnores,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: sharedPackageBoundaryPatterns,
        },
      ],
    },
  },
  {
    files: frontendFiles,
    ignores: workspaceIgnores,
    extends: [
      expoConfigWithoutDuplicatePlugins,
      pluginQuery.configs['flat/recommended'],
      reactHooks.configs.flat.recommended,
      reactYouMightNotNeedAnEffect.configs.strict,
    ],
    rules: {
      'import/no-named-as-default': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program > ExpressionStatement > Literal[value="use client"]',
          message: "'use client' is not needed in this React Native project.",
        },
        {
          selector: 'Program > ExpressionStatement > Literal[value="use server"]',
          message: "'use server' is not needed in this React Native project.",
        },
        {
          selector: namedEffectCallbackSelector,
          message:
            'Effect callbacks must be named function expressions. Use useEffect(function syncSomething() { ... }, deps).',
        },
        {
          selector: nonUseCallbackFocusEffectSelector,
          message:
            'useFocusEffect must receive useCallback(function syncSomething() { ... }, deps).',
        },
        {
          selector: unnamedUseCallbackFocusEffectSelector,
          message:
            'useFocusEffect callbacks must be named function expressions inside useCallback.',
        },
        {
          selector: 'CallExpression[callee.object.name="React"][callee.property.name="useContext"]',
          message: BAN_USE_CONTEXT_MESSAGE,
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: frontendRestrictedImportPaths,
          patterns: sharedPackageBoundaryPatterns,
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'React',
          property: 'forwardRef',
          message: BAN_FORWARD_REF_MESSAGE,
        },
        {
          object: 'React',
          property: 'useContext',
          message: BAN_USE_CONTEXT_MESSAGE,
        },
      ],
    },
  },
  {
    files: frontendLowerLevelFiles,
    ignores: workspaceIgnores,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: frontendRestrictedImportPaths,
          patterns: [
            ...sharedPackageBoundaryPatterns,
            {
              group: ['@/app/*'],
              message: 'Low-level frontend modules must not depend on route files under src/app.',
            },
            {
              group: ['@/screens/*'],
              message: 'Low-level frontend modules must not depend on the screen layer.',
            },
          ],
        },
      ],
    },
  },
  {
    files: backendAndSharedTypeAwareFiles,
    ignores: workspaceIgnores,
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-cycle': [
        'error',
        {
          ignoreExternal: true,
        },
      ],
    },
  },
  {
    files: [...backendTypeAwareFiles, ...packageTypeAwareFiles],
    ignores: workspaceIgnores,
    rules: {
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        {
          ignoreArrowShorthand: true,
          ignoreVoidOperator: true,
        },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'error',
    },
  },
  {
    files: backendTypeAwareFiles,
    ignores: [
      ...workspaceIgnores,
      'apps/backend/src/db/**',
      path.join(rootDir, 'apps', 'backend', 'src', 'db', '**'),
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: sharedPackageBoundaryPatterns,
          paths: [
            {
              name: '@prisma/client',
              message:
                'Import Prisma only from the db layer. Move Prisma-specific logic into src/db.',
            },
            {
              name: '@prisma/adapter-pg',
              message: 'Create Prisma adapters only in src/db/client.ts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [...backendFiles, ...backendTypeAwareFiles],
    ignores: workspaceIgnores,
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: [
      'apps/backend/prisma.config.ts',
      path.join(rootDir, 'apps', 'backend', 'prisma.config.ts'),
    ],
    extends: [tseslint.configs.disableTypeChecked],
  },
  eslintConfigPrettier,
]);
