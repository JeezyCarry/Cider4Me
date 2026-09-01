import '../../lib/browser/shim';
import '../../app.css';
import { mount } from 'svelte';
import browser from 'webextension-polyfill';
import OptionsApp from '../../modules/settings/OptionsApp.svelte';
import { getSettings } from '../../lib/browser/storage';
import { initSiderDebugModeSync, siderLogInfo } from '../../lib/browser/sider-log';

initSiderDebugModeSync();
void getSettings();

const target = document.getElementById('app');

if (!target) {
  throw new Error('Options app mount target not found');
}

siderLogInfo('options', 'mounting options app', {
  url: window.location.href,
  isExtension: typeof browser !== 'undefined' && !!browser.runtime,
});

mount(OptionsApp, { target });

siderLogInfo('options', 'options app mounted');
