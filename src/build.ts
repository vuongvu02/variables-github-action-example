import StyleDictionary from 'style-dictionary';

async function run() {
  const sd = new StyleDictionary({
    source: ['tokens/**/*.json'],
    platforms: {
      css: {
        // "prefix": "bls-"
        transformGroup: 'css',
        transforms: ['size/px'],
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
        transforms: ['size/px'],
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
        transforms: ['name/camel'],
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

  await sd.cleanAllPlatforms();
  await sd.buildAllPlatforms();
}

run();
