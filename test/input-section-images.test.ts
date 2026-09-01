import { describe, expect, test } from 'bun:test';
import { getClipboardImageFile } from '../src/modules/chat/input-section-images';

describe('input section image helpers', () => {
  test('extracts the first clipboard image file', () => {
    const file = new File(['abc'], 'shot.png', { type: 'image/png' });
    const items = [
      {
        kind: 'string',
        type: 'text/plain',
        getAsFile: () => null,
      },
      {
        kind: 'file',
        type: 'image/png',
        getAsFile: () => file,
      },
    ] as unknown as DataTransferItemList;

    expect(getClipboardImageFile(items)).toBe(file);
  });

  test('returns null when there is no image file', () => {
    const items = [
      {
        kind: 'string',
        type: 'text/plain',
        getAsFile: () => null,
      },
    ] as unknown as DataTransferItemList;

    expect(getClipboardImageFile(items)).toBeNull();
  });
});
