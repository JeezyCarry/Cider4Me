<script lang="ts">
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Image from 'lucide-svelte/icons/image';
  import Globe from 'lucide-svelte/icons/globe';
  import Pencil from 'lucide-svelte/icons/pencil';
  import { settingsState } from './settings-state.svelte';
  import type { ModelDraft } from './model-editor';
  import {
    cancelModelEdit,
    removeModel,
    removeProvider,
    saveModelDraft,
    setDefaultModel,
    setProviderApiKey,
    startEditModel,
    toggleModelSupportsImages,
    toggleModelWebSearch,
    updateModelDraft,
    updateProviderBaseUrl,
    updateProviderEnabled,
    updateProviderLabel,
  } from './settings-actions';
  import { getModelRef } from '../../lib/shared/model-registry';
  import { getI18n, localeStore } from '../../lib/i18n';
  import SaveIndicator from './SaveIndicator.svelte';

  let { providerId }: { providerId: string } = $props();

  const copy = $derived(getI18n($localeStore));
  const provider = $derived(settingsState.settings.providers.find((p) => p.id === providerId));
  const models = $derived(provider?.models ?? []);
  const apiKey = $derived(providerId in settingsState.secrets ? settingsState.secrets[providerId] : '');
  const showsBaseUrl = $derived(provider?.type === 'openrouter' || provider?.type === 'openai-compatible');
  const isEditingThisProvider = $derived(
    settingsState.form.editingModelProvider === providerId && settingsState.form.editingModelId,
  );
  const isDefault = (modelId: string) =>
    settingsState.settings.defaultModelId === getModelRef(providerId, modelId);
</script>

