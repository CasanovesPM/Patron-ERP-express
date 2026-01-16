import React, { useState } from "react";
import Swal from 'sweetalert2';
import { doc, setDoc , updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db } from '../../firebaseConfig'; // Asegúrate de que esta ruta sea correcta
import { useAuth } from '../../LoginContext';

const RegisterLogin = () => {

    const { userId } = useAuth();

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

      const handleAddEmpleado = async () => {
        if (!form.nombre || !form.email || !form.dni) {
          Swal.fire('Por favor, completa todos los campos obligatorios.', '', 'error');
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

            const docRef = doc(db, `users/${userId}/Usuarios/${form.nombre}`);
            await setDoc(docRef, { ...form });

            // Actualizar el campo firstTime a true
            const userDocRef = doc(db, `users/${userId}`);
            await updateDoc(userDocRef, { firstTime: false });

            // Cierra el Swal de carga
            Swal.close();

            // Muestra el Swal de éxito y refresca la página al presionar "OK"
            Swal.fire({
                title: 'Super Usuario agregado con éxito',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.reload(); // Refresca la página
                }
            });

          setForm({
            nombre: '',
            fechaNacimiento: '',
            dni: '',
            direccion: '',
            localidad: '',
            email: '',
            password: '',
            nivel: ''
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