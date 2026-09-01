import { getModelRef } from '../../lib/shared/model-registry';
import type { ModelConfig } from '../../lib/shared/types';

export function resolveSelectedModel(models: ModelConfig[], defaultModelRef: string): ModelConfig | null {
  return (
    models.find((model) => getModelRef(model.providerId, model.id) === defaultModelRef) ??
    models[0] ??
    null
  );
}

/** Resolves the composite `${providerId}:${modelId}` reference to send upstream. */
export function resolveSelectedModelRef(models: ModelConfig[], defaultModelRef: string): string {
  const model = resolveSelectedModel(models, defaultModelRef);
  return model ? getModelRef(model.providerId, model.id) : defaultModelRef;
}

export function getImageCompatibilityError(model: ModelConfig | null, hasPendingImage: boolean, fallbackMessage: string): string {
  if (!hasPendingImage) return '';
  if (!model?.supportsImages) return fallbackMessage;
  return '';
}