{#if provider}
  <article class="card provider-card">
    <div class="card-header compact-header">
      <div class="provider-title-row">
        <h2 class="provider-title">{provider.label || provider.type}</h2>
        <span class="provider-type-badge">{provider.type}</span>
      </div>
      <div class="card-header-actions">
        <SaveIndicator section={providerId} />
        <button
          class="ghost danger icon-only"
          type="button"
          onclick={() => removeProvider(providerId)}
          aria-label={copy.options.sections.providers.removeProviderAria(provider.label)}
          title={copy.options.sections.providers.removeProvider}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>

    <div class="provider-layout">
      <div class="provider-settings-column">
        <label>
          <span>{copy.options.sections.providers.label}</span>
          <input
            type="text"
            value={provider.label}
            spellcheck="false"
            oninput={(event) => updateProviderLabel(providerId, (event.currentTarget as HTMLInputElement).value)}
          />
        </label>

        {#if showsBaseUrl}
          <label>
            <span>{copy.options.sections.providers.baseUrl}</span>
            <input
              type="url"
              value={provider.baseUrl}
              spellcheck="false"
              placeholder="https://openrouter.ai/api/v1"
              oninput={(event) => updateProviderBaseUrl(providerId, (event.currentTarget as HTMLInputElement).value)}
            />
          </label>
        {/if}

        <label>
          <span>{copy.options.sections.providers.apiKey}</span>
          <input
            type="password"
            value={apiKey}
            spellcheck="false"
            oninput={(event) => setProviderApiKey(providerId, (event.currentTarget as HTMLInputElement).value)}
          />
        </label>

        <label class="toggle-card">
          <div>
            <span class="toggle-title">{copy.options.sections.providers.enabled}</span>
          </div>
          <input
            type="checkbox"
            checked={provider.enabled}
            onchange={(event) => updateProviderEnabled(providerId, (event.currentTarget as HTMLInputElement).checked)}
          />
        </label>

        <div class="model-draft">
          <div class="section-heading">
            <span>
              {isEditingThisProvider ? copy.common.save : copy.options.sections.providers.addModel}
            </span>
          </div>

          <label>
            <span>{copy.options.sections.providers.modelId}</span>
            <input
              type="text"
              value={settingsState.form.editingModelProvider === providerId ? settingsState.form.modelDraft.id : ''}
              placeholder="gpt-4o"
              oninput={(event) =>
                updateModelDraft(providerId, 'id', (event.currentTarget as HTMLInputElement).value)}
            />
          </label>
          <label>
            <span>{copy.options.sections.providers.modelLabel}</span>
            <input
              type="text"
              value={settingsState.form.editingModelProvider === providerId ? settingsState.form.modelDraft.label : ''}
              placeholder="GPT-4.1 Mini"
              oninput={(event) =>
                updateModelDraft(providerId, 'label', (event.currentTarget as HTMLInputElement).value)}
            />
          </label>
          <div class="model-draft-toggles">
            <label class="toggle-card">
              <div>
                <span class="toggle-title">{copy.options.sections.providers.modelEnabled}</span>
              </div>
              <input
                type="checkbox"
                checked={settingsState.form.editingModelProvider === providerId
                  ? settingsState.form.modelDraft.enabled
                  : true}
                onchange={(event) =>
                  updateModelDraft(providerId, 'enabled', (event.currentTarget as HTMLInputElement).checked)}
              />
            </label>
            <label class="toggle-card">
              <div>
                <span class="toggle-title toggle-title-with-icon">
                  <Image size={14} />
                  <span>{copy.options.sections.providers.supportsImages}</span>
                </span>
              </div>
              <input
                type="checkbox"
                checked={settingsState.form.editingModelProvider === providerId
                  ? settingsState.form.modelDraft.supportsImages
                  : false}
                onchange={(event) =>
                  updateModelDraft(providerId, 'supportsImages', (event.currentTarget as HTMLInputElement).checked)}
              />
            </label>
            <label class="toggle-card">
              <div>
                <span class="toggle-title toggle-title-with-icon">
                  <Globe size={14} />
                  <span>{copy.options.sections.providers.webSearch}</span>
                </span>
              </div>
              <input
                type="checkbox"
                checked={settingsState.form.editingModelProvider === providerId
                  ? settingsState.form.modelDraft.webSearchEnabled
                  : false}
                onchange={(event) =>
                  updateModelDraft(providerId, 'webSearchEnabled', (event.currentTarget as HTMLInputElement).checked)}
              />
            </label>
          </div>
          <label class="model-draft-select">
            <span class="toggle-title">{copy.options.sections.providers.thinkingLevel}</span>
            <select
              value={settingsState.form.editingModelProvider === providerId
                ? settingsState.form.modelDraft.thinkingLevel
                : ''}
              onchange={(event) =>
                updateModelDraft(providerId, 'thinkingLevel', (event.currentTarget as HTMLSelectElement).value as ModelDraft['thinkingLevel'])}
            >
              <option value="">{copy.options.sections.providers.thinkingLevelDefault}</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          {#if settingsState.form.editingModelProvider === providerId && settingsState.form.modelDraftError}
            <p class="error-text">{settingsState.form.modelDraftError}</p>
          {/if}

          <div class="model-draft-actions">
            <button class="secondary compact-action" type="button" onclick={() => cancelModelEdit(providerId)}>
              {copy.common.cancel}
            </button>
            <button class="primary compact-action" type="button" onclick={() => saveModelDraft(providerId)}>
              {isEditingThisProvider ? copy.common.save : copy.options.sections.providers.addModel}
            </button>
          </div>
        </div>
      </div>

      <div class="provider-models-column">
        <div class="section-heading">
          <div>
            <span>{copy.options.sections.providers.models}</span>
            <p class="muted">{copy.options.sections.providers.modelsBody}</p>
          </div>
        </div>

        <div class="stack compact-stack provider-model-list">
          {#if models.length === 0}
            <p class="muted">{copy.options.sections.providers.emptyModels}</p>
          {/if}

          {#each models as model (model.id)}
            <div class="model-row">
              <div class="model-row-header">
                <div class="model-row-copy" title={model.id}>
                  <strong>{model.label}</strong>
                  <span class="model-row-id">{model.id}</span>
                </div>
                <div class="model-row-actions">
                  <button
                    class:image-enabled={model.supportsImages}
                    class="ghost icon-only model-icon-button"
                    type="button"
                    onclick={() => toggleModelSupportsImages(providerId, model.id)}
                    aria-label={copy.options.sections.providers.toggleImagesAria(model.label, model.supportsImages)}
                    title={copy.options.sections.providers.toggleImagesAria(model.label, model.supportsImages)}
                  >
                    <Image size={15} />
                  </button>
                  <button
                    class:web-search-enabled={model.webSearchEnabled}
                    class="ghost icon-only model-icon-button"
                    type="button"
                    onclick={() => toggleModelWebSearch(providerId, model.id)}
                    aria-label={copy.options.sections.providers.toggleWebSearchAria(model.label, model.webSearchEnabled)}
                    title={copy.options.sections.providers.toggleWebSearchAria(model.label, model.webSearchEnabled)}
                  >
                    <Globe size={15} />
                  </button>
                  <button
                    class="ghost icon-only model-icon-button"
                    type="button"
                    onclick={() => startEditModel(providerId, model.id)}
                    aria-label={copy.options.sections.providers.edit}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    class="ghost danger icon-only model-icon-button"
                    type="button"
                    onclick={() => removeModel(providerId, model.id)}
                    aria-label={copy.options.sections.providers.removeModelAria(model.label)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div class="model-badges">
                {#if isDefault(model.id)}
                  <span class="model-badge default-badge">{copy.options.sections.providers.defaultLabel}</span>
                {:else}
                  <button
                    class="model-badge default-toggle-badge"
                    type="button"
                    onclick={() => setDefaultModel(providerId, model.id)}
                    aria-label={copy.options.sections.providers.setDefaultAria(model.label)}
                  >
                    {copy.options.sections.providers.makeDefault}
                  </button>
                {/if}
                {#if !model.enabled}
                  <span class="model-badge disabled-badge">{copy.options.sections.providers.disabledLabel}</span>
                {/if}
                {#if model.webSearchEnabled}
                  <span class="model-badge default-badge">{copy.options.sections.providers.webSearchBadge}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </article>
{/if}

<style>
  .card {
    padding: 24px;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid rgba(132, 204, 22, 0.15);
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
    width: 100%;
    box-sizing: border-box;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }
  .compact-header {
    margin-bottom: 2px;
  }
  .provider-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  h2 {
    margin: 0;
    font-size: 18px;
    color: #1e293b;
  }
  .provider-type-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 3px 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #475569;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
  }
  .card-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .muted {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
  }
  .provider-layout {
    display: grid;
    grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  .provider-settings-column,
  .provider-models-column {
    display: grid;
    gap: 12px;
    align-content: start;
  }
  .section-heading {
    display: grid;
    gap: 4px;
  }
  label {
    display: grid;
    gap: 6px;
    font-size: 14px;
    color: #475569;
  }
  input {
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    padding: 10px 12px;
    font: inherit;
    transition: border-color 140ms ease;
  }
  input:focus {
    outline: none;
    border-color: #84cc16;
  }
  .model-draft {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }
  .model-draft-toggles {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
  .toggle-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
  }
  .toggle-title {
    font-weight: 600;
    color: #1e293b;
  }
  .toggle-title-with-icon {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .error-text {
    margin: 0;
    color: #ef4444;
    font-size: 13px;
  }
  .model-draft-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .primary,
  .secondary,
  .ghost {
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font: inherit;
    transition: all 140ms ease;
  }
  .primary {
    background: linear-gradient(135deg, #84cc16, #65a30d);
    color: white;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(132, 204, 22, 0.25);
  }
  .primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(132, 204, 22, 0.35);
  }
  .secondary {
    background: #f1f5f9;
    color: #1e293b;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
  }
  .secondary:hover {
    background: #e2e8f0;
  }
  .ghost {
    background: transparent;
    color: #64748b;
  }
  .ghost:hover {
    background: #f8fafc;
    color: #1e293b;
  }
  .danger {
    color: #ef4444;
  }
  .danger:hover {
    background: #fef2f2;
  }
  .compact-action {
    padding: 8px 12px;
    border-radius: 10px;
  }
  .icon-only {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid #e2e8f0;
    background: #ffffff;
  }
  .stack {
    display: grid;
    gap: 10px;
  }
  .compact-stack {
    align-content: start;
  }
  .provider-model-list {
    max-height: 560px;
    overflow: auto;
    padding-right: 4px;
  }
  .model-row {
    display: grid;
    gap: 12px;
    padding: 14px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
  }
  .model-row-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }
  .model-row-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .model-row-copy strong {
    color: #1e293b;
  }
  .model-row-id {
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .model-row-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .model-icon-button {
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #64748b;
  }
  .model-icon-button.image-enabled {
    color: #16a34a;
    border-color: rgba(22, 163, 74, 0.2);
    background: rgba(22, 163, 74, 0.05);
  }
  .model-icon-button.web-search-enabled {
    color: #0284c7;
    border-color: rgba(2, 132, 199, 0.2);
    background: rgba(2, 132, 199, 0.05);
  }
  .model-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .model-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid #e2e8f0;
  }
  .default-badge {
    color: #65a30d;
    border-color: rgba(132, 204, 22, 0.3);
    background: rgba(132, 204, 22, 0.08);
  }
  .default-toggle-badge {
    cursor: pointer;
    color: #2563eb;
    background: rgba(37, 99, 235, 0.05);
    border-color: rgba(37, 99, 235, 0.15);
  }
  .default-toggle-badge:hover {
    background: rgba(37, 99, 235, 0.1);
  }
  .disabled-badge {
    color: #64748b;
    background: #f1f5f9;
  }

  @media (max-width: 900px) {
    .provider-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .model-draft-toggles {
      grid-template-columns: 1fr;
    }
    .model-row-header {
      flex-direction: column;
    }
    .provider-model-list {
      max-height: none;
      overflow: visible;
      padding-right: 0;
    }
  }
</style>
