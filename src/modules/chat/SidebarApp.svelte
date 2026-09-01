<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import SidebarHeader from './SidebarHeader.svelte';
  import ChatList from './ChatList.svelte';
  import InputSection from './InputSection.svelte';
  import ContextPanel from '../context/ContextPanel.svelte';
  import NextMessageContextBox from './NextMessageContextBox.svelte';
  import TakeInputPrompt from './TakeInputPrompt.svelte';
  import HistoryScreen from '../history/HistoryScreen.svelte';
  import SidebarToolbar from './SidebarToolbar.svelte';
  import { closeSidebar } from '../overlay/overlay-state.svelte';
  import { chatState } from './chat-state.svelte';
  import { attachPastedImage, clearComposer, clearPendingImage, submitChat, cancelChat, startEditingMessage, updateMessageInline } from './chat-actions';
  import { conversationState } from '../history/conversation-state.svelte';
  import { loadConversations, renameConversation, selectConversation, startNewConversation } from '../history/conversation-actions';
  import { contextState } from '../context/context-state.svelte';
  import { clearNextMessageContext, ensureFreshPageContext, removePinnedNextMessageContext, togglePageContextInChat } from '../context/context-actions';
  import { contentSettingsState } from '../settings/content/settings-state.svelte';
  import { savePublicSettings } from '../../lib/browser/storage';
  import { openSidebarScreen, resetSidebarScreen, returnToPreviousSidebarScreen, sidebarNavigationState } from './sidebar-navigation-state.svelte';
  import { getI18n, localeStore } from '../../lib/i18n';
  import { getAllModels } from '../../lib/shared/model-registry';
  import { buildChatExport, downloadChatExport } from './chat-export';
  import { resolveSelectedModelRef } from './chat-submit';

  const copy = $derived(getI18n($localeStore));
  const shouldShowNextMessageContext = $derived(
    Boolean(contextState.currentSelectionContext?.text) || contextState.explicitContextItems.length > 0,
  );
  const availableModels = $derived(getAllModels(contentSettingsState.settings));

  function handleExportChat(): void {
    const settings = contentSettingsState.settings;
    const activeMode = settings.modes?.find((m) => m.id === settings.activeModeId) ?? null;
    const payload = buildChatExport({
      messages: chatState.messages,
      baseSystemPrompt: settings.systemPrompt || '',
      activeMode,
      model: resolveSelectedModelRef(availableModels, settings.defaultModelId),
      explicitContext: contextState.explicitContextItems,
      selectionContext: contextState.currentSelectionContext,
      pageContext: contextState.pageContextSnapshot,
      userImageUrl: chatState.composer.pendingImage?.dataUrl ?? null,
    });
    const filename = `chat-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    downloadChatExport(payload, filename);
  }

  function handleCloseSidebar(): void {
    resetSidebarScreen();
    closeSidebar();
  }

  function handleTogglePageContext(): void {
    const nextEnabled = !contentSettingsState.settings.autoReadPage;
    togglePageContextInChat();
    if (nextEnabled) void ensureFreshPageContext();
  }

  function handleComposerSubmit(): void {
    if (contentSettingsState.settings.takeInputEnabled) {
      chatState.composer.takeInputPromptOpen = true;
      return;
    }
    void submitChat();
  }
  function handleTakeInputNo(): void {
    chatState.composer.takeInputPromptOpen = false;
    void submitChat({ takeInput: false });
  }
  function handleTakeInputTake(): void {
    chatState.composer.takeInputPromptOpen = false;
    void submitChat({ takeInput: true });
  }
  function handleTakeInputCancel(): void {
    chatState.composer.takeInputPromptOpen = false;
  }

  async function handleModelChange(value: string): Promise<void> {
    contentSettingsState.settings.defaultModelId = value;
    chatState.composer.error = '';
    await savePublicSettings(contentSettingsState.settings);
  }

  async function handleModeChange(value: string): Promise<void> {
    contentSettingsState.settings.activeModeId = value;
    await savePublicSettings(contentSettingsState.settings);
  }

  onMount(() => {
    void loadConversations();
  });

  // Sync fully hidden state for history screen and scroll
  $effect(() => {
    if (sidebarNavigationState.currentScreen === 'history') {
      chatState.isContextPanelFullyHidden = true;
    } else if (!chatState.isScrolledDown) {
      chatState.isContextPanelFullyHidden = false;
    }
  });
</script>

<div class="sidebar-app">
  <SidebarHeader title={copy.sidebar.title} onClose={handleCloseSidebar} />

  {#if sidebarNavigationState.currentScreen !== 'history' && !chatState.isScrolledDown}
    <div
      transition:slide={{ duration: 150 }}
      onintrostart={() => { chatState.isContextPanelFullyHidden = false; }}
      onoutroend={() => { chatState.isContextPanelFullyHidden = true; }}
      class="context-panel-wrapper"
    >
      <ContextPanel

        pageContext={contextState.pageContextSnapshot}
        pageContextStatus={contextState.pageContextStatus}
        pageContextInvalidationReason={contextState.pageContextInvalidationReason}
        lastPageContextCapturedAt={contextState.lastPageContextCapturedAt}
        pageContextEnabled={contextState.pageContextEnabled}
        onTogglePageContext={handleTogglePageContext}
        compact={true}
      />
    </div>
  {/if}

  <main class="body">
    {#if sidebarNavigationState.currentScreen === 'history'}
      <HistoryScreen
        conversations={conversationState.conversations}
        activeConversationId={chatState.activeConversationId}
        onBack={returnToPreviousSidebarScreen}
        onSelect={selectConversation}
        onRename={(id, title) => void renameConversation(id, title)}
      />
    {:else}
      <ChatList
        messages={chatState.messages}
        isLoading={chatState.isLoading}
        onEditMessage={(messageId) => void startEditingMessage(messageId)}
        onUpdateMessage={(messageId, content) => void updateMessageInline(messageId, content)}
      />
    {/if}
  </main>

  {#if sidebarNavigationState.currentScreen === 'chat'}
    <div class="footer-stack">
      {#if shouldShowNextMessageContext}
        <NextMessageContextBox
          liveSelectionContext={contextState.currentSelectionContext}
          pinnedContextItems={contextState.explicitContextItems}
          onRemovePinnedContext={removePinnedNextMessageContext}
          onClear={clearNextMessageContext}
        />
      {/if}

      <div class="composer-shell">
        <SidebarToolbar
          onNewChat={startNewConversation}
          onOpenHistory={() => openSidebarScreen('history')}
          models={availableModels}
          value={contentSettingsState.settings.defaultModelId}
          onModelChange={handleModelChange}
          modes={contentSettingsState.settings.modes || []}
          activeModeId={contentSettingsState.settings.activeModeId || 'default'}
          onModeChange={handleModeChange}
          pageContextEnabled={contextState.pageContextEnabled}
          onTogglePageContext={handleTogglePageContext}
          onExport={contentSettingsState.settings.debugMode ? handleExportChat : undefined}
          embedded={true}
        />
        <InputSection
          value={chatState.composer.text}
          disabled={chatState.isLoading}
          submitMode={contentSettingsState.settings.composerSubmitMode}
          pendingImage={chatState.composer.pendingImage}
          errorMessage={chatState.composer.error}
          isEditing={Boolean(chatState.editingMessageId)}
          editingNotice={chatState.editingBackupTitle ? copy.sidebar.composer.editingNotice(chatState.editingBackupTitle) : ''}
          onInput={(value) => {
            chatState.composer.text = value;
            chatState.composer.error = '';
          }}
          onSubmit={handleComposerSubmit}
          onCancel={cancelChat}
          onClearDraft={clearComposer}
          onPasteImage={(file) => void attachPastedImage(file)}
          onClearPendingImage={clearPendingImage}
          embedded={true}
        />
      </div>
      {#if chatState.composer.takeInputPromptOpen}
        <TakeInputPrompt
          onNo={handleTakeInputNo}
          onTake={handleTakeInputTake}
          onCancel={handleTakeInputCancel}
        />
      {/if}
    </div>
  {/if}
</div>

<style>
  .sidebar-app {
    display:flex;
    flex-direction:column;
    height:100%;
    min-height:0;
    gap:0;
  }

  .context-panel-wrapper {
    flex-shrink: 0;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .body {
    flex:1;
    min-height:0;
    margin:0 0 8px;
    display:flex;
    flex-direction:column;
    overflow:hidden;
  }

  .footer-stack {
    display:grid;
    gap:8px;
    padding-top:2px;
  }

  .composer-shell {
    display:grid;
    gap:8px;
    padding:8px;
    border-radius:24px;
    background:#ffffff;
    border:1px solid rgba(132, 204, 22, 0.2);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  }

  :global(.theme-dark) .composer-shell {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
</style>
