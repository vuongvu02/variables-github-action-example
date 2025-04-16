import 'dotenv/config';
import * as fs from 'fs';
import { GetLocalVariablesResponse } from '@figma/rest-api-spec';
import FigmaApi from './figma-api.js';
import { Token, TokensFile } from './types.js';
import { tokenTypeFromVariable, tokenValueFromVariable } from './utils.js';

const OUTPUT_DIR = 'tokens';

export function tokenFilesFromLocalVariables(localVariablesResponse: GetLocalVariablesResponse) {
  const tokenFiles: { [fileName: string]: TokensFile } = {};
  const localVariableCollections = localVariablesResponse.meta.variableCollections;
  const localVariables = localVariablesResponse.meta.variables;

  Object.values(localVariables).forEach((variable) => {
    // Skip remote variables because we only want to generate tokens for local variables
    if (variable.remote) {
      return;
    }

    const collection = localVariableCollections[variable.variableCollectionId];

    collection.modes.forEach((mode) => {
      const fileName = `${collection.name}.${mode.name}.json`;

      if (!tokenFiles[fileName]) {
        tokenFiles[fileName] = {};
      }

      let tokenObj: any = tokenFiles[fileName];

      variable.name.split('/').forEach((groupName) => {
        tokenObj[groupName] = tokenObj[groupName] || {};
        tokenObj = tokenObj[groupName];
      });

      const token: Token = {
        $type: tokenTypeFromVariable(variable),
        $value: tokenValueFromVariable(variable, mode.modeId, localVariables),
        $description: variable.description,
        $extensions: {
          'com.figma': {
            hiddenFromPublishing: variable.hiddenFromPublishing,
            scopes: variable.scopes,
            codeSyntax: variable.codeSyntax,
            mode: mode.name,
          },
        },
      };

      Object.assign(tokenObj, token);
    });
  });

  return tokenFiles;
}

async function main() {
  if (!process.env.PERSONAL_ACCESS_TOKEN || !process.env.FILE_KEY) {
    throw new Error('PERSONAL_ACCESS_TOKEN and FILE_KEY environment variables are required');
  }

  const fileKey = process.env.FILE_KEY;
  const api = new FigmaApi(process.env.PERSONAL_ACCESS_TOKEN);
  const localVariables = await api.getLocalVariables(fileKey);
  const tokensFiles = tokenFilesFromLocalVariables(localVariables);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  Object.entries(tokensFiles).forEach(([fileName, fileContent]) => {
    fs.writeFileSync(`${OUTPUT_DIR}/${fileName}`, JSON.stringify(fileContent, null, 2));
    console.info(`Wrote ${fileName}`);
  });

  console.info(`\n\x1b[32m✅ Tokens files have been written to the ${OUTPUT_DIR} directory\x1b[0m`);
}

main();
