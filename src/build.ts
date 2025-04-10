import * as glob from 'glob';
import StyleDictionary, { Config } from 'style-dictionary';

const inputTokenSets = glob.sync('tokens/**/*.json');

const TOKEN_THEME_MODES = ['light', 'dark'];
const DEFAULT_MODE = 'light';

const getConfigs = (): Config[] => {
  return TOKEN_THEME_MODES.map((tokenMode) => {
    // Get token files that are either mode-agnostic or match the current mode
    const tokenModeSource = inputTokenSets.filter((tokenPath) => {
      // Extract mode from filename pattern (e.g. 'tokens/something.mode.json')
      const modeMatch = tokenPath.match(/tokens\/[^.]+\.([^.]+)\.json/) || [];
      const fileMode = modeMatch[1].toLowerCase();

      // Include file if:
      // 1. It's not a recognized theme mode (generic token)
      // 2. Or it matches the current theme mode we're building
      return !TOKEN_THEME_MODES.includes(fileMode) || fileMode === tokenMode;
    });

    console.log(tokenModeSource);

    return {
      source: tokenModeSource,
      platforms: {
        css: {
          // "prefix": "bls-"
          transformGroup: 'css',
          transforms: ['size/pxToRem'],
          basePxFontSize: 16,
          buildPath: 'build/css/',
          files: [
            {
              destination: `variables.${tokenMode}.css`,
              format: 'css/variables',
              options: {
                selector: DEFAULT_MODE !== tokenMode ? `[data-theme="${tokenMode}"]` : '',
                outputReferences: true,
              },
            },
          ],
        },
        scss: {
          transformGroup: 'scss',
          transforms: ['size/pxToRem'],
          basePxFontSize: 16,
          buildPath: 'build/scss/',
          files: [
            {
              destination: `variables.${tokenMode}.scss`,
              format: 'scss/variables',
            },
          ],
        },
        ts: {
          transformGroup: 'js',
          transforms: ['name/camel', 'size/pxToRem'],
          basePxFontSize: 16,
          buildPath: 'build/ts/',
          files: [
            {
              destination: `variables.${tokenMode}.js`,
              format: 'javascript/es6',
            },
            {
              destination: 'variables.d.ts',
              format: 'typescript/es6-declarations',
            },
          ],
        },
      },
    };
  });
};

async function run() {
  const configs = getConfigs();

  configs.forEach(async (config: Config) => {
    const sd = new StyleDictionary(config);
    await sd.cleanAllPlatforms();
    await sd.buildAllPlatforms();
  });
}

run();
