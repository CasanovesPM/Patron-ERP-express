// Informacion.js
import React, { useEffect, useState} from 'react';
import { doc, getDoc, auth, db } from '../../firebaseConfig';
import { useAuth } from '../../LoginContext';

const Informacion = ({userId}) => {

    const [userData, setUserData] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchUserData = async () => {
          const currentUser = user || auth.currentUser;
          if (currentUser && currentUser.uid) {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            } else {
              console.log("No such document!");
            }
          }
        };
        fetchUserData();
      }, [user]);

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