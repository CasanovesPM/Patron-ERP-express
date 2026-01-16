// Informacion.js
import React, { useEffect, useState} from 'react';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { auth, db } from '../../firebaseConfig';
const Informacion = ({userId}) => {

    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
          const user = auth.currentUser;
          if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            } else {
              console.log("No such document!");
            }
          }
        };
        fetchUserData();
      }, []);

  return (
    <div className="container p-3">
      <h2>Bienvenido {userData?.organizacion}</h2>
      <div>
        <p>Nombre: {userData?.nombre}</p>
        <p>Apellido: {userData?.apellido}</p>
        <p>Organización: {userData?.organizacion}</p>
        <p>País: {userData?.pais}</p>
        <p>Teléfono: {userData?.telefono}</p>
        <p>Email: {userData?.email}</p>
      </div>
    </div>
  );
};

export default Informacion;