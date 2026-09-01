<script lang="ts">
  import SidebarApp from '../chat/SidebarApp.svelte';
  import ResizeHandle from './ResizeHandle.svelte';
  import { getI18n, localeStore } from '../../lib/i18n';

  interface Props {
    open: boolean;
    width: number;
  }

  let { open, width }: Props = $props();
  const copy = $derived(getI18n($localeStore));
</script>

{#if open}
  <aside class="sidebar" style={`width:${width}px`} aria-label={copy.content.sidebarShellAria}>
    <ResizeHandle />
    <SidebarApp />
  </aside>
{/if}

<style>
  .sidebar { 
    position:fixed; 
    top:16px; 
    right:16px; 
    bottom:16px; 
    border-radius:24px; 
    padding:20px; 
    background:#ffffff; 
    color:#1e293b; 
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(132, 204, 22, 0.1);
    border:1px solid rgba(132, 204, 22, 0.2); 
    z-index:1; 
    display:flex; 
    flex-direction:column; 
  }

  :global(.theme-dark) .sidebar {
    background: #0f172a;
    color: #f8fafc;
    border-color: rgba(148, 163, 184, 0.15);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(148, 163, 184, 0.1);
  }
</style>
