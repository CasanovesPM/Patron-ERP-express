import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword  } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore ,doc, setDoc, getDoc, getDocs, collection, query, where, updateDoc, deleteDoc, addDoc, deleteField, writeBatch ,listCollections  } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
// Obtener las instancias de autenticación y Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db,writeBatch,listCollections, createUserWithEmailAndPassword, setDoc, doc, getDoc , getDocs, collection, query, where, updateDoc, deleteDoc, addDoc, deleteField  };
