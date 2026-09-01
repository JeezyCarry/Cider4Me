<script lang="ts">
  import { settingsState } from './settings-state.svelte';
  import { getI18n, localeStore } from '../../lib/i18n';
  import { getAllModels } from '../../lib/shared/model-registry';

  const copy = $derived(getI18n($localeStore));
  const allModels = $derived(getAllModels(settingsState.settings));
</script>

<section class="overview" aria-label={copy.options.overviewAria}>
  <article class="overview-card">
    <span class="overview-label">{copy.options.overview.models.label}</span>
    <strong>{allModels.length}</strong>
    <p>{copy.options.overview.models.body}</p>
  </article>
  <article class="overview-card">
    <span class="overview-label">{copy.options.overview.blockedSites.label}</span>
    <strong>{settingsState.settings.siteAccessPolicy.domains.length}</strong>
    <p>{copy.options.overview.blockedSites.body}</p>
  </article>
  <article class="overview-card">
    <span class="overview-label">{copy.options.overview.searchProviders.label}</span>
    <strong>{settingsState.settings.searchEngines.length}</strong>
    <p>{copy.options.overview.searchProviders.body}</p>
  </article>
</section>

<style>
  .overview {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .overview-card {
    padding: 16px 18px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid rgba(132, 204, 22, 0.15);
    display: grid;
    gap: 4px;
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.05),
      0 2px 4px -2px rgb(0 0 0 / 0.05);
  }
  .overview-label {
    color: #64748b;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .overview-card strong {
    font-size: 28px;
    line-height: 1;
    color: #1e293b;
  }
  .overview-card p {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
  }

  @media (max-width: 900px) {
    .overview {
      grid-template-columns: 1fr;
    }
  }
</style>
