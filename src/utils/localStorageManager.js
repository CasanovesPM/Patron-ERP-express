// Módulo para simular operaciones de Firestore usando localStorage
// Esto permite mantener la misma interfaz que Firebase pero usando almacenamiento local

// Generar IDs únicos
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Obtener datos de localStorage
const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error al leer localStorage:', error);
    return null;
  }
};

// Guardar datos en localStorage
const setStorageData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error al escribir localStorage:', error);
    return false;
  }
};

// Simular estructura de Firestore: users/{userId}/collection/{docId}
const getDocumentPath = (path) => {
  const parts = path.split('/');
  if (parts.length < 2) return null;
  
  // Si es una ruta como users/{userId}/collection/{docId}
  if (parts[0] === 'users' && parts.length >= 4) {
    return {
      userId: parts[1],
      collection: parts[2],
      docId: parts.slice(3).join('/')
    };
  }
  // Si es una ruta como users/{userId}
  if (parts[0] === 'users' && parts.length === 2) {
    return {
      userId: parts[1],
      collection: null,
      docId: null
    };
  }
  return null;
};

// Simular doc() - crea una referencia de documento
export const doc = (db, ...pathParts) => {
  // Filtrar valores null/undefined y unir con '/'
  const validParts = pathParts.filter(part => part != null);
  const path = validParts.join('/');
  return { path, db, type: 'doc' };
};

// Simular collection() - crea una referencia de colección
export const collection = (db, ...pathParts) => {
  const path = pathParts.join('/');
  return { path, db, type: 'collection' };
};

// Simular getDoc() - obtener un documento
export const getDoc = async (docRef) => {
  if (docRef.type !== 'doc') {
    throw new Error('getDoc requiere una referencia de documento');
  }

  const pathInfo = getDocumentPath(docRef.path);
  if (!pathInfo) {
    return { exists: () => false, data: () => null };
  }

  const storageKey = `firestore_${docRef.path}`;
  const data = getStorageData(storageKey);

  return {
    exists: () => data !== null,
    data: () => data || null,
    id: pathInfo.docId || pathInfo.userId
  };
};

// Simular setDoc() - crear o actualizar un documento
export const setDoc = async (docRef, data, options = {}) => {
  if (docRef.type !== 'doc') {
    throw new Error('setDoc requiere una referencia de documento');
  }

  const storageKey = `firestore_${docRef.path}`;
  const existingData = getStorageData(storageKey);
  
  let finalData;
  if (options.merge && existingData) {
    finalData = { ...existingData, ...data };
  } else {
    finalData = data;
  }

  setStorageData(storageKey, finalData);

  // También guardar en índice de colección para búsquedas
  const pathInfo = getDocumentPath(docRef.path);
  if (pathInfo && pathInfo.collection) {
    const collectionKey = `firestore_collection_${pathInfo.userId}_${pathInfo.collection}`;
    const collectionData = getStorageData(collectionKey) || {};
    collectionData[pathInfo.docId || docRef.path.split('/').pop()] = finalData;
    setStorageData(collectionKey, collectionData);
  }

  return { id: pathInfo?.docId || generateId() };
};

// Simular getDocs() - obtener todos los documentos de una colección
export const getDocs = async (queryOrCollection) => {
  // Si es una query, ejecutarla
  if (queryOrCollection && queryOrCollection.type === 'query') {
    return executeQuery(queryOrCollection);
  }

  // Si es una colección normal
  const collectionRef = queryOrCollection;
  if (!collectionRef || collectionRef.type !== 'collection') {
    throw new Error('getDocs requiere una referencia de colección o query');
  }

  return getCollectionDocs(collectionRef);
};

// Simular query() y where() - consultas con filtros
export const query = (collectionRef, ...queryConstraints) => {
  return { collectionRef, constraints: queryConstraints, type: 'query' };
};

export const where = (field, operator, value) => {
  return { field, operator, value, type: 'where' };
};

