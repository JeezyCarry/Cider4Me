<script lang="ts">
  import { untrack } from 'svelte';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import MessageCircleMore from 'lucide-svelte/icons/message-circle-more';
  import type { Conversation } from '../../lib/shared/types';
  import { getI18n, localeStore } from '../../lib/i18n';
  import { stripTrailingCopySuffix } from '../../lib/shared/title';

  interface Props {
    conversations: Conversation[];
    activeConversationId: string | null;
    onBack: () => void;
    onSelect: (id: string) => void;
    onRename: (id: string, title: string) => void;
  }

  interface HistoryGroup {
    key: string;
    parent: Conversation;
    related: Conversation[];
  }

  let { conversations, activeConversationId, onBack, onSelect, onRename }: Props = $props();

  let editingConversationId = $state<string | null>(null);
  let draftTitle = $state('');
  let expandedGroups = $state<Record<string, boolean>>({});
  const copy = $derived(getI18n($localeStore));

  function getBaseTitle(title: string): string {
    return stripTrailingCopySuffix(title).trim();
  }

  function buildGroups(items: Conversation[]): HistoryGroup[] {
    const grouped: Record<string, Conversation[]> = {};

    for (const conversation of items) {
      // Prioritize explicit branching ID, fallback to base title for older chats
      const key = conversation.metadata.branchGroupId || getBaseTitle(conversation.title);
      const existing = grouped[key] ?? [];
      existing.push(conversation);
      grouped[key] = existing;
    }

    return Object.entries(grouped).map(([key, groupItems]) => {
      // The newest one in the group is usually the primary/current branch
      const sorted = [...groupItems].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const parent = sorted[0];
      const related = sorted.slice(1);
      return { key, parent, related };
    });
  }

  const historyGroups = $derived(buildGroups(conversations));

  $effect(() => {
    const nextExpandedGroups = { ...untrack(() => expandedGroups) };

    for (const group of historyGroups) {
      const hasActiveConversation = group.parent.id === activeConversationId || group.related.some((conversation) => conversation.id === activeConversationId);
      if (hasActiveConversation) nextExpandedGroups[group.key] = true;
      if (!(group.key in nextExpandedGroups)) nextExpandedGroups[group.key] = false;
    }

    expandedGroups = nextExpandedGroups;
  });

  function startRename(conversation: Conversation): void {
    editingConversationId = conversation.id;
    draftTitle = conversation.title;
  }

  function submitRename(id: string): void {
    const nextTitle = draftTitle.trim();
    if (nextTitle) onRename(id, nextTitle);
    editingConversationId = null;
    draftTitle = '';
  }

  function cancelRename(): void {
    editingConversationId = null;
    draftTitle = '';
  }

  function stopKeyboardPropagation(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  function isExpanded(groupKey: string): boolean {
    return Boolean(expandedGroups[groupKey]);
  }

  function toggleGroup(groupKey: string): void {
    expandedGroups = {
      ...expandedGroups,
      [groupKey]: !expandedGroups[groupKey],
    };
  }
</script>

<section class="history-screen" aria-label={copy.sidebar.history.screenAria}>
  <div class="history-header">
    <button class="back-button" onclick={onBack} aria-label={copy.sidebar.history.backToChatAria}>← {copy.sidebar.history.backLabel}</button>
    <h3>{copy.sidebar.history.title}</h3>
  </div>

  {#if conversations.length === 0}
    <p class="empty">{copy.sidebar.history.empty}</p>
  {:else}
    <ul class="history-list">
      {#each historyGroups as group (group.key)}
        <li class:active={group.parent.id === activeConversationId || group.related.some((conversation) => conversation.id === activeConversationId)}>
          <div class="history-card">
            <div class="history-row">
              {#if editingConversationId === group.parent.id}
                <input
                  bind:value={draftTitle}
                  maxlength="120"
                  aria-label={copy.sidebar.history.conversationTitleAria}
                  onkeydown={(event) => {
                    event.stopPropagation();
                    if (event.key === 'Enter') submitRename(group.parent.id);
                    if (event.key === 'Escape') cancelRename();
                  }}
                  onkeyup={stopKeyboardPropagation}
                  onkeypress={stopKeyboardPropagation}
                />
              {:else}
                <button class="conversation-button" onclick={() => onSelect(group.parent.id)}>
                  <span>{group.parent.title}</span>
                  <small>{new Date(group.parent.updatedAt).toLocaleString($localeStore)}</small>
                </button>
              {/if}

              <div class="row-actions">
                {#if group.related.length > 0}
                  <button class="group-toggle" type="button" onclick={() => toggleGroup(group.key)} aria-expanded={isExpanded(group.key)}>
                    <span class="group-count">
                      <MessageCircleMore size={14} />
                      <strong>{group.related.length}</strong>
                    </span>
                    <span class:expanded={isExpanded(group.key)} class="chevron"><ChevronDown size={16} /></span>
                  </button>
                {/if}

                {#if editingConversationId === group.parent.id}
                  <div class="actions">
                    <button class="save-button" onclick={() => submitRename(group.parent.id)}>{copy.common.save}</button>
                    <button class="ghost-button" onclick={cancelRename}>{copy.common.cancel}</button>
                  </div>
                {:else}
                  <button class="ghost-button" onclick={() => startRename(group.parent)} aria-label={copy.sidebar.history.renameAria(group.parent.title)}>{copy.sidebar.history.rename}</button>
                {/if}
              </div>
            </div>

            {#if group.related.length > 0 && isExpanded(group.key)}
              <ul class="related-list">
                {#each group.related as relatedConversation (relatedConversation.id)}
                  <li class:active-child={relatedConversation.id === activeConversationId}>
                    <div class="history-row related-row">
                      {#if editingConversationId === relatedConversation.id}
                        <input
                          bind:value={draftTitle}
                          maxlength="120"
                          aria-label={copy.sidebar.history.conversationTitleAria}
                          onkeydown={(event) => {
                            event.stopPropagation();
                            if (event.key === 'Enter') submitRename(relatedConversation.id);
                            if (event.key === 'Escape') cancelRename();
                          }}
                          onkeyup={stopKeyboardPropagation}
                          onkeypress={stopKeyboardPropagation}
                        />
                      {:else}
                        <button class="conversation-button related-button" onclick={() => onSelect(relatedConversation.id)}>
                          <span>{relatedConversation.title}</span>
                          <small>{new Date(relatedConversation.updatedAt).toLocaleString($localeStore)}</small>
                        </button>
                      {/if}

                      {#if editingConversationId === relatedConversation.id}
                        <div class="actions">
                          <button class="save-button" onclick={() => submitRename(relatedConversation.id)}>{copy.common.save}</button>
                          <button class="ghost-button" onclick={cancelRename}>{copy.common.cancel}</button>
                        </div>
                      {:else}
                        <button class="ghost-button" onclick={() => startRename(relatedConversation)} aria-label={copy.sidebar.history.renameAria(relatedConversation.title)}>{copy.sidebar.history.rename}</button>
                      {/if}
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .history-screen { display:flex; flex-direction:column; gap:12px; min-height:0; flex:1; }
  .history-header { display:flex; align-items:center; gap:10px; flex-shrink:0; margin-bottom: 4px; }
  h3 { margin:0; font-size:15px; color: #0f172a; }
  .back-button, .ghost-button, .save-button, .conversation-button, .group-toggle, input { font:inherit; }
  .back-button, .ghost-button, .save-button, .group-toggle {
    border:none;
    border-radius:10px;
    cursor:pointer;
    padding:8px 10px;
    transition: all 140ms ease;
  }
  .back-button { background:#f1f5f9; color:#475569; border: 1px solid #e2e8f0; }
  .back-button:hover { background: #e2e8f0; color: #1e293b; }
  .ghost-button { background:transparent; color:#64748b; }
  .ghost-button:hover { background:#f8fafc; color:#1e293b; }
  .save-button { background:rgba(132, 204, 22, 0.1); color:#65a30d; border: 1px solid rgba(132, 204, 22, 0.2); }
  .save-button:hover { background: rgba(132, 204, 22, 0.15); }
  .empty { margin:0; color:#64748b; font-size:14px; }
  .history-list { list-style:none; padding:0; margin:0; display:grid; gap:8px; overflow:auto; flex:1; align-content:start; }
  li { border:1px solid #e2e8f0; border-radius:14px; background:#ffffff; transition:all .16s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
  li:hover { border-color:rgba(132, 204, 22, 0.3); background:#f9fafb; }
  li.active { border-color:rgba(132, 204, 22, 0.4); background:rgba(132, 204, 22, 0.03); box-shadow:0 0 0 1px rgba(132, 204, 22, 0.1) inset; }
  .history-card { display:grid; gap:0; }
  .history-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; align-items:center; padding:8px 12px; }
  .conversation-button { width:100%; text-align:left; border:none; background:transparent; color:#1e293b; cursor:pointer; padding:2px; display:grid; gap:4px; }
  .conversation-button span { font-size:13px; font-weight:500; line-height:1.35; color:#0f172a; }
  .row-actions { display:flex; align-items:center; gap:8px; }
  .group-toggle {
    display:flex;
    align-items:center;
    gap:6px;
    background:#f1f5f9;
    color:#475569;
    border: 1px solid #e2e8f0;
    min-width:0;
    padding:6px 10px;
    border-radius:10px;
    transition:all .16s ease;
  }
  .group-toggle:hover { background:#e2e8f0; color: #1e293b; transform:translateY(-1px); }
  .group-count { display:flex; align-items:center; gap:6px; }
  .group-count strong { font-size:13px; }
  .chevron { display:grid; place-items:center; transition:transform .2s cubic-bezier(0.4, 0, 0.2, 1); }
  .chevron.expanded { transform:rotate(180deg); }
  .related-list {
    list-style:none;
    margin:0;
    padding:0 8px 8px;
    display:grid;
    gap:6px;
  }
  .related-list li {
    border:1px solid #f1f5f9;
    border-radius:12px;
    background:#f8fafc;
  }
  .related-list li.active-child {
    border-color:rgba(132, 204, 22, 0.2);
    background:rgba(132, 204, 22, 0.05);
  }
  .related-row {
    padding:6px 8px 6px 12px;
  }
  .related-button span {
    font-size:12px;
    font-weight:400;
    color: #475569;
  }
  .active-child .related-button span { color: #1e293b; font-weight: 500; }
  small { color:#475569; font-size:11px; }
  input { width:100%; border-radius:10px; border:1px solid #cbd5e1; background:#ffffff; color:#0f172a; padding:8px 12px; font-size:13px; }
  input:focus { outline: none; border-color: #84cc16; }
  .actions { display:flex; gap:6px; }
  .save-button { font-size:12px; padding:6px 12px; }

  :global(.theme-dark) h3 {
    color: #f8fafc;
  }
  :global(.theme-dark) .back-button {
    background: #1e293b;
    color: #cbd5e1;
    border-color: rgba(148, 163, 184, 0.15);
  }
  :global(.theme-dark) .back-button:hover {
    background: #334155;
    color: #f8fafc;
  }
  :global(.theme-dark) .ghost-button {
    color: #94a3b8;
  }
  :global(.theme-dark) .ghost-button:hover {
    background: #1e293b;
    color: #cbd5e1;
  }
  :global(.theme-dark) .save-button {
    background: rgba(132, 204, 22, 0.15);
    color: #a3e635;
    border-color: rgba(132, 204, 22, 0.3);
  }
  :global(.theme-dark) .save-button:hover {
    background: rgba(132, 204, 22, 0.25);
  }
  :global(.theme-dark) li {
    border-color: rgba(148, 163, 184, 0.15);
    background: #0f172a;
    box-shadow: none;
  }
  :global(.theme-dark) li:hover {
    border-color: rgba(132, 204, 22, 0.3);
    background: #1e293b;
  }
  :global(.theme-dark) li.active {
    border-color: rgba(132, 204, 22, 0.4);
    background: rgba(132, 204, 22, 0.08);
  }
  :global(.theme-dark) .conversation-button span {
    color: #f8fafc;
  }
  :global(.theme-dark) .group-toggle {
    background: #1e293b;
    color: #cbd5e1;
    border-color: rgba(148, 163, 184, 0.15);
  }
  :global(.theme-dark) .group-toggle:hover {
    background: #334155;
    color: #f8fafc;
  }
  :global(.theme-dark) .related-list li {
    border-color: rgba(148, 163, 184, 0.1);
    background: #1e293b;
  }
  :global(.theme-dark) .related-list li.active-child {
    border-color: rgba(132, 204, 22, 0.3);
    background: rgba(132, 204, 22, 0.08);
  }
  :global(.theme-dark) .related-button span {
    color: #cbd5e1;
  }
  :global(.theme-dark) .active-child .related-button span {
    color: #f8fafc;
  }
  :global(.theme-dark) small {
    color: #64748b;
  }
  :global(.theme-dark) input {
    border-color: rgba(148, 163, 184, 0.15);
    background: #0f172a;
    color: #f8fafc;
  }
</style>
