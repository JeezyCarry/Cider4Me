import { getModelRef } from '../../lib/shared/model-registry';
import type { ModelConfig } from '../../lib/shared/types';

/**
 * Composite option value used by the chat model selector.
 * Matches the `${providerId}:${modelId}` shape of `defaultModelId`, so the
 * active model renders in the dropdown instead of showing an empty selection.
 */
export function getModelSelectorValue(model: ModelConfig): string {
  return getModelRef(model.providerId, model.id);
}
