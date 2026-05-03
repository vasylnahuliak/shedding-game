const { AndroidConfig, withAndroidStyles } = require('expo/config-plugins');

const { assignStylesValue, getAppThemeGroup } = AndroidConfig.Styles;

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

module.exports = withAndroidForceDarkDisabled;
