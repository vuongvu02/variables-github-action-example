import { GetLocalVariablesResponse, LocalVariable } from '@figma/rest-api-spec';
import { rgbToHex } from './color.js';
import { Token, TokensFile, StyleDictionaryType } from './token_types.js';

function tokenTypeFromVariable(variable: LocalVariable): StyleDictionaryType {
  // Base mapping by resolvedType
  switch (variable.resolvedType) {
    case 'COLOR':
      return 'color';
    case 'FLOAT': {
      // For FLOAT type, check scopes to determine more specific types
      if (variable.scopes && variable.scopes.length > 0) {
        // If only one scope is defined (excluding ALL_SCOPES), we can be more specific
        if (variable.scopes.includes('OPACITY')) {
          return 'opacity';
        }
        if (variable.scopes.includes('CORNER_RADIUS')) {
          return 'borderRadius';
        }
        if (variable.scopes.includes('STROKE_FLOAT')) {
          return 'borderWidth';
        }
        if (variable.scopes.includes('WIDTH_HEIGHT')) {
          return 'dimension';
        }
        if (variable.scopes.includes('GAP')) {
          return 'dimension';
        }
        if (variable.scopes.includes('TEXT_CONTENT')) {
          return 'fontSize';
        }
        if (variable.scopes.includes('EFFECT_FLOAT')) {
          // Could be a shadow blur radius or similar
          return 'dimension';
        }
        // @ts-ignore -- FONT_STYLE is a valid scope for font-weight but not appear in the official type (VariableScope)
        if (variable.scopes.includes('FONT_STYLE')) {
          return 'number';
        }
      }

      return 'dimension';
    }
    case 'STRING': {
      // For strings, we could potentially detect specific types based on value or name patterns
      // This would require examining the actual value, which we don't have in this function
      // If the function signature were changed, we could add more sophisticated detection
      return 'string';
    }
    case 'BOOLEAN':
      return 'boolean';
  }
}

function tokenValueFromVariable(
  variable: LocalVariable,
  modeId: string,
  localVariables: { [id: string]: LocalVariable },
) {
  const value = variable.valuesByMode[modeId];

  if (typeof value !== 'object') {
    return value;
  }

  if ('type' in value && value.type === 'VARIABLE_ALIAS') {
    const aliasedVariable = localVariables[value.id];
    return `{${aliasedVariable.name.replace(/\//g, '.')}}`;
  }

  if ('r' in value) {
    return rgbToHex(value);
  }

  throw new Error(`Invalid variable value format: ${JSON.stringify(value)}`);
}

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

      let obj: any = tokenFiles[fileName];

      variable.name.split('/').forEach((groupName) => {
        obj[groupName] = obj[groupName] || {};
        obj = obj[groupName];
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

      Object.assign(obj, token);
    });
  });

  return tokenFiles;
}
