import { describe, expect, test } from 'bun:test';
import { getModelSelectorValue } from '../src/modules/chat/model-selector-value';
import type { ModelConfig } from '../src/lib/shared/types';

describe('model selector option values', () => {
  const model: ModelConfig = {
    id: 'qwen/qwen3.5-9b',
    label: 'Qwen 3.5 9B',
    providerId: 'openrouter',
    enabled: true,
    supportsImages: true,
    webSearchEnabled: false,
  };

  test('uses the composite provider:model ref so it matches defaultModelId', () => {
    expect(getModelSelectorValue(model)).toBe('openrouter:qwen/qwen3.5-9b');
  });

  test('matches the active default model ref the chat selects against', () => {
    const defaultModelId = 'openrouter:qwen/qwen3.5-9b';
    expect(defaultModelId === getModelSelectorValue(model)).toBe(true);
  });
});
