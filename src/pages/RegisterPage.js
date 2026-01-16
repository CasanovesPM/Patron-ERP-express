import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { auth, db, createUserWithEmailAndPassword, setDoc, doc } from '../firebaseConfig';

function RegisterPage() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [organizacion, setOrganizacion] = useState('');
  const [pais, setPais] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    // Verificar que las contraseñas coinciden
    if (password !== repeatPassword) {
      Swal.fire({
        title: 'Error!',
        text: 'Las contraseñas no coinciden.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    try {
      // Crear el usuario usando localStorage
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Obtener el usuario creado
      const user = userCredential.user;

      // Guardar los datos adicionales en localStorage (simulando Firestore)
      await setDoc(doc(db, 'users', user.uid), {
        nombre,
        apellido,
        organizacion,
        pais,
        telefono,
        email,
        firstTime: true, // Inicializar como primera vez
      });

      // Mostrar mensaje de éxito
      Swal.fire({
        title: 'Éxito!',
        text: 'Registro exitoso. Tu sesión se iniciará automáticamente.',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then((result) => {
        if (result.isConfirmed) {
          // Redirigir al login después del registro
          window.location.href = '/login';
        }
      });
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: `Hubo un problema al registrarse: ${error.message}`,
        icon: 'error',
        confirmButtonText: 'OK',
      });
      console.error("Error al registrar:", error);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Registro</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          className="form-control mb-2"
          required
        />
        <input
          type="text"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          placeholder="Apellido"
          className="form-control mb-2"
          required
        />
        <input
          type="text"
          value={organizacion}
          onChange={(e) => setOrganizacion(e.target.value)}
          placeholder="Nombre de la Organización"
          className="form-control mb-2"
          required
        />
        <input
          type="text"
          value={pais}
          onChange={(e) => setPais(e.target.value)}
          placeholder="País"
          className="form-control mb-2"
          required
        />
        <input
          type="text"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Teléfono de Contacto"
          className="form-control mb-2"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="form-control mb-2"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="form-control mb-2"
          required
        />
        <input
          type="password"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          placeholder="Repetir Contraseña"
          className="form-control mb-2"
          required
        />
        <button type="submit" className="btn btn-primary">Registrar</button>
      </form>
    </div>
  );
}

export default RegisterPage;
