<script lang="ts">
  import type { PageContext, PageContextInvalidationReason, PageContextStatus } from '../../lib/shared/types';
  import { getI18n, localeStore } from '../../lib/i18n';

  interface Props {
    pageContext: PageContext | null;
    pageContextStatus: PageContextStatus;
    pageContextInvalidationReason: PageContextInvalidationReason | null;
    lastPageContextCapturedAt: string | null;
    pageContextEnabled: boolean;
    onTogglePageContext: () => void;
    compact?: boolean;
    embedded?: boolean;
  }

  let {
    pageContext,
    pageContextStatus,
    pageContextInvalidationReason,
    lastPageContextCapturedAt,
    pageContextEnabled,
    onTogglePageContext,
    compact = false,
    embedded = false,
  }: Props = $props();
  const copy = $derived(getI18n($localeStore));

  function formatContextTimestamp(value: string | null): string | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    const seconds = String(parsed.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const statusText = $derived.by(() => {
    switch (pageContextStatus) {
      case 'fresh':
        return copy.sidebar.contextPanel.statusFresh;
      case 'stale':
        return copy.sidebar.contextPanel.statusStale(pageContextInvalidationReason ?? 'manual');
      case 'refreshing':
        return copy.sidebar.contextPanel.statusRefreshing;
      case 'error':
        return copy.sidebar.contextPanel.statusError;
      default:
        return copy.sidebar.contextPanel.statusIdle;
    }
  });

  const detailText = $derived.by(() => {
    const formattedTimestamp = formatContextTimestamp(lastPageContextCapturedAt);
    if (!formattedTimestamp) return statusText;
    if (pageContextStatus === 'fresh') return copy.sidebar.contextPanel.statusFreshAt(formattedTimestamp);
    return `${statusText} · ${copy.sidebar.contextPanel.capturedAt(formattedTimestamp)}`;
  });
</script>

<section class:compact class:embedded class="panel">
  <div class="header-row">
    <div class="header-text">
      <h3>{copy.sidebar.contextPanel.title}</h3>
      <p class="muted" title={pageContext?.title ?? ''}>{pageContext ? copy.sidebar.contextPanel.pageTitle(pageContext.title) : copy.sidebar.contextPanel.empty}</p>
      <p class="status">{detailText}</p>
    </div>
    <div class="tooltip-anchor">
      <button class:active={pageContextEnabled} class="toggle-button" onclick={onTogglePageContext}>
        {pageContextEnabled ? copy.sidebar.contextPanel.on : copy.sidebar.contextPanel.off}
      </button>
      <div class="tooltip" role="tooltip">
        {pageContextEnabled
          ? copy.sidebar.contextPanel.tooltipOn
          : copy.sidebar.contextPanel.tooltipOff}
      </div>
    </div>
  </div>
</section>

<style>
  .panel {
    padding:10px 12px;
    border-radius:14px;
    background:#ffffff;
    border:1px solid rgba(132, 204, 22, 0.15);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  }
  .panel.compact { margin-bottom:0; }
  .panel:not(.compact) { margin-bottom:10px; }
  .panel.embedded {
    padding:12px 12px 10px;
    border-radius:18px;
    background:#ffffff;
    border:1px solid rgba(132, 204, 22, 0.2);
  }
  .header-row { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
  .header-text { min-width:0; }
  h3 { margin:0; font-size:14px; color: #000000; }
  .muted {
    margin:0;
    color:#64748b;
    font-size:13px;
    line-height:1.35;
    line-clamp:2;
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
    overflow:hidden;
  }
  .status {
    margin:6px 0 0;
    color:#475569;
    font-size:12px;
    line-height:1.35;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .tooltip-anchor { position:relative; display:inline-flex; }
  .toggle-button {
    border:none;
    border-radius:9999px;
    padding:7px 11px;
    background:#f1f5f9;
    color:#475569;
    font:inherit;
    white-space:nowrap;
    cursor:pointer;
    transition:all .16s ease;
  }
  .toggle-button.active { background:rgba(132, 204, 22, 0.1); color:#65a30d; border:1px solid rgba(132, 204, 22, 0.2); }
  .toggle-button:hover { transform:translateY(-1px); background: #e2e8f0; color: #1e293b; }
  .toggle-button:focus-visible {
    outline:none;
    box-shadow:0 0 0 3px rgba(132, 204, 22, 0.2);
  }
  .tooltip {
    position:absolute;
    top:calc(100% + 8px);
    right:0;
    width:210px;
    padding:8px 10px;
    border-radius:10px;
    background:#ffffff;
    border:1px solid #e2e8f0;
    color:#475569;
    font-size:12px;
    line-height:1.4;
    box-shadow:0 12px 24px rgba(0, 0, 0, 0.08);
    opacity:0;
    pointer-events:none;
    transform:translateY(-4px);
    transition:opacity .16s ease, transform .16s ease;
    z-index:2;
  }
  .tooltip-anchor:hover .tooltip,
  .tooltip-anchor:focus-within .tooltip {
    opacity:1;
    transform:translateY(0);
  }

  :global(.theme-dark) .panel,
  :global(.theme-dark) .panel.embedded {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  :global(.theme-dark) h3 {
    color: #f8fafc;
  }
  :global(.theme-dark) .muted {
    color: #94a3b8;
  }
  :global(.theme-dark) .status {
    color: #64748b;
  }
  :global(.theme-dark) .toggle-button {
    background: #0f172a;
    color: #cbd5e1;
  }
  :global(.theme-dark) .toggle-button.active {
    background: rgba(132, 204, 22, 0.15);
    color: #a3e635;
    border-color: rgba(132, 204, 22, 0.3);
  }
  :global(.theme-dark) .toggle-button:hover {
    background: #334155;
    color: #f8fafc;
  }
  :global(.theme-dark) .tooltip {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #cbd5e1;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 260px) {
    .status { white-space:normal; }
  }

  @media (max-width: 520px) {
    .header-row { flex-direction:column; }
  }
</style>
