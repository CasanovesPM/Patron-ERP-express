import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Trash, PencilSquare } from "react-bootstrap-icons";
import { db, collection, doc, setDoc, updateDoc, deleteDoc, getDocs } from "../../firebaseConfig";

const CostosFijos = (userId) => {
  const [obligaciones, setObligaciones] = useState([]);
  const [form, setForm] = useState({ obligacion: "", tipo: "", costo: "", estado: "" });
  const [selectedObligacion, setSelectedObligacion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false); // Controla la visibilidad del modal

  const userDocRef = doc(db, "users", userId.userId); // Referencia al documento del usuario
  const obligacionesRef = collection(userDocRef, "Obligaciones"); // Subcolección "Obligaciones"
  
  const fetchObligaciones = async () => {
    try {
      const querySnapshot = await getDocs(obligacionesRef);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.obligacion.localeCompare(b.obligacion));
      setObligaciones(data);
    } catch (error) {
      console.error("Error al obtener las obligaciones: ", error);
    }
  };
  

  useEffect(() => {
    fetchObligaciones();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };

  const handleEditObligacion = (obligacion) => {
    setSelectedObligacion(obligacion);
    setForm({
      obligacion: obligacion.obligacion,
      tipo: obligacion.tipo,
      costo: obligacion.costo,
      estado: obligacion.estado
    });
    setShowModal(true);
  };

  const handleAddObligacion = async () => {
    if (!form.obligacion || !form.tipo || !form.costo || !form.estado) {
      Swal.fire("Por favor, completa todos los campos obligatorios.", "", "error");
      return;
    }

    try {
      const newObligacionRef = doc(obligacionesRef);
      await setDoc(newObligacionRef, form);
      Swal.fire("Obligación agregada con éxito", "", "success");

      setObligaciones((prevObligaciones) => {
        const updatedObligaciones = [...prevObligaciones, { ...form, id: newObligacionRef.id }];
        updatedObligaciones.sort((a, b) => a.obligacion.localeCompare(b.obligacion));
        return updatedObligaciones;
      });

      setForm({ obligacion: "", tipo: "", costo: "", estado: "" });
      setShowModal(false);
    } catch (error) {
      console.error("Error al agregar la obligación: ", error);
      Swal.fire("Hubo un error al agregar la obligación", "", "error");
    }
  };

  const handleUpdateObligacion = async () => {
    if (!selectedObligacion) return;

    try {
      const obligacionDocRef = doc(obligacionesRef, selectedObligacion.id);
      await updateDoc(obligacionDocRef, form);
      Swal.fire("Obligación actualizada con éxito", "", "success");

      setObligaciones((prevObligaciones) => {
        const updatedObligaciones = prevObligaciones.map((obligacion) =>
          obligacion.id === selectedObligacion.id ? { ...form, id: selectedObligacion.id } : obligacion
        );
        updatedObligaciones.sort((a, b) => a.obligacion.localeCompare(b.obligacion));
        return updatedObligaciones;
      });

      setSelectedObligacion(null);
      setForm({ obligacion: "", tipo: "", costo: "", estado: "" });
      setShowModal(false);
    } catch (error) {
      console.error("Error al actualizar la obligación: ", error);
      Swal.fire("Hubo un error al actualizar la obligación", "", "error");
    }
  };

  const handleDeleteObligacion = async (id) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esto",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const obligacionDocRef = doc(obligacionesRef, id);
          await deleteDoc(obligacionDocRef);
          Swal.fire("Eliminado", "La obligación ha sido eliminada", "success");
          fetchObligaciones();
        } catch (error) {
          console.error("Error al eliminar la obligación: ", error);
          Swal.fire("Hubo un error al eliminar la obligación", "", "error");
        }
      }
    });
  };

  const filteredObligaciones = obligaciones
    .filter((obligacion) =>
      obligacion.obligacion.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.obligacion.localeCompare(b.obligacion));

  return (
    <>
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <h2>Obligaciones Mensuales</h2>
      </div>
      <div className="container-fluid-prov">
        <div className="listObligaciones">
          <h3>Listado de Obligaciones</h3>
          <div className="d-flex justify-content-center mb-3">
            <input
              type="text"
              className="form-control w-80"
              placeholder="Buscar Obligación"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                setForm({ obligacion: "", tipo: "", costo: "", estado: "" });
                setSelectedObligacion(null);
                setShowModal(true);
              }}
            >
              Agregar
            </button>
          </div>
          <table className="table table-striped">
            <thead>
              <tr>
                <th className="text-center">Obligación</th>
                <th className="text-center d-none d-md-table-cell">Tipo</th>
                <th className="text-center">Costo</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredObligaciones.map((obligacion) => (
                <tr key={obligacion.id}>
                  <td className="text-center">{obligacion.obligacion}</td>
                  <td className="text-center d-none d-md-table-cell">{obligacion.tipo}</td>
                  <td className="text-center">
                    {Number(obligacion.costo).toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </td>
                  <td className="text-center">
                    <button
                      className={`btn ${obligacion.estado === "Pagado" ? "btn-success" : "btn-danger"} btn-sm`}
                      disabled
                    >
                      {obligacion.estado}
                    </button>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-success btn-sm me-1"
                      onClick={() => handleEditObligacion(obligacion)}
                    >
                      <PencilSquare />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteObligacion(obligacion.id)}
                    >
                      <Trash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 className="text-center">
            El total de los costos fijos es:{" "}
            <span>
              {Number(
                obligaciones.reduce((total, obligacion) => total + parseFloat(obligacion.costo || 0), 0)
              ).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
            </span>
          </h4>

          <h4
            className="text-center"
            style={{
              backgroundColor: "green",
              color: "white",
              fontWeight: "bold",
              padding: "10px",
              borderRadius: "5px",
              marginTop: "20px",
            }}
          >
            El aproximado a facturar para cubrir los costos es de{" "}
            <span>
              {(() => {
                const totalCostos = obligaciones.reduce(
                  (total, obligacion) => total + parseFloat(obligacion.costo || 0),
                  0
                );
                const ventasNecesarias = (totalCostos * 100) / 40;
                return ventasNecesarias.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                });
              })()}
            </span>
          </h4>
        </div>
      </div>

      {showModal && (
        <div className="modal show" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedObligacion ? "Editar Obligación" : "Agregar Obligación"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedObligacion(null);
                    setForm({ obligacion: "", tipo: "", costo: "", estado: "" });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="obligacion" className="form-label">
                    Obligación
                  </label>
                  <input
                    type="text"
                    id="obligacion"
                    className="form-control"
                    value={form.obligacion}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="tipo" className="form-label">
                    Tipo
                  </label>
                  <select id="tipo" className="form-control" value={form.tipo} onChange={handleInputChange}>
                    <option value="">Elegir Tipo</option>
                    <option value="Servicio">Servicio</option>
                    <option value="Impuesto">Impuesto</option>
                    <option value="Salario">Salario</option>
                    <option value="Inmueble">Inmueble</option>
                    <option value="Otros">Otros...</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="costo" className="form-label">
                    Costo
                  </label>
                  <input
                    type="number"
                    id="costo"
                    className="form-control"
                    value={form.costo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="estado" className="form-label">
                    Estado
                  </label>
                  <select id="estado" className="form-control" value={form.estado} onChange={handleInputChange}>
                    <option value="">Elegir Estado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setSelectedObligacion(null);
                  setForm({ obligacion: "", tipo: "", costo: "", estado: "" });
                }}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={selectedObligacion ? handleUpdateObligacion : handleAddObligacion}>
                  {selectedObligacion ? "Actualizar" : "Agregar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CostosFijos;

