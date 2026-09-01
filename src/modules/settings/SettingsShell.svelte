<script lang="ts">
  import { onMount } from 'svelte';
  import { settingsState } from './settings-state.svelte';
  import { loadSettings } from './settings-actions';
  import { getI18n, localeStore } from '../../lib/i18n';

  import OverviewStats from './OverviewStats.svelte';
  import LanguageCard from './LanguageCard.svelte';
  import SystemPromptCard from './SystemPromptCard.svelte';
  import SearchProvidersCard from './SearchProvidersCard.svelte';
  import SiteBlocklistCard from './SiteBlocklistCard.svelte';
  import BehaviorCard from './BehaviorCard.svelte';
  import PromptTemplatesCard from './PromptTemplatesCard.svelte';
  import ProviderCard from './ProviderCard.svelte';
  import ModesCard from './ModesCard.svelte';
  import McpServersCard from './McpServersCard.svelte';
  import AdvancedCard from './AdvancedCard.svelte';
  import DebugModeFooter from './DebugModeFooter.svelte';
  import Plus from 'lucide-svelte/icons/plus';
  import { createProvider } from './settings-actions';
  import type { ProviderType } from '../../lib/shared/types';

  const copy = $derived(getI18n($localeStore));
  let systemDark = $state(false);

  const TYPE_BASE_URLS: Record<ProviderType, string> = {
    openrouter: 'https://openrouter.ai/api/v1',
    'openai-compatible': '',
    'google-gemini': '',
  };

  const TYPE_LABELS: Record<ProviderType, string> = {
    openrouter: 'OpenRouter',
    'openai-compatible': 'OpenAI-compatible',
    'google-gemini': 'Google / Gemini',
  };

  let showAddProvider = $state(false);
  let addType = $state<ProviderType>('openai-compatible');
  let addLabel = $state('');
  let addBaseUrl = $state('');

  function openAddProvider(): void {
    addType = 'openai-compatible';
    addLabel = TYPE_LABELS['openai-compatible'];
    addBaseUrl = TYPE_BASE_URLS['openai-compatible'];
    showAddProvider = true;
  }

  function changeAddType(event: Event): void {
    const type = (event.currentTarget as HTMLSelectElement).value as ProviderType;
    addType = type;
    addLabel = TYPE_LABELS[type];
    addBaseUrl = TYPE_BASE_URLS[type];
  }

  function confirmAddProvider(): void {
    createProvider(addType, addLabel, addBaseUrl);
    showAddProvider = false;
  }

  /** MCP settings UI is not ready for release yet. */
  const showMcpServersCard = false;

  const activeTheme = $derived.by(() => {
    const configTheme = settingsState.settings.theme;
    if (configTheme === 'system') {
      return systemDark ? 'dark' : 'light';
    }
    return configTheme || 'light';
  });

  onMount(() => {
    void loadSettings();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemDark = mediaQuery.matches;
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      systemDark = e.matches;
    };
    mediaQuery.addEventListener('change', handleMediaQueryChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  });
</script>

<svelte:head>
  <title>{copy.options.pageTitle}</title>
</svelte:head>

