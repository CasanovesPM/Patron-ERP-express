import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from './firebaseConfig'; // Asegúrate de que la ruta sea correcta
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

const LoginContext = createContext(null);

const useAuth = () => {
  return useContext(LoginContext);
};

const LoginProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsLoggedIn(true);
        localStorage.setItem('userId', user.uid);
      } else {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('userId');
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Error during login:', error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem('userId');
    } catch (error) {
      console.error('Error during logout:', error.message);
    }
  };

  return (
    <LoginContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </LoginContext.Provider>
  );
};

export { LoginContext, LoginProvider, useAuth };
