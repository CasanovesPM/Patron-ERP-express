// Sistema de almacenamiento local usando localStorage
// Esto reemplaza Firebase para permitir funcionamiento offline
import { 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  deleteField, 
  writeBatch, 
  listCollections 
} from './utils/localStorageManager';

// Simular auth para mantener compatibilidad
const auth = {
  currentUser: null
};

// Función para crear usuario con email y password (usando localStorage)
export const createUserWithEmailAndPassword = async (authInstance, email, password) => {
  // Verificar si el usuario ya existe
  const usersKey = 'localStorage_users';
  const users = JSON.parse(localStorage.getItem(usersKey) || '{}');
  
  if (users[email]) {
    throw new Error('El email ya está registrado');
  }

  // Generar UID único
  const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Guardar credenciales
  users[email] = {
    uid,
    email,
    password, // En producción esto debería estar hasheado
    createdAt: new Date().toISOString()
  };
  
  localStorage.setItem(usersKey, JSON.stringify(users));
  
  // Guardar sesión actual
  localStorage.setItem('currentUser', JSON.stringify({ uid, email }));
  auth.currentUser = { uid, email };

  return {
    user: { uid, email }
  };
};

export { auth, db, writeBatch, listCollections, setDoc, doc, getDoc, getDocs, collection, query, where, updateDoc, deleteDoc, addDoc, deleteField };
