// putInfo.js
import {  doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { db } from '../../firebaseConfig'; // Asegúrate de que esta ruta sea correcta
import moment from 'moment';

const putInfoSetBanco = async (userId, bancoPresente) => {

  const fecha = moment().format('DD-MM-YYYY'); // Formato DD-MM-YYYY

  try {
    if (!userId) throw new Error('userId no está definido');
    if (!bancoPresente) throw new Error('bancoPresente no está definido');


    // Crear la referencia al documento específico en la colección Banco
    const bancoRef = doc(db, `users/${userId}/Banco/bancoInfo`);

    // Guardar o actualizar el valor bancoPresente en el documento especificado
    await setDoc(bancoRef, { bancoPresente: bancoPresente }, { merge: true });

    console.log("Datos guardados exitosamente");

  } catch (error) {
    console.error("Error al guardar los datos:", error);
    throw error; // Propaga el error para que pueda ser capturado por el componente
  }
};

export default putInfoSetBanco;
