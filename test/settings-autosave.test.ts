import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { updateSetting, updatePromptTemplate } from '../src/modules/settings/settings-actions';
import { settingsState } from '../src/modules/settings/settings-state.svelte';

// Mock storage
mock.module('../src/lib/browser/storage', () => ({
  getSettings: async () => ({ ...settingsState.settings }),
  saveSettings: mock(async () => {}),
}));

// Mock runtime
mock.module('../src/lib/browser/runtime', () => ({
  sendRuntimeMessage: async () => ({}),
  connectRuntimePort: () => ({
    onMessage: { addListener: () => {} },
    onDisconnect: { addListener: () => {} },
    disconnect: () => {},
    postMessage: () => {},
  }),
}));

// Mock tabs
mock.module('../src/lib/browser/tabs', () => ({
  reloadTabsMatchingDomains: async () => ({}),
}));

describe('Settings Auto-save', () => {
  beforeEach(() => {
    // Reset state
    settingsState.saveStatus = 'idle';
    settingsState.sectionStatus = {};
    mock.restore();
  });

  it('calls persistSettings immediately for language changes', async () => {
    updateSetting('locale', 'nl');
    expect(settingsState.settings.locale).toBe('nl');
    expect(settingsState.sectionStatus['language']).toBeDefined();
  });

  it('debounces system prompt changes', async () => {
    updateSetting('systemPrompt', 'test 1');
    updateSetting('systemPrompt', 'test 2');
    
    expect(settingsState.settings.systemPrompt).toBe('test 2');
    
    // Wait for debounce (800ms + margin)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    expect(settingsState.sectionStatus['system-prompt']).toBeDefined();
  });

  it('updates nested prompt templates and triggers auto-save', async () => {
    updatePromptTemplate('explainSelection', 'Explain this: {{selection}}');
    expect(settingsState.settings.promptTemplates.explainSelection).toBe('Explain this: {{selection}}');
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    expect(settingsState.sectionStatus['prompt-templates']).toBeDefined();
  });
});
