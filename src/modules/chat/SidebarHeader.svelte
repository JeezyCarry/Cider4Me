<script lang="ts">
  import { getI18n, localeStore } from '../../lib/i18n';

  interface Props {
    title: string;
    onClose: () => void;
  }

  let { title, onClose }: Props = $props();
  const copy = $derived(getI18n($localeStore));
</script>

<header class="header">
  <div>
    <p class="eyebrow">{copy.sidebar.headerEyebrow}</p>
    <h2>{title}</h2>
  </div>
  <button class="icon-button" onclick={onClose} aria-label={copy.sidebar.closeAria}>×</button>
</header>

<style>
  .header { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:12px; }
  .eyebrow { margin:0 0 2px; color:#65a30d; font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
  h2 { margin:0; font-size:22px; line-height:1.05; color:#000000; }
  .icon-button { border:none; background:#f1f5f9; color:#64748b; width:34px; height:34px; border-radius:9999px; cursor:pointer; transition: all 140ms ease; }
  .icon-button:hover { background: #e2e8f0; color: #1e293b; }

  :global(.theme-dark) h2 { color:#f8fafc; }
  :global(.theme-dark) .icon-button { background:#1e293b; color:#cbd5e1; }
  :global(.theme-dark) .icon-button:hover { background:#334155; color:#f8fafc; }
</style>
