import type {
  ExplicitContextItem,
  PageContext,
  PageContextInvalidationReason,
  PageContextStatus,
  SelectionContext,
} from '../../lib/shared/types';

export const contextState = $state({
  pageContextSnapshot: null as PageContext | null,
  explicitContextItems: [] as ExplicitContextItem[],
  currentSelectionContext: null as SelectionContext | null,
  pageContextStatus: 'idle' as PageContextStatus,
  pageContextEnabled: false,
  pageContextInvalidationReason: null as PageContextInvalidationReason | null,
  lastPageContextCheckAt: null as string | null,
  lastPageContextCapturedAt: null as string | null,
  pageContextError: '' as string,
});
