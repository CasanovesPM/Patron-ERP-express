
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, doc, getDoc } from '../firebaseConfig';
import logo from '../components/path/to/logo-color.png';
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

  // Función para obtener los datos del usuario
  const fetchUserData = useCallback(async () => {
    if (!user || !user.uid) {
      console.error('Usuario no autenticado');
      return;
    }

    try {
      // Obtener la referencia al documento del usuario
      const userDocRef = doc(db, 'users', user.uid);

      // Intentar obtener los datos del documento
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // Si el documento existe, obtener los datos
        const userData = userDocSnap.data();
        setOrganizationName(userData.organizacion || 'Mi Empresa');
        // Si firstTime es true o undefined, es primera vez (mostrar creación de super usuario)
        // Si firstTime es false, mostrar el login de usuarios
        setIsFirstTime(userData.firstTime !== false);
      } else {
        console.log("No se encontró el documento del usuario.");
        setOrganizationName('Mi Empresa');
        setIsFirstTime(true);
      }
    } catch (error) {
      console.error("Error al obtener los datos del usuario:", error);
      setOrganizationName('Mi Empresa');
      setIsFirstTime(true);
    }
  }, [user]);

  // Obtener el nombre de la organización y el valor de firstTime desde localStorage
  useEffect(() => {
    // Ejecutar la función de obtener datos solo si el usuario está autenticado
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);


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
      {isFirstTime ? <RegisterLogin onSuperUserCreated={fetchUserData} /> : <CmpLogin setShowHeader={setShowHeader} />}
    </>
  );
};

export default UserLogin;