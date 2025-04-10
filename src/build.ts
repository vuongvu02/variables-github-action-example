import StyleDictionary from 'style-dictionary';
import { transformTypes } from 'style-dictionary/enums';
import { kebabCase, camelCase } from 'change-case';

const ALLOWED_MODES = ['light', 'dark', 'mobil', 'desktop'];

async function run() {
  const sd = new StyleDictionary({
    source: ['tokens/**/*.json'],
    platforms: {
      css: {
        // "prefix": "bls-"
        transformGroup: 'css',
        transforms: ['size/pxToRem', 'name/kebabWithMode'],
        basePxFontSize: 16,
        buildPath: 'build/css/',
        files: [
          {
            destination: 'variables.css',
            format: 'css/variables',
            // options: {
            //   outputReferences: true,
            // },
          },
        ],
      },
      scss: {
        // "prefix": "bls-"
        transformGroup: 'scss',
        transforms: ['size/pxToRem', 'name/kebabWithMode'],
        basePxFontSize: 16,
        buildPath: 'build/scss/',
        files: [
          {
            destination: 'variables.scss',
            format: 'scss/variables',
          },
        ],
      },
      ts: {
        // "prefix": "bls-"
        transformGroup: 'js',
        transforms: ['name/camelWithMode', 'size/pxToRem'],
        basePxFontSize: 16,
        buildPath: 'build/ts/',
        files: [
          {
            destination: 'variables.js',
            format: 'javascript/es6',
          },
          {
            destination: 'variables.d.ts',
            format: 'typescript/es6-declarations',
          },
        ],
      },
    },
  });

  sd.registerTransform({
    name: 'name/kebabWithMode',
    type: transformTypes.name,
    filter: function (token) {
      const tokenMode = String(token.$extensions['com.figma'].mode).toLowerCase();
      return ALLOWED_MODES.includes(tokenMode);
    },
    transform: function (token, config) {
      const tokenNameWithMode = token.path.concat(token.$extensions['com.figma'].mode);
      return kebabCase([config.prefix].concat(tokenNameWithMode).join(' '));
    },
  });

  sd.registerTransform({
    name: 'name/camelWithMode',
    type: transformTypes.name,
    filter: function (token) {
      const tokenMode = String(token.$extensions['com.figma'].mode).toLowerCase();
      return ALLOWED_MODES.includes(tokenMode);
    },
    transform: function (token, config) {
      const tokenNameWithMode = token.path.concat(token.$extensions['com.figma'].mode);
      const lowerFirst = function (str: string) {
        return str ? str[0].toLowerCase() + str.slice(1) : '';
      };
      return lowerFirst(
        camelCase([config.prefix].concat(tokenNameWithMode).join(' '), {
          mergeAmbiguousCharacters: true,
        }),
      );
    },
  });

  await sd.cleanAllPlatforms();
  await sd.buildAllPlatforms();
}

run();
