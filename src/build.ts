import * as glob from 'glob';
import { Config } from 'style-dictionary';
import { StyleDictionary } from 'style-dictionary-utils';

const THEME_MODES = ['light', 'dark'];
const RESPONSIVE_MODES = ['mobile', 'desktop'];
const MOBILE_BREAKPOINT = '768px';
const DEFAULT_MODES = ['light', 'mobile'];
const PRIMITIVE_SET = 'primitives';
const ALL_MODES = [...THEME_MODES, ...RESPONSIVE_MODES];

const inputTokenSets = glob.sync('tokens/**/*.json');

const getModeFromPath = (path: string): string => {
  const modeMatch = path.match(/tokens\/[^.]+\.([^.]+)\.json/) || [];
  return modeMatch[1].toLowerCase();
};

type TokenSets = { name: string; tokenSets: string[] };

const getDefaultTokenSet = (): TokenSets => {
  const tokenSource = inputTokenSets.filter((tokenPath) => {
    const fileMode = getModeFromPath(tokenPath);
    if (ALL_MODES.includes(fileMode) && !DEFAULT_MODES.includes(fileMode)) {
      return false;
    }
    return true;
  });

  return {
    name: 'default',
    tokenSets: tokenSource,
  };
};

const getTokenSets = (modes: string[]): TokenSets[] => {
  return modes.map((currentMode) => {
    const tokenSource = inputTokenSets.filter((tokenPath) => {
      if (tokenPath.toLowerCase().includes(PRIMITIVE_SET)) {
        return true;
      }
      return getModeFromPath(tokenPath) === currentMode;
    });

    return {
      name: currentMode,
      tokenSets: tokenSource,
    };
  });
};

const getConfigs = (): Config[] => {
  return [
    getDefaultTokenSet(),
    ...getTokenSets(THEME_MODES),
    ...getTokenSets(RESPONSIVE_MODES),
  ].map(({ name, tokenSets }) => ({
    source: tokenSets,
    platforms: {
      css: {
        transformGroup: 'css',
        transforms: ['size/pxToRem'],
        buildPath: 'build/css/',
        files: [
          {
            destination: `${name}.css`,
            format: 'css/advanced',
            options: { outputReferences: true },
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
            destination: `${name}.scss`,
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
            destination: `${name}.js`,
            format: 'javascript/es6',
          },
          {
            destination: 'variables.d.ts',
            format: 'typescript/es6-declarations',
          },
        ],
      },
    },
  }));

  // return THEME_MODES.map((tokenMode) => {
  //   // Get token files that are either mode-agnostic or match the current mode
  //   const tokenModeSource = inputTokenSets.filter((tokenPath) => {
  //     // Extract mode from filename pattern (e.g. 'tokens/something.mode.json')
  //     const modeMatch = tokenPath.match(/tokens\/[^.]+\.([^.]+)\.json/) || [];
  //     const fileMode = modeMatch[1].toLowerCase();

  //     // Include file if:
  //     // 1. It's not a recognized theme mode (generic token)
  //     // 2. Or it matches the current theme mode we're building
  //     return !THEME_MODES.includes(fileMode) || fileMode === tokenMode;
  //   });

  // return {
  //   source: tokenModeSource,
  //   platforms: {
  //     css: {
  //       // "prefix": "bls-"
  //       transformGroup: 'css',
  //       transforms: ['size/pxToRem'],
  //       basePxFontSize: 16,
  //       buildPath: 'build/css/',
  //       files: [
  //         {
  //           destination: `variables.${tokenMode}.css`,
  //           format: 'css/advanced',
  //           options: {
  //             selector: DEFAULT_MODE !== tokenMode ? `[data-theme="${tokenMode}"]` : '',
  //             outputReferences: true,
  //             rules: [
  //               {
  //                 atRule: '@media (min-width: 768px)',
  //               },
  //             ],
  //           },
  //         },
  //       ],
  //     },
  //     scss: {
  //       transformGroup: 'scss',
  //       transforms: ['size/pxToRem'],
  //       basePxFontSize: 16,
  //       buildPath: 'build/scss/',
  //       files: [
  //         {
  //           destination: `variables.${tokenMode}.scss`,
  //           format: 'scss/variables',
  //         },
  //       ],
  //     },
  //     ts: {
  //       transformGroup: 'js',
  //       transforms: ['name/camel', 'size/pxToRem'],
  //       basePxFontSize: 16,
  //       buildPath: 'build/ts/',
  //       files: [
  //         {
  //           destination: `variables.${tokenMode}.js`,
  //           format: 'javascript/esm',
  //         },
  //         {
  //           destination: 'variables.d.ts',
  //           format: 'typescript/esm-declarations',
  //         },
  //       ],
  //     },
  //   },
  // };
  // });
};

async function run() {
  const configs = getConfigs();

  configs.forEach(async (config: Config, index) => {
    const sd = new StyleDictionary(config, { verbosity: 'verbose' });

    if (index === 0) {
      await sd.cleanAllPlatforms();
    }
    await sd.buildAllPlatforms();
  });
}

run();
