import React, { useState } from "react";
import Swal from 'sweetalert2';
import { doc, setDoc, updateDoc } from '../../firebaseConfig';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../LoginContext';

const RegisterLogin = ({ onSuperUserCreated }) => {

    const { user } = useAuth();
    const userId = user?.uid;

    const [form, setForm] = useState({
        nombre: '',
        fechaNacimiento: '',
        dni: '',
        direccion: '',
        localidad: '',
        email: '',
        password: '',
        nivel: 0
      });

      // Función para validar formato de email
      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      const handleAddEmpleado = async () => {
        if (!form.nombre || !form.email || !form.dni) {
          Swal.fire('Por favor, completa todos los campos obligatorios.', '', 'error');
          return;
        }

        // Validar formato de email
        if (!validateEmail(form.email)) {
          Swal.fire({
            title: 'Email inválido',
            text: 'Debe poner un email correcto',
            icon: 'error',
            confirmButtonText: 'OK'
          });
          return;
        }
    
        try {
            // Muestra el Swal de carga
            Swal.fire({
                title: 'Creando Super Usuario...',
                text: 'Por favor espera',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            if (!userId) {
              throw new Error('Usuario no autenticado');
            }

            const docRef = doc(db, `users/${userId}/Usuarios/${form.nombre}`);
            await setDoc(docRef, { ...form });

            // Actualizar el campo firstTime a false
            const userDocRef = doc(db, `users/${userId}`);
            await updateDoc(userDocRef, { firstTime: false });

            // Limpiar el formulario
            setForm({
              nombre: '',
              fechaNacimiento: '',
              dni: '',
              direccion: '',
              localidad: '',
              email: '',
              password: '',
              nivel: 0
            });

            // Cierra el Swal de carga
            Swal.close();

            // Muestra el Swal de éxito y luego actualiza el estado del componente padre
            Swal.fire({
                title: 'Super Usuario agregado con éxito',
                text: 'Ahora puedes iniciar sesión con tu usuario',
                icon: 'success',
                confirmButtonText: 'Continuar',
                timer: 2000,
                timerProgressBar: true
            }).then(() => {
                // Llamar al callback para actualizar el estado en UserLogin
                if (onSuperUserCreated) {
                  onSuperUserCreated();
                }
            });
        } catch (error) {
          console.error("Error al agregar Super Usuario:", error);
          Swal.fire('Error al agregar el Super Usuario', '', 'error');
        }
      };

      const handleInputChange = (e) => {
        const { id, value } = e.target;
        setForm({ ...form, [id]: value });
      };
      
        const handleSelectChange = (e) => {
            const { value } = e.target;
            setForm({ ...form, nivel: parseInt(value) });
        };

    return(
        <div className="d-flex justify-content-center">
            <div className="child-div-rl">
            <h4>Crear Super Usuario</h4>
            <div className="d-flex justify-content-between p-2">
            <form>
                <div className="mb-1">
                <input type="text" className="form-control" id="nombre" placeholder="Nombre" value={form.nombre} onChange={handleInputChange} />
                </div>
                <div className="mb-1">
                <input type="date" className="form-control" id="fechaNacimiento" placeholder="Nacimiento" value={form.fechaNacimiento} onChange={handleInputChange} />
                </div>
                <div className="mb-1">
                <input type="text" className="form-control" id="dni" placeholder="DNI" value={form.dni} onChange={handleInputChange} />
                </div>
                <div className="mb-1">
                <input type="text" className="form-control" id="direccion" placeholder="Dirección" value={form.direccion} onChange={handleInputChange} />
                </div>
            </form>
            <form>
                <div className="mb-1">
                <input type="text" className="form-control" id="localidad" placeholder="Localidad" value={form.localidad} onChange={handleInputChange} />
                </div>
                <div className="mb-1">
                <input type="email" className="form-control" id="email" placeholder="Email" value={form.email} onChange={handleInputChange} />
                </div>
                <div className="mb-1">
                <input type="text" className="form-control" id="password" placeholder="Contraseña" value={form.password} onChange={handleInputChange} />
                </div>
                <div className="mb-1">
                <select className="form-control" id="nivel" value={form.nivel} onChange={handleSelectChange}>
                    <option value="0">Modo Dios</option>
                </select>
                </div>
            </form>
            </div>
            <div style={{ textAlign: 'center' }}>
            <button type="submit" className="btn btn-success" onClick={handleAddEmpleado}>
                Agregar Super Usuario
            </button>
            </div>
        </div>
      </div>
    )
}

export default RegisterLogin