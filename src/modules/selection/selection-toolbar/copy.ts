import { copySelection } from '../selection-actions';
import { hideSelectionToolbar } from '../selection-visibility';

export async function handleCopy(): Promise<void> {
  await copySelection();
  hideSelectionToolbar();
}
