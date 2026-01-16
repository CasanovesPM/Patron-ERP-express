import { useState } from 'react';
import { Routes, Route } from 'react-router-dom'; // ❌ No traigas BrowserRouter acá
import Header from './components/Header';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UserLogin from './pages/userLogin';
import { LoginProvider } from './LoginContext';


function App() {
  const [showHeader, setShowHeader] = useState(true);

  return (
    <LoginProvider>
      <div>
        {/* {showHeader && <Header setShowHeader={setShowHeader} />} */}
        <div className="container">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage setShowHeader={setShowHeader} />} />
            <Route path="/dashboard" element={<Dashboard setShowHeader={setShowHeader} />} />
            <Route path="/userlogin" element={<UserLogin setShowHeader={setShowHeader} />} />
          </Routes>
        </div>
      </div>
    </LoginProvider>
  );
}

export default App;

