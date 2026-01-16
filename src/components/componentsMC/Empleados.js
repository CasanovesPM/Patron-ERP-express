import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { Trash, PencilSquare } from 'react-bootstrap-icons';
import { db, doc, setDoc, getDocs, collection, deleteDoc, updateDoc  } from '../../firebaseConfig'; // Asegúrate de que esta ruta sea correcta
import CalendarioTareas from "./compsIngresos/calendarioTareas";

const Empleados = ({ nivel ,userId, empleado}) => {

  const [nivels, setNivel] = useState(nivel.toString());
  const [showCalendario, setShowCalendario] = useState(false);
  const [deTurno, setDeTurno] = useState('');

  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    fechaNacimiento: '',
    dni: '',
    direccion: '',
    localidad: '',
    email: '',
    password: '',
    nivel: ''
  });

  useEffect(() => {
    if (nivels === '0') {
      fetchEmpleados();
    }
  }, [nivels]);

  useEffect(() => {
    if (nivels !== '0') {
      setDeTurno(empleado);
      setShowCalendario(true);
    }
  }, [nivels]);

  const fetchEmpleados = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, `users/${userId}/Usuarios`));
      const empleadosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmpleados(empleadosList);
    } catch (error) {
      console.error("Error al obtener empleados:", error);
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

  const handleAddEmpleado = async () => {
    if (!form.nombre || !form.email || !form.dni) {
      Swal.fire('Por favor, completa todos los campos obligatorios.', '', 'error');
      return;
    }

    try {
      const docRef = doc(db, `users/${userId}/Usuarios/${form.nombre}`);
      await setDoc(docRef, { ...form });
      
      Swal.fire('Empleado agregado con éxito', '', 'success');
      fetchEmpleados();
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
      console.error("Error al agregar empleado:", error);
      Swal.fire('Error al agregar el empleado', '', 'error');
    }
  };

  const handleDeleteEmployee = async (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, `users/${userId}/Usuarios`, id));
          Swal.fire('Eliminado', 'El empleado ha sido eliminado', 'success');
          fetchEmpleados();
        } catch (error) {
          console.error("Error al eliminar empleado:", error);
          Swal.fire('Error al eliminar el empleado', '', 'error');
        }
      }
    });
  };

  const handleEditEmployee = (empleado) => {
    setSelectedEmpleado(empleado);
    setForm(empleado);
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmpleado) return;

    try {
      const empleadoRef = doc(db, `users/${userId}/Usuarios`, selectedEmpleado.id);
      await updateDoc(empleadoRef, { ...form });
      Swal.fire('Empleado actualizado con éxito', '', 'success');
      fetchEmpleados();
      setSelectedEmpleado(null);
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
      console.error("Error al actualizar empleado:", error);
      Swal.fire('Error al actualizar el empleado', '', 'error');
    }
  };

  const handleFetchTasks = (nombre) => {

    setDeTurno(nombre);
    console.log(nombre);
    Swal.fire('Cargando tareas', '', 'info');
    setShowCalendario(true);

  };


  return (
    <>
      {(nivels === '0') && (
        <div className="gestion-empleados">
          <div className="child-div-ge">
            <h4>{selectedEmpleado ? 'Editar Empleado' : 'Agregar Empleado'}</h4>
            <div className="d-flex justify-content-center p-2">
              <form style={{ width: "46%" }}>
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
              <form style={{ width: "46%" }}>
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
                    <option value="">Seleccionar Nivel</option>
                    <option value="0">Modo Dios</option>
                    <option value="1">Administrador</option>
                    <option value="2">Empleado</option>
                  </select>
                </div>
              </form>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button type="submit" className="btn btn-primary" onClick={selectedEmpleado ? handleUpdateEmployee : handleAddEmpleado}>
                {selectedEmpleado ? 'Actualizar Empleado' : 'Agregar Empleado'}
              </button>
            </div>
          </div>

          <div className="child-div-ge">
            <h4>Lista de Empleados</h4>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col" className="d-none d-md-table-cell">DNI</th>
                  <th scope="col">Nivel</th>
                  <th scope="col">Acciones</th>
                  <th scope="col">Tareas</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((empleado) => (
                  <tr key={empleado.id}>
                    <td>{empleado.nombre}</td>
                    <td className="d-none d-md-table-cell">{empleado.dni}</td>
                    <td>{empleado.nivel === 0 ? 'Modo Dios' : empleado.nivel === 1 ? 'Administrador' : 'Empleado'}</td>
                    <td>
                      <button className="btn btn-success btn-sm me-1" onClick={() => handleEditEmployee(empleado)}>
                        <PencilSquare />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEmployee(empleado.id)}>
                        <Trash />
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-warning btn-sm" onClick={() => handleFetchTasks(empleado.nombre)}>
                        Traer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showCalendario && <CalendarioTareas nivel={nivels} userId={userId} deturno={deTurno}/>}
    </>
  );
};

export default Empleados;