<section class="page" class:theme-dark={activeTheme === 'dark'}>

  <div class="container">
    <header class="hero">
      
      <div>
        <p class="eyebrow">{copy.options.eyebrow}</p>
        <h1>{copy.options.pageTitle}</h1>
        <p>{copy.options.heroBody}</p>
      </div>

      <div class="hero-actions">
        {#if settingsState.saveMessage}
          <div
            class="save-indicator"
            class:saving={settingsState.saveStatus === 'saving'}
            class:success={settingsState.saveStatus === 'success'}
            class:error={settingsState.saveStatus === 'error'}
            role="status"
            aria-live="polite"
          >
            {settingsState.saveMessage}
          </div>
        {/if}
      </div>
    </header>

    {#if settingsState.isLoading}
      <p>{copy.options.loadingSettings}</p>
    {:else}
      <OverviewStats />

      <div class="settings-grid">
        <LanguageCard />
        <SystemPromptCard />

        <SearchProvidersCard />
        <SiteBlocklistCard />

        <BehaviorCard />
        <PromptTemplatesCard />

        <div class="full-width">
          <ModesCard />
        </div>

        {#if showMcpServersCard}
          <div class="full-width">
            <McpServersCard />
          </div>
        {/if}

        <div class="full-width">
          <AdvancedCard />
        </div>

        <div class="full-width">
          <section class="providers-section" aria-label={copy.options.sections.providers.title}>
            <div class="providers-heading">
              <h2>{copy.options.sections.providers.title}</h2>
              <p class="muted">{copy.options.sections.providers.body}</p>
            </div>

            {#if settingsState.settings.providers.length === 0}
              <p class="muted">{copy.options.sections.providers.empty}</p>
            {/if}

            {#each settingsState.settings.providers as provider (provider.id)}
              <ProviderCard providerId={provider.id} />
            {/each}

            <button class="secondary add-provider" type="button" onclick={openAddProvider}>
              <Plus size={16} />
              {copy.options.sections.providers.addProvider}
            </button>

            {#if showAddProvider}
              <div class="add-provider-panel">
                <label>
                  <span>{copy.options.sections.providers.providerType}</span>
                  <select value={addType} onchange={changeAddType}>
                    <option value="openai-compatible">{copy.options.sections.providers.typeOpenaiCompatible}</option>
                    <option value="openrouter">{copy.options.sections.providers.typeOpenrouter}</option>
                    <option value="google-gemini">{copy.options.sections.providers.typeGoogleGemini}</option>
                  </select>
                </label>
                <label>
                  <span>{copy.options.sections.providers.label}</span>
                  <input type="text" bind:value={addLabel} />
                </label>
                <label>
                  <span>{copy.options.sections.providers.baseUrl}</span>
                  <input type="text" bind:value={addBaseUrl} placeholder="https://openrouter.ai/api/v1" />
                </label>
                <div class="add-provider-actions">
                  <button class="secondary compact-action" type="button" onclick={() => (showAddProvider = false)}>
                    {copy.common.cancel}
                  </button>
                  <button class="primary compact-action" type="button" onclick={confirmAddProvider}>
                    {copy.options.sections.providers.addProvider}
                  </button>
                </div>
              </div>
            {/if}
          </section>
        </div>
      </div>

      <DebugModeFooter />
    {/if}
    </div>
    </section>

    <style>
    .page {
    min-height: 100vh;
    background: #f9fafb;
    color: #0f172a;
    }
    .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px 80px;
    }
    /* ... hero styles ... */
    .hero {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    margin-bottom: 24px;
    }
    .hero-actions {
    display: grid;
    justify-items: end;
    gap: 10px;
    }
    .eyebrow {
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #65a30d;
    font-size: 12px;
    }
    h1 {
    margin: 0 0 8px;
    font-size: 40px;
    color: #1e293b;
    }
    .hero p:last-child {
    margin: 0;
    color: #64748b;
    max-width: 680px;
    }

    .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    align-items: stretch;
    }

    .full-width {
    grid-column: span 2;
    }

    @media (max-width: 1000px) {
    .settings-grid {
      grid-template-columns: 1fr;
    }
    .full-width {
      grid-column: span 1;
    }
    }

    .save-indicator {
    min-height: 20px;
    font-size: 13px;
    padding: 8px 12px;
    border-radius: 9999px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #475569;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
  }
  .save-indicator.saving {
    border-color: #93c5fd;
    color: #2563eb;
  }
  .save-indicator.success {
    border-color: #86efac;
    color: #16a34a;
  }
  .save-indicator.error {
    border-color: #fca5a5;
    color: #dc2626;
  }

  .providers-section {
    display: grid;
    gap: 16px;
  }
  .providers-heading {
    display: grid;
    gap: 4px;
  }
  .providers-heading h2 {
    margin: 0;
    font-size: 20px;
    color: #1e293b;
  }
  .add-provider {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .add-provider-panel {
    display: grid;
    gap: 12px;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr);
    padding: 16px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }
  .add-provider-panel label {
    display: grid;
    gap: 6px;
    font-size: 14px;
    color: #475569;
  }
  .add-provider-panel input,
  .add-provider-panel select {
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    padding: 10px 12px;
    font: inherit;
  }
  .add-provider-actions {
    display: flex;
    align-items: end;
    gap: 8px;
  }
  .compact-action {
    padding: 8px 12px;
    border-radius: 10px;
  }

  @media (max-width: 800px) {
    .add-provider-panel {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .hero {
      flex-direction: column;
    }
    .hero-actions {
      justify-items: start;
    }
  }

  .page.theme-dark {
    background: #0f172a;
    color: #f8fafc;
  }
  
  :global(.theme-dark h1) {
    color: #f8fafc;
  }
  :global(.theme-dark .hero p:last-child) {
    color: #94a3b8;
  }
  
  :global(.theme-dark .card) {
    background: #1e293b !important;
    border-color: rgba(148, 163, 184, 0.1) !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
  }
  
  :global(.theme-dark .card h2) {
    color: #f8fafc !important;
  }
  
  :global(.theme-dark .card .muted) {
    color: #94a3b8 !important;
  }
  
  :global(.theme-dark .card label) {
    color: #cbd5e1 !important;
  }
  
  :global(.theme-dark .toggle-card) {
    background: #0f172a !important;
    border-color: rgba(148, 163, 184, 0.1) !important;
  }
  
  :global(.theme-dark .toggle-title) {
    color: #f8fafc !important;
  }
  
  :global(.theme-dark .toggle-card small) {
    color: #94a3b8 !important;
  }
  
  :global(.theme-dark select),
  :global(.theme-dark input[type="text"]),
  :global(.theme-dark textarea) {
    background: #0f172a !important;
    border-color: rgba(148, 163, 184, 0.15) !important;
    color: #f8fafc !important;
  }

  :global(.theme-dark select:focus),
  :global(.theme-dark input[type="text"]:focus),
  :global(.theme-dark textarea:focus) {
    border-color: #84cc16 !important;
  }
  
  :global(.theme-dark .save-indicator) {
    background: #1e293b !important;
    border-color: rgba(148, 163, 184, 0.1) !important;
    color: #cbd5e1 !important;
  }
</style>
