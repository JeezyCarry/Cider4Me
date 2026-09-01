<script lang="ts">
  import type { ExplicitContextItem, SelectionContext } from '../../lib/shared/types';
  import { getI18n, localeStore } from '../../lib/i18n';

  interface Props {
    liveSelectionContext: SelectionContext | null;
    pinnedContextItems: ExplicitContextItem[];
    onRemovePinnedContext: (id: string) => void;
    onClear: () => void;
  }

  let { liveSelectionContext, pinnedContextItems, onRemovePinnedContext, onClear }: Props = $props();
  const copy = $derived(getI18n($localeStore));

  let expanded = $state(false);
  // Overflow is measured on the rendered element (not a char-count guess), so
  // the expand toggle only appears when the text is actually clamped/ellipsized.
  let liveEl = $state<HTMLParagraphElement | null>(null);
  let liveClientWidth = $state(0);
  let liveClientHeight = $state(0);
  let measuredOverflow = $state(false);

  const liveText = $derived(liveSelectionContext?.text ?? '');
  /** Short, single-line selections render as a compact inline card (problem #16). */
  const isCompact = $derived(Boolean(liveText) && !liveText.includes('\n') && liveText.length <= 96);
  /** Once expanded the measurements say "no overflow", so keep the toggle as a collapse button. */
  const showExpand = $derived(measuredOverflow || expanded);

  $effect(() => {
    // Re-measure whenever the text or the rendered box size changes.
    void liveText;
    void isCompact;
    void liveClientWidth;
    void liveClientHeight;
    const el = liveEl;
    measuredOverflow = el ? (isCompact ? el.scrollWidth > el.clientWidth : el.scrollHeight > el.clientHeight) : false;
  });

  $effect(() => {
    // A new selection starts collapsed again.
    void liveText;
    expanded = false;
  });

  function toggleExpanded(): void {
    expanded = !expanded;
  }
</script>

