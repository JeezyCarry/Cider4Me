<script lang="ts">
  import type { ModeConfig } from '../../lib/shared/types';
  import { getI18n, localeStore } from '../../lib/i18n';

  interface Props {
    modes: ModeConfig[];
    value: string;
    onChange: (value: string) => void;
    compact?: boolean;
    labelHidden?: boolean;
  }

  let { modes, value, onChange, compact = false, labelHidden = false }: Props = $props();
  const copy = $derived(getI18n($localeStore));
</script>

<label class:compact class="selector">
  <span class:visually-hidden={labelHidden}>{copy.options.sections.modes.title}</span>
  <select aria-label={copy.options.sections.modes.title} value={value} onchange={(event) => onChange((event.currentTarget as HTMLSelectElement).value)}>
    {#each modes as mode (mode.id)}
      <option value={mode.id}>{mode.label}</option>
    {/each}
  </select>
</label>

<style>
  .selector { display:grid; gap:6px; margin-bottom:12px; font-size:13px; color:#475569; }
  .selector.compact { gap:0; margin-bottom:0; }
  .visually-hidden {
    position:absolute;
    width:1px;
    height:1px;
    padding:0;
    margin:-1px;
    overflow:hidden;
    clip:rect(0, 0, 0, 0);
    white-space:nowrap;
    border:0;
  }
  select {
    width:100%;
    border-radius:12px;
    border:1px solid rgba(132, 204, 22, 0.2);
    background:#ffffff;
    color:#1e293b;
    padding:10px 12px;
    min-height:36px;
    transition: all 140ms ease;
    cursor: pointer;
  }
  select:hover { background: #f9fafb; border-color: #84cc16; }
  select:focus { outline: none; border-color: #84cc16; box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.1); }
  .selector.compact select { padding:7px 10px; min-height:36px; }

  :global(.theme-dark) select {
    background: #0f172a;
    color: #f8fafc;
    border-color: rgba(148, 163, 184, 0.15);
  }
  :global(.theme-dark) select:hover {
    background: #1e293b;
    border-color: #84cc16;
  }
</style>
