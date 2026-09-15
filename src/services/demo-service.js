import { getActiveDatasetId, setActiveDataset, resetDemoData, wipeRealData } from '../core/store.js';

export function isDemoActive() { return getActiveDatasetId() === 'demo'; }

export async function activateDemo() { await setActiveDataset('demo'); }
export async function deactivateDemo() { await setActiveDataset('real'); }

export async function clearDemoData() { await resetDemoData(); }

// Zera o dataset real (usado em "Resetar dados"). Ação destrutiva — a
// confirmação deve acontecer na camada de UI antes de chamar isto.
export async function wipeReal() { await wipeRealData(); }