<section class="context-box" aria-label={copy.sidebar.nextMessageContext.sectionAria}>
  {#if liveSelectionContext?.text}
    <article class="snippet live" class:compact={isCompact}>
      {#if isCompact}
        <span class="badge">{copy.sidebar.nextMessageContext.liveSelection}</span>
        <p class="live-text" class:expanded bind:this={liveEl} bind:clientWidth={liveClientWidth} bind:clientHeight={liveClientHeight}>
          {liveText}
          {#if showExpand}
            <button class="expand-dots" type="button" onclick={toggleExpanded} aria-expanded={expanded} aria-label={copy.sidebar.nextMessageContext.expandAria}>…</button>
          {/if}
        </p>
        <div class="live-actions">
          <div class="tooltip-anchor">
            <button class="info-affordance" type="button" aria-label={copy.sidebar.nextMessageContext.infoAria}>i</button>
            <div class="tooltip" role="tooltip">{copy.sidebar.nextMessageContext.tooltip}</div>
          </div>
          <button class="clear-affordance" type="button" onclick={onClear} aria-label={copy.sidebar.nextMessageContext.clearAria}>{copy.common.clear}</button>
        </div>
      {:else}
        <div class="snippet-top">
          <span class="badge">{copy.sidebar.nextMessageContext.liveSelection}</span>
          <div class="live-actions">
            <div class="tooltip-anchor">
              <button class="info-affordance" type="button" aria-label={copy.sidebar.nextMessageContext.infoAria}>i</button>
              <div class="tooltip" role="tooltip">{copy.sidebar.nextMessageContext.tooltip}</div>
            </div>
            <button class="clear-affordance" type="button" onclick={onClear} aria-label={copy.sidebar.nextMessageContext.clearAria}>{copy.common.clear}</button>
          </div>
        </div>
        <div class="live-text">
          <p class:clamped={!expanded} bind:this={liveEl} bind:clientWidth={liveClientWidth} bind:clientHeight={liveClientHeight}>{liveText}</p>
          {#if showExpand}
            <button class="expand-dots" type="button" onclick={toggleExpanded} aria-expanded={expanded} aria-label={copy.sidebar.nextMessageContext.expandAria}>…</button>
          {/if}
        </div>
      {/if}
    </article>
  {/if}

  {#each pinnedContextItems as item (item.id)}
    <article class="snippet pinned">
      <div class="snippet-top">
        <span class="badge">{copy.sidebar.nextMessageContext.pinned}</span>
        <button class="remove-button" type="button" aria-label={copy.sidebar.nextMessageContext.removeItemAria(item.label)} onclick={() => onRemovePinnedContext(item.id)}>×</button>
      </div>
      <strong>{item.label}</strong>
      <p class="clamped">{item.text}</p>
    </article>
  {/each}
</section>

<style>
  .context-box {
    display: grid;
    gap: 12px;
    padding: 12px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid rgba(132, 204, 22, 0.2);
    min-height: 132px;
    max-height: 156px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  }

  p {
    margin: 0;
  }

  .snippet {
    display: grid;
    gap: 6px;
    padding: 10px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .snippet.live {
    border-color: rgba(132, 204, 22, 0.2);
    background: #ffffff;
  }

  .snippet.live p {
    font-style: italic;
  }

  .snippet.live.compact {
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
  }

  .snippet.pinned {
    border-color: rgba(132, 204, 22, 0.2);
  }

  .snippet-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .live-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .badge {
    width: fit-content;
    padding: 4px 8px;
    border-radius: 9999px;
    background: rgba(132, 204, 22, 0.1);
    color: #65a30d;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  .live-text {
    min-width: 0;
    color: #475569;
    font-size: 13px;
    line-height: 1.45;
  }

  .clamped {
    display: -webkit-box;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .compact .live-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .compact .live-text.expanded {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  .expand-dots {
    border: none;
    background: transparent;
    color: #2563eb;
    font-size: 16px;
    font-style: normal;
    line-height: 1;
    padding: 0 2px;
    cursor: pointer;
  }

  .expand-dots:hover {
    color: #1d4ed8;
  }

  .info-affordance,
  .clear-affordance {
    font: inherit;
  }

  .clear-affordance {
    border: 1px solid #fee2e2;
    background: #fef2f2;
    color: #ef4444;
    border-radius: 9999px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.16s ease;
  }

  .clear-affordance:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .info-affordance {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    border-radius: 9999px;
    padding: 0;
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    cursor: help;
  }

  .tooltip-anchor {
    position: relative;
    display: inline-flex;
  }

  .tooltip {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 220px;
    padding: 8px 10px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-size: 12px;
    line-height: 1.4;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
    opacity: 0;
    pointer-events: none;
    transform: translateY(-4px);
    transition: all 0.16s ease;
    z-index: 2;
  }

  .tooltip-anchor:hover .tooltip,
  .tooltip-anchor:focus-within .tooltip {
    opacity: 1;
    transform: translateY(0);
  }

  .remove-button {
    width: 22px;
    height: 22px;
    border: none;
    border-radius: 9999px;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 14px;
    line-height: 1;
    transition: all 140ms ease;
  }

  .remove-button:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  strong {
    color: #1e293b;
    font-size: 13px;
  }

  .snippet p {
    color: #475569;
    font-size: 13px;
    line-height: 1.45;
  }

  :global(.theme-dark) .context-box {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  :global(.theme-dark) .snippet {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
  }
  :global(.theme-dark) .snippet.live {
    background: #0f172a;
    border-color: rgba(132, 204, 22, 0.3);
  }
  :global(.theme-dark) .snippet.pinned {
    border-color: rgba(132, 204, 22, 0.3);
  }
  :global(.theme-dark) .info-affordance {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #64748b;
  }
  :global(.theme-dark) .tooltip {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #cbd5e1;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }
  :global(.theme-dark) .live-text {
    color: #cbd5e1;
  }
  :global(.theme-dark) .snippet p {
    color: #cbd5e1;
  }
  :global(.theme-dark) strong {
    color: #f8fafc;
  }
  :global(.theme-dark) .remove-button {
    background: #1e293b;
    color: #94a3b8;
  }
  :global(.theme-dark) .clear-affordance {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.25);
    color: #fca5a5;
  }
  :global(.theme-dark) .clear-affordance:hover {
    background: rgba(239, 68, 68, 0.25);
    color: #fecaca;
  }
  :global(.theme-dark) .expand-dots {
    color: #60a5fa;
  }
</style>
