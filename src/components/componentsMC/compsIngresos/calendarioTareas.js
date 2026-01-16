import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  db,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc
} from "../../../firebaseConfig";

const CalendarioTareas = ({ nivel, deturno, userId }) => {
  const [tasks, setTasks] = useState({
    Lunes: [],
    Martes: [],
    Miércoles: [],
    Jueves: [],
    Viernes: [],
    Sábado: [],
    Domingo: [],
  });

  const [currentDay, setCurrentDay] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const loadTasks = async (showLoading = true) => {
    try {
      if (showLoading) {
        Swal.fire({
          title: 'Cargando Tareas...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
      }

      const fetchedTasks = {};
      for (const day of daysOfWeek) {
        const colRef = collection(db, 'users', userId, 'Usuarios', deturno, 'Tareas', day, 'tareas');
        const snapshot = await getDocs(colRef);
        fetchedTasks[day] = snapshot.docs
          .map(doc => doc.data())
          .sort((a, b) => a.orden - b.orden); // Ordenar por campo 'orden'
      }

      setTasks(fetchedTasks);
      if (showLoading) Swal.close();
    } catch (error) {
      console.error("Error al cargar las tareas: ", error);
      Swal.fire('Error', 'No se pudieron cargar las tareas', 'error');
    }
  };

  useEffect(() => {
    if (deturno) loadTasks();
    const today = new Date().getDay();
    setCurrentDay(daysOfWeek[today]);

    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, [deturno]);

  const handleAddTask = async (day) => {
    const result = await Swal.fire({
      title: "Agregar Tarea",
      input: "text",
      inputLabel: "Nombre de la tarea",
      inputPlaceholder: "Introduce el nombre de la tarea",
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed && result.value) {
      const newTask = {
        name: result.value,
        completed: false,
        orden: Date.now(), // campo orden
      };

      try {
        const docRef = doc(db, 'users', userId, 'Usuarios', deturno, 'Tareas', day, 'tareas', newTask.name);
        await setDoc(docRef, newTask);

        setTasks(prevTasks => ({
          ...prevTasks,
          [day]: [...prevTasks[day], newTask], // Agregar al final
        }));
      } catch (error) {
        console.error("Error al agregar la tarea: ", error);
      }
    }
  };

  const handleToggleCompletion = async (day, index) => {
    Swal.fire({
      title: 'Actualizando Tarea...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const task = tasks[day][index];
    const updatedTask = { ...task, completed: !task.completed };

    try {
      const docRef = doc(db, 'users', userId, 'Usuarios', deturno, 'Tareas', day, 'tareas', task.name);
      await updateDoc(docRef, { completed: updatedTask.completed });

      setTasks(prevTasks => {
        const updatedList = [...prevTasks[day]];
        updatedList[index] = updatedTask;
        return { ...prevTasks, [day]: updatedList };
      });

      Swal.close();
    } catch (error) {
      console.error("Error al actualizar la tarea: ", error);
      Swal.fire('Error', 'No se pudo actualizar la tarea', 'error');
    }
  };

  const handleDeleteTask = async (day, index) => {
    const task = tasks[day][index];
    try {
      const docRef = doc(db, 'users', userId, 'Usuarios', deturno, 'Tareas', day, 'tareas', task.name);
      await deleteDoc(docRef);

      setTasks(prevTasks => {
        const updatedList = [...prevTasks[day]];
        updatedList.splice(index, 1);
        return { ...prevTasks, [day]: updatedList };
      });
    } catch (error) {
      console.error("Error al eliminar la tarea: ", error);
    }
  };

  const renderTasksForDay = (day) => (
    <td key={day} className="position-relative" style={{ verticalAlign: "top", border: "1px solid #ccc", padding: "10px" }}>
      <div className="task-container">
        <ul className="list-unstyled mb-3">
          {tasks[day].map((task, index) => (
            <li key={index} className="p-1 mb-1 rounded">
              <div>
                <button
                  className={`btn btn-sm me-2 ${task.completed ? "btn-success" : "btn-warning"}`}
                  onClick={() => handleToggleCompletion(day, index)}
                  style={{ color: "white" }}
                >
                  {index + 1}. {task.name}
                </button>
                {(nivel === '0') && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(day, index)} style={{ padding: "0.25rem 0.5rem" }}>
                    X
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="d-flex justify-content-center mt-3">
        {(nivel === '0') && (
          <button className="btn btn-secondary btn-sm" onClick={() => handleAddTask(day)} style={{ zIndex: 1 }}>
            Agregar Tarea
          </button>
        )}
      </div>
    </td>
  );

  return (
    <div className="calendar-div-empleados">
      <h4>Calendario Semanal de <span>{deturno}</span></h4>
      <table className="table calendar-table-empleados" style={{ borderCollapse: "separate", borderSpacing: 0, border: "1px solid #ccc" }}>
        <thead>
          <tr>
            {isMobile ? (
              <th style={{ border: "1px solid #ccc" }}>{currentDay}</th>
            ) : (
              daysOfWeek.map(day => (
                <th key={day} style={{ border: "1px solid #ccc" }}>{day}</th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            {isMobile ? (
              renderTasksForDay(currentDay)
            ) : (
              daysOfWeek.map(day => renderTasksForDay(day))
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CalendarioTareas;
