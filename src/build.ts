import * as glob from 'glob';
import * as fs from 'fs';
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

const getModeFromFilePath = (path: string): string => {
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
  ].map(({ mode = 'base', tokenSource }) => ({
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

const generateCSSImportFile = (outputCSSRefs: string[]) => {
  const buildCssPath = 'build/css';
  const cssFilePath = `${buildCssPath}/variables.css`;

  if (!fs.existsSync(buildCssPath)) {
    fs.mkdirSync(buildCssPath, { recursive: true });
  } else if (fs.existsSync(cssFilePath) && fs.statSync(cssFilePath).isDirectory()) {
    fs.rmSync(cssFilePath, { recursive: true });
  }

  const cssImports = outputCSSRefs
    .filter(Boolean)
    .map((ref) => `@import url('./${ref}');`)
    .join('\n');

  fs.writeFileSync(
    cssFilePath,
    `/**\n* Do not edit directly, this file was auto-generated.\n*/\n\n${cssImports}\n`,
  );

  console.info('Generated CSS import file:', cssFilePath);
};

async function run() {
  const configs = getConfigs();
  const outputCSSRefs: string[] = [];

  configs.forEach(async (config, index) => {
    const sd = new StyleDictionary(config);
    outputCSSRefs.push(config.platforms?.css.files?.[0].destination || '');

    // only clean the build directory on the first run
    if (index === 0) {
      await sd.cleanAllPlatforms();
    }
    await sd.buildAllPlatforms();
  });

  generateCSSImportFile(outputCSSRefs);
}

run();
