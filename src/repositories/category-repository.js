import { getData, mutate } from '../core/store.js';

export function listCategories() { return getData().categorias; }
export function listByType(tipo) { return listCategories().filter((c) => c.tipo === tipo); }

export async function addCategory({ nome, tipo, essencial = false }) {
  await mutate((data) => { data.categorias.push({ id: Date.now(), nome, tipo, essencial: !!essencial }); return data; });
}

export async function removeCategory(id) {
  await mutate((data) => { data.categorias = data.categorias.filter((c) => c.id !== id); return data; });
}
