<script lang="ts">
  import Loader2 from 'lucide-svelte/icons/loader-2';
  import Check from 'lucide-svelte/icons/check';
  import TriangleAlert from 'lucide-svelte/icons/triangle-alert';
  import { settingsState } from './settings-state.svelte';
  import { getI18n, localeStore } from '../../lib/i18n';

  let { section }: { section: string } = $props();

  const copy = $derived(getI18n($localeStore));
</script>

{#if settingsState.sectionStatus[section] && settingsState.sectionStatus[section] !== 'idle'}
  <div
    class="section-save-indicator"
    class:success={settingsState.sectionStatus[section] === 'success'}
    class:error={settingsState.sectionStatus[section] === 'error'}
  >
    {#if settingsState.sectionStatus[section] === 'saving'}
      <Loader2 size={14} class="spin" />
    {:else if settingsState.sectionStatus[section] === 'success'}
      <Check size={14} />
      <span>{copy.options.saveFeedback.success}</span>
    {:else if settingsState.sectionStatus[section] === 'error'}
      <TriangleAlert size={14} />
    {/if}
  </div>
{/if}

<style>
  .section-save-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
    background: #f8fafc;
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  .section-save-indicator.success {
    color: #16a34a;
    border-color: rgba(22, 163, 74, 0.2);
  }
  .section-save-indicator.error {
    color: #dc2626;
    border-color: rgba(220, 38, 38, 0.2);
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  :global(.spin) {
    animation: spin 1s linear infinite;
  }
</style>
