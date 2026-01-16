import React, { createContext, useState, useContext, useEffect } from 'react';

const LoginContext = createContext(null);

const useAuth = () => {
  return useContext(LoginContext);
};

const LoginProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const checkAuthState = () => {
      try {
        const currentUserStr = localStorage.getItem('currentUser');
        const userId = localStorage.getItem('userId');
        
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          setUser({ uid: currentUser.uid, email: currentUser.email });
          setIsLoggedIn(true);
          if (currentUser.uid) {
            localStorage.setItem('userId', currentUser.uid);
          }
        } else if (userId) {
          // Buscar información del usuario por UID
          const usersKey = 'localStorage_users';
          const users = JSON.parse(localStorage.getItem(usersKey) || '{}');
          
          const userEntry = Object.values(users).find(u => u.uid === userId);
          if (userEntry) {
            setUser({ uid: userEntry.uid, email: userEntry.email });
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
            setUser(null);
            localStorage.removeItem('userId');
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkAuthState();
  }, []);

  const login = async (email, password) => {
    try {
      // Buscar usuario en localStorage
      const usersKey = 'localStorage_users';
      const users = JSON.parse(localStorage.getItem(usersKey) || '{}');
      
      const user = users[email];
      
      if (!user) {
        console.error('Usuario no encontrado');
        return false;
      }

      if (user.password !== password) {
        console.error('Contraseña incorrecta');
        return false;
      }

      // Guardar sesión
      localStorage.setItem('currentUser', JSON.stringify({ uid: user.uid, email: user.email }));
      localStorage.setItem('userId', user.uid);
      
      setUser({ uid: user.uid, email: user.email });
      setIsLoggedIn(true);
      
      return true;
    } catch (error) {
      console.error('Error during login:', error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userId');
      setIsLoggedIn(false);
      setUser(null);
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
