import { openDB } from 'idb';

export const getDB = async () => {
  return openDB('emissorDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('registros')) {
        db.createObjectStore('registros', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
};

export const salvarRegistro = async (registro) => {
  const db = await getDB();
  await db.add('registros', {
    ...registro,
    dataRegistro: new Date().toISOString(),
  });
};

export const listarRegistros = async () => {
  const db = await getDB();
  return await db.getAll('registros');
};

export const limparRegistros = async () => {
  const db = await getDB();
  await db.clear('registros');
};
export const deletarRegistro = async (id) => {
    const db = await getDB();
    await db.delete('registros', id);
  };
  