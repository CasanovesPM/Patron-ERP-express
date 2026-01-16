
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, doc, getDoc } from '../firebaseConfig';  // Asegúrate de importar las funciones correctamente
import logo from '../components/path/to/logo-color.png'; // Reemplaza con la ruta correcta de tu logo
import CmpLogin from './componentsInPages/cmpLogin';
import RegisterLogin from './componentsInPages/registerLogin';
import './pages.css';
import Swal from 'sweetalert2';
import { useAuth } from '../LoginContext';


const UserLogin = ({ setShowHeader }) => {
  const { isLoggedIn, user } = useAuth();
  const [organizationName, setOrganizationName] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(null);
  const navigate = useNavigate();

  // Obtener el nombre de la organización y el valor de firstTime desde el backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.uid) {
        console.error('Usuario no autenticado');
        return;  // Si no hay usuario, no seguimos con la consulta
      }

      console.log("UID del usuario:", user.uid);  // Verifica que el UID está disponible

      try {
        // Obtener la referencia al documento del usuario
        const userDocRef = doc(db, 'users', user.uid); 
        console.log("Referencia al documento:", userDocRef);  // Verifica la referencia al documento

        // Intentar obtener los datos del documento
        const userDocSnap = await getDoc(userDocRef);
        console.log("Documento obtenido:", userDocSnap);

        if (userDocSnap.exists()) {
          // Si el documento existe, obtener los datos
          const userData = userDocSnap.data();
          console.log("Datos del usuario:", userData);  // Verifica los datos obtenidos
          setOrganizationName(userData.organizacion);
          setIsFirstTime(userData.firstTime === false);  // Aquí asumo que 'firstTime' es un campo en tu Firestore
        } else {
          console.log("No se encontró el documento del usuario.");
        }
      } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
      }
    };

    // Ejecutar la función de obtener datos solo si el usuario está autenticado
    if (user) {
      fetchUserData();
    }
  }, [user]);  // Dependencia: se ejecuta cuando 'user' cambia (cuando se loguea)


  const handleHome = () => {
    setShowHeader(true);
    navigate('/');
  };

  useEffect(() => {
    if (isLoggedIn) {
      setShowHeader(false);
    }
  }, [isLoggedIn, setShowHeader]);

  if (isFirstTime === null) {
    return null;
  }

  return (
    <>
      <div className="text-center p-2">
        <div onClick={handleHome} className='imgUserLogin'>
          <img src={logo} alt="Logo" className="d-inline-block align-top" />
        </div>
        <h3>Bienvenidos a {organizationName}</h3>
      </div>
      {isFirstTime ? <CmpLogin setShowHeader={setShowHeader} /> : <RegisterLogin />}
    </>
  );
};

export default UserLogin;