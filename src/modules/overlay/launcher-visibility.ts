import { canInjectOnUrl } from '../../lib/browser/site-access';
import type { SiteAccessPolicy } from '../../lib/shared/types';

export function shouldShowLauncherOnPage(rawUrl: string, policy: SiteAccessPolicy, isTemporarilyHidden: boolean): boolean {
  if (isTemporarilyHidden) return false;
  return canInjectOnUrl(rawUrl, policy);
}
