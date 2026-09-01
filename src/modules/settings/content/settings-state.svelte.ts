import type { PublicAppSettings } from '../../../lib/shared/types';
import { DEFAULT_PUBLIC_SETTINGS } from '../../../lib/shared/constants';

export const contentSettingsState = $state({
  settings: DEFAULT_PUBLIC_SETTINGS as PublicAppSettings,
  isLoaded: false,
  isHydrating: false,
});