// Función auxiliar para obtener documentos de una colección sin manejar queries
const getCollectionDocs = async (collectionRef) => {
  const pathInfo = getDocumentPath(collectionRef.path);
  if (!pathInfo || !pathInfo.collection) {
    // Si es una colección directa como 'users/{userId}/Usuarios'
    const parts = collectionRef.path.split('/');
    if (parts[0] === 'users' && parts.length >= 3) {
      const userId = parts[1];
      const collectionName = parts[2];
      const collectionKey = `firestore_collection_${userId}_${collectionName}`;
      const collectionData = getStorageData(collectionKey) || {};
      
      const docs = Object.entries(collectionData).map(([id, data]) => ({
        id,
        data: () => data,
        exists: () => true
      }));
      
      return {
        empty: docs.length === 0,
        docs: docs,
        forEach: (callback) => docs.forEach(callback)
      };
    }
  }

  // Buscar todos los documentos que empiezan con este path
  const prefix = `firestore_${collectionRef.path}`;
  const docs = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix) && !key.includes('_collection_')) {
      const data = getStorageData(key);
      if (data) {
        const docId = key.replace(`firestore_${collectionRef.path}/`, '').split('/')[0];
        docs.push({
          id: docId,
          data: () => data,
          exists: () => true
        });
      }
    }
  }

  return {
    empty: docs.length === 0,
    docs: docs,
    forEach: (callback) => docs.forEach(callback)
  };
};

// Ejecutar consultas
export const executeQuery = async (queryRef) => {
  if (queryRef.type !== 'query') {
    throw new Error('Se requiere una referencia de query');
  }

  const snapshot = await getCollectionDocs(queryRef.collectionRef);
  let filteredDocs = snapshot.docs;

  // Aplicar filtros where
  queryRef.constraints.forEach(constraint => {
    if (constraint.type === 'where') {
      filteredDocs = filteredDocs.filter(doc => {
        const data = doc.data();
        const fieldValue = data[constraint.field];

        switch (constraint.operator) {
          case '==':
            return fieldValue === constraint.value;
          case '!=':
            return fieldValue !== constraint.value;
          case '>':
            return fieldValue > constraint.value;
          case '<':
            return fieldValue < constraint.value;
          case '>=':
            return fieldValue >= constraint.value;
          case '<=':
            return fieldValue <= constraint.value;
          default:
            return true;
        }
      });
    }
  });

  return {
    empty: filteredDocs.length === 0,
    docs: filteredDocs,
    forEach: (callback) => filteredDocs.forEach(callback)
  };
};

// Actualizar getDocs para manejar queries
const originalGetDocs = getDocs;
export const getDocsWithQuery = async (queryOrCollection) => {
  if (queryOrCollection.type === 'query') {
    return executeQuery(queryOrCollection);
  }
  return originalGetDocs(queryOrCollection);
};

// Simular updateDoc() - actualizar un documento
export const updateDoc = async (docRef, updates) => {
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    throw new Error('El documento no existe');
  }

  const existingData = snapshot.data();
  const updatedData = { ...existingData, ...updates };
  
  return setDoc(docRef, updatedData, { merge: true });
};

// Simular deleteDoc() - eliminar un documento
export const deleteDoc = async (docRef) => {
  const storageKey = `firestore_${docRef.path}`;
  localStorage.removeItem(storageKey);

  // También eliminar del índice de colección
  const pathInfo = getDocumentPath(docRef.path);
  if (pathInfo && pathInfo.collection) {
    const collectionKey = `firestore_collection_${pathInfo.userId}_${pathInfo.collection}`;
    const collectionData = getStorageData(collectionKey) || {};
    delete collectionData[pathInfo.docId || docRef.path.split('/').pop()];
    setStorageData(collectionKey, collectionData);
  }

  return true;
};

// Simular addDoc() - agregar un documento con ID auto-generado
export const addDoc = async (collectionRef, data) => {
  const id = generateId();
  const docRef = doc(null, `${collectionRef.path}/${id}`);
  await setDoc(docRef, data);
  return { id };
};

// Simular deleteField() - eliminar un campo
export const deleteField = () => {
  return { __deleteField: true };
};

// Simular writeBatch() - operaciones en lote
export const writeBatch = () => {
  const operations = [];

  return {
    set: (docRef, data, options) => {
      operations.push({ type: 'set', docRef, data, options });
      return this;
    },
    update: (docRef, updates) => {
      operations.push({ type: 'update', docRef, updates });
      return this;
    },
    delete: (docRef) => {
      operations.push({ type: 'delete', docRef });
      return this;
    },
    commit: async () => {
      for (const op of operations) {
        if (op.type === 'set') {
          await setDoc(op.docRef, op.data, op.options);
        } else if (op.type === 'update') {
          await updateDoc(op.docRef, op.updates);
        } else if (op.type === 'delete') {
          await deleteDoc(op.docRef);
        }
      }
      return true;
    }
  };
};

// Simular listCollections() - listar colecciones
export const listCollections = async (docRef) => {
  // Para simplicidad, retornamos un array vacío
  // En una implementación real, podrías escanear localStorage
  return [];
};

// Exportar un objeto "db" simulado
export const db = {
  type: 'localStorage'
};
