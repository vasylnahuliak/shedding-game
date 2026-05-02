const { AndroidConfig, withAndroidStyles } = require('expo/config-plugins');

const { assignStylesValue, getAppThemeGroup } = AndroidConfig.Styles;

const updateChannelByBuildProfile = {
  development: 'development',
  'android-development': 'development',
  'ios-simulator': 'development',
  staging: 'staging',
  'ios-adhoc': 'staging',
  production: 'production',
};

const updateChannelByAppEnv = {
  local: 'development',
  staging: 'staging',
  production: 'production',
};

const withAndroidForceDarkDisabled = (config) =>
  withAndroidStyles(config, (config) => {
    config.modResults = assignStylesValue(config.modResults, {
      add: true,
      parent: getAppThemeGroup(),
      name: 'android:forceDarkAllowed',
      value: 'false',
      targetApi: 'q',
    });

    return config;
  });

module.exports = () => {
  const buildProfile = process.env.EAS_BUILD_PROFILE ?? null;
  const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? process.env.APP_ENV ?? null;
  const resolvedUpdateChannel =
    (buildProfile ? updateChannelByBuildProfile[buildProfile] : undefined) ??
    (appEnv ? updateChannelByAppEnv[appEnv] : undefined) ??
    'development';

  return {
    name: 'Shedding Game',
    slug: 'shedding-game',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'sheddinggameapp',
    userInterfaceStyle: 'dark',
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.vasylnahuliak.sheddinggame',
      usesAppleSignIn: true,
      associatedDomains: ['applinks:shedding-game.smler.io'],
      appleTeamId: '67XZ58Y637',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIDesignRequiresCompatibility: true,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#123C24',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.vasylnahuliak.sheddinggame',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'shedding-game.smler.io',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            buildReactNativeFromSource: true,
          },
        },
      ],
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#123C24',
        },
      ],
      'expo-font',
      'expo-image',
      'expo-secure-store',
      'expo-web-browser',
      'expo-localization',
      'expo-apple-authentication',
      withAndroidForceDarkDisabled,
      [
        '@sentry/react-native/expo',
        {
          organization: 'vasylnahuliak',
          project: 'shedding-game-mobile',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '74dca239-4862-4be8-a72e-0812f0cdf372',
      },
    },
    owner: 'vasylnahuliak',
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    updates: {
      url: 'https://u.expo.dev/74dca239-4862-4be8-a72e-0812f0cdf372',
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 0,
      requestHeaders: {
        'expo-channel-name': resolvedUpdateChannel,
      },
    },
  };
};
