import { describe, expect, test } from 'bun:test';
import { getComposerKeyboardHint, shouldSubmitComposerFromKeyboard } from '../src/modules/chat/input-section-keyboard';

describe('input section keyboard helpers', () => {
  test('returns the correct keyboard hint for enter mode in English', () => {
    expect(getComposerKeyboardHint('enter')).toBe('Enter sends · Shift+Enter adds a newline');
  });

  test('returns the correct keyboard hint for shift-enter mode in English', () => {
    expect(getComposerKeyboardHint('shift-enter')).toBe('Shift+Enter sends · Enter adds a newline');
  });

  test('returns the correct keyboard hint for enter mode in Dutch', () => {
    expect(getComposerKeyboardHint('enter', 'nl')).toBe('Enter verstuurt · Shift+Enter voegt een nieuwe regel toe');
  });

  test('submits on Enter in enter mode', () => {
    expect(
      shouldSubmitComposerFromKeyboard({
        disabled: false,
        submitMode: 'enter',
        key: 'Enter',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        isComposing: false,
      }),
    ).toBe(true);
  });

  test('submits on Shift+Enter in shift-enter mode', () => {
    expect(
      shouldSubmitComposerFromKeyboard({
        disabled: false,
        submitMode: 'shift-enter',
        key: 'Enter',
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        isComposing: false,
      }),
    ).toBe(true);
  });

  test('does not submit on plain Enter in shift-enter mode', () => {
    expect(
      shouldSubmitComposerFromKeyboard({
        disabled: false,
        submitMode: 'shift-enter',
        key: 'Enter',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        isComposing: false,
      }),
    ).toBe(false);
  });

  test('does not submit while composing or with modifier keys', () => {
    expect(
      shouldSubmitComposerFromKeyboard({
        disabled: false,
        submitMode: 'enter',
        key: 'Enter',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        isComposing: true,
      }),
    ).toBe(false);

    expect(
      shouldSubmitComposerFromKeyboard({
        disabled: false,
        submitMode: 'enter',
        key: 'Enter',
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false,
        isComposing: false,
      }),
    ).toBe(false);
  });
});
