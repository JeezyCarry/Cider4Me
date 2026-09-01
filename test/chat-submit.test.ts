import { describe, expect, test } from 'bun:test';
import { getImageCompatibilityError, resolveSelectedModel, resolveSelectedModelRef } from '../src/modules/chat/chat-submit';

const models = [
  { id: 'a', label: 'A', providerId: 'openrouter', enabled: true, supportsImages: false, webSearchEnabled: false },
  { id: 'b', label: 'B', providerId: 'openrouter', enabled: true, supportsImages: true, webSearchEnabled: true },
];

describe('chat submit helpers', () => {
  test('resolves the selected model by composite reference', () => {
    const model = resolveSelectedModel(models, 'openrouter:b');
    expect(model?.id).toBe('b');
    expect(model?.providerId).toBe('openrouter');
  });

  test('resolveSelectedModelRef returns the composite reference', () => {
    expect(resolveSelectedModelRef(models, 'openrouter:b')).toBe('openrouter:b');
    expect(resolveSelectedModelRef(models, 'openrouter:a')).toBe('openrouter:a');
  });

  test('falls back to the default reference when no model matches', () => {
    expect(resolveSelectedModelRef(models, 'unknown:m')).toBe('openrouter:a');
  });

  test('returns an error when an image is queued for a non-image model', () => {
    const error = getImageCompatibilityError(
      { id: 'a', label: 'A', providerId: 'openrouter', enabled: true, supportsImages: false, webSearchEnabled: false },
      true,
      'Images are not supported.',
    );

    expect(error).toBe('Images are not supported.');
  });

  test('allows sending when no image is queued or the model supports images', () => {
    expect(
      getImageCompatibilityError(
        { id: 'a', label: 'A', providerId: 'openrouter', enabled: true, supportsImages: true, webSearchEnabled: true },
        true,
        'Images are not supported.',
      ),
    ).toBe('');

    expect(
      getImageCompatibilityError(
        { id: 'a', label: 'A', providerId: 'openrouter', enabled: true, supportsImages: false, webSearchEnabled: false },
        false,
        'Images are not supported.',
      ),
    ).toBe('');
  });
});
