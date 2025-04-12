import { RGB, RGBA } from '@figma/rest-api-spec';
import { LocalVariable } from '@figma/rest-api-spec';
import { StyleDictionaryType } from './types.js';

function rgbToHex({ r, g, b, ...rest }: RGB | RGBA) {
  const a = 'a' in rest ? rest.a : 1;

  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const hex = [toHex(r), toHex(g), toHex(b)].join('');
  return `#${hex}` + (a !== 1 ? toHex(a) : '');
}

export function tokenTypeFromVariable(variable: LocalVariable): StyleDictionaryType {
  switch (variable.resolvedType) {
    case 'COLOR':
      return 'color';
    case 'FLOAT': {
      const tokenScopes = variable.scopes || [];
      if (tokenScopes.length > 0) {
        if (tokenScopes.includes('OPACITY')) {
          return 'opacity';
        }
        if (tokenScopes.includes('CORNER_RADIUS')) {
          return 'borderRadius';
        }
        if (tokenScopes.includes('STROKE_FLOAT')) {
          return 'borderWidth';
        }
        if (tokenScopes.includes('WIDTH_HEIGHT')) {
          return 'dimension';
        }
        if (tokenScopes.includes('GAP')) {
          return 'dimension';
        }
        if (tokenScopes.includes('TEXT_CONTENT')) {
          return 'fontSize';
        }
        if (tokenScopes.includes('EFFECT_FLOAT')) {
          return 'dimension';
        }
        // @ts-ignore -- FONT_STYLE is a valid scope for font-weight but not appear in the official type (VariableScope)
        if (tokenScopes.includes('FONT_STYLE')) {
          return 'number';
        }
      }

      return 'dimension';
    }
    case 'STRING': {
      return 'string';
    }
    case 'BOOLEAN':
      return 'boolean';
  }
}

export function tokenValueFromVariable(
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
