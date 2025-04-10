import 'dotenv/config';
import * as fs from 'fs';
import FigmaApi from './figma-api.js';
import { tokenFilesFromLocalVariables } from './token-export.js';

const OUTPUT_DIR = 'tokens';

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
