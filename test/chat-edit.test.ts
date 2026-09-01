import { describe, expect, test } from 'bun:test';
import { buildConversationBackupTitle, prepareMessageEdit, shouldRegenerateOnEditSubmit } from '../src/modules/chat/chat-edit';

describe('chat edit helpers', () => {
  test('submitting an edit without changes still regenerates', () => {
    // Problem #14: editing the own last message and pressing Send with NO
    // change must still regenerate the following AI answer(s).
    expect(shouldRegenerateOnEditSubmit('Hello world')).toBe(true);
    expect(shouldRegenerateOnEditSubmit('Hello world   ')).toBe(true);
  });

  test('a blank edit does not submit', () => {
    expect(shouldRegenerateOnEditSubmit('')).toBe(false);
    expect(shouldRegenerateOnEditSubmit('   ')).toBe(false);
  });
  test('builds the next available backup title with numeric suffix', () => {
    expect(buildConversationBackupTitle('Plan', ['Plan', 'Plan (1)', 'Other', 'Plan (2)'])).toBe('Plan (3)');
  });

  test('normalizes existing suffixed titles before creating a new backup title', () => {
    expect(buildConversationBackupTitle('Plan (2)', ['Plan', 'Plan (1)', 'Plan (2)'])).toBe('Plan (3)');
  });

  test('prepares a user message for editing by truncating that message and later replies', () => {
    const prepared = prepareMessageEdit(
      [
        { id: 'u1', role: 'user', content: 'First', createdAt: '2026-04-01T09:00:00.000Z' },
        { id: 'a1', role: 'assistant', content: 'Answer', createdAt: '2026-04-01T09:00:01.000Z', status: 'done' },
        { id: 'u2', role: 'user', content: 'Second', createdAt: '2026-04-01T09:01:00.000Z' },
        { id: 'a2', role: 'assistant', content: 'Later', createdAt: '2026-04-01T09:01:01.000Z', status: 'done' },
      ],
      'u2',
    );

    expect(prepared).toEqual({
      draft: 'Second',
      retainedMessages: [
        { id: 'u1', role: 'user', content: 'First', createdAt: '2026-04-01T09:00:00.000Z' },
        { id: 'a1', role: 'assistant', content: 'Answer', createdAt: '2026-04-01T09:00:01.000Z', status: 'done' },
      ],
    });
  });

  test('returns null for non-user messages', () => {
    expect(
      prepareMessageEdit(
        [{ id: 'a1', role: 'assistant', content: 'Answer', createdAt: '2026-04-01T09:00:01.000Z', status: 'done' }],
        'a1',
      ),
    ).toBeNull();
  });
});
