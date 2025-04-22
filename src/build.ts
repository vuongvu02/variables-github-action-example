import * as glob from 'glob';
import { Config } from 'style-dictionary';
import { StyleDictionary } from 'style-dictionary-utils';
import { TokenSourceWithMode } from './types.js';
import * as dotenv from 'dotenv';

dotenv.config();

const THEME_MODES = process.env.THEME_MODES?.split(',') || ['light', 'dark'];
const RESPONSIVE_MODES = process.env.RESPONSIVE_MODES?.split(',') || ['mobile', 'desktop'];
const MOBILE_BREAKPOINT = process.env.MOBILE_BREAKPOINT || '768px';
const DEFAULT_MODES = process.env.DEFAULT_MODES?.split(',') || ['light', 'mobile'];
const PRIMITIVE_SET_NAME = process.env.PRIMITIVE_SET_NAME || 'primitives';

const inputTokenSets = glob.sync('tokens/**/*.json');

export const getModeFromFilePath = (path: string): string => {
  const modeMatch = path.match(/tokens\/[^.]+\.([^.]+)\.json/) || [];
  return modeMatch[1].toLowerCase();
};

const getDefaultTokenSet = (): TokenSourceWithMode => {
  const tokenSource = inputTokenSets.filter((tokenPath) => {
    const fileMode = getModeFromFilePath(tokenPath);
    const allModes = [...THEME_MODES, ...RESPONSIVE_MODES];
    if (allModes.includes(fileMode) && !DEFAULT_MODES.includes(fileMode)) {
      return false;
    }
    return true;
  });

  return { tokenSource };
};

const getTokenSets = (modes: string[]): TokenSourceWithMode[] => {
  return modes.map((currentMode) => {
    const tokenSource = inputTokenSets.filter((tokenPath) => {
      if (tokenPath.toLowerCase().includes(PRIMITIVE_SET_NAME)) {
        return true;
      }
      return getModeFromFilePath(tokenPath) === currentMode;
    });

    return { mode: currentMode, tokenSource };
  });
};

const getCSSThemeSelector = (mode: string) => {
  if (THEME_MODES.includes(mode) && !DEFAULT_MODES.includes(mode)) {
    return `[data-theme="${mode}"]`;
  }
  return ':root';
};

const getCSSRules = (mode: string) => {
  if (RESPONSIVE_MODES.includes(mode) && !DEFAULT_MODES.includes(mode)) {
    return [
      {
        atRule: `@media screen and (min-width: ${MOBILE_BREAKPOINT})`,
      },
    ];
  }
  return undefined;
};

const getConfigs = (): Config[] => {
  return [
    getDefaultTokenSet(),
    ...getTokenSets(THEME_MODES),
    ...getTokenSets(RESPONSIVE_MODES),
  ].map(({ mode = 'default', tokenSource }) => ({
    source: tokenSource,
    platforms: {
      css: {
        transformGroup: 'css',
        transforms: ['size/pxToRem'],
        buildPath: 'build/css/',
        files: [
          {
            destination: `${mode}.css`,
            format: 'css/advanced',
            options: {
              outputReferences: true,
              selector: getCSSThemeSelector(mode),
              rules: getCSSRules(mode),
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
            destination: `${mode}.scss`,
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
            destination: `${mode}.js`,
            format: 'javascript/es6',
          },
          {
            destination: `${mode}.d.ts`,
            format: 'typescript/es6-declarations',
          },
        ],
      },
    },
  }));
};

async function run() {
  const configs = getConfigs();

  configs.forEach(async (config, index) => {
    const sd = new StyleDictionary(config);

    // only clean the build directory on the first run
    if (index === 0) {
      await sd.cleanAllPlatforms();
    }
    await sd.buildAllPlatforms();
  });
}

run();
