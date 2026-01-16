import React, { useState, useEffect } from 'react';
import { db, collection, query, getDocs, doc, updateDoc } from '../../../firebaseConfig';
import { parse, isValid } from 'date-fns';

const TableCheques = ({ bancoActual, userId }) => {
  const [data, setData] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Aceptado'); // Predeterminado como "Aceptado"
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bancoCubierto, setBancoCubierto] = useState('');
  const [showCompromisos, setShowCompromisos] = useState('');
  const [sums, setSums] = useState({ mes1: 0, mes2: 0, mes3: 0 });



  // Cargar los cheques desde la base de datos
  useEffect(() => {
    const fetchChequesData = async () => {
      setLoading(true);
      setError(null);
      try {
        const chequesQuery = query(collection(db, `users/${userId}/Cheques/Electronicos/Egresos`));
        const querySnapshot = await getDocs(chequesQuery);
        const cheques = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Ordenar los cheques por fecha de pago (de más cercano a más lejano)
        cheques.sort((a, b) => {
          const dateA = parse(a.fechaPago, 'dd-MM-yyyy', new Date());
          const dateB = parse(b.fechaPago, 'dd-MM-yyyy', new Date());

          // Verificamos si las fechas son válidas antes de ordenarlas
          if (isValid(dateA) && isValid(dateB)) {
            return dateA - dateB;
          }
          return 0; // Si las fechas no son válidas, no las ordenamos
        });

        setData(cheques);  // Guardamos los cheques ya ordenados en el estado
      } catch (error) {
        setError(error);
        console.error('Error al obtener los datos de cheques:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchChequesData();
    }
  }, [userId]);

  // Calculamos el banco cubierto
  useEffect(() => {
    const estadosRelevantes = ["Emitido", "Aceptado"];
    let acumulado = 0;
    let fechaCubierta = '';

    const chequesFiltrados = data.filter(item => estadosRelevantes.includes(item.estado));

    for (const item of chequesFiltrados) {
      const monto = Number(item.monto);
      acumulado += monto;

      if (acumulado >= bancoActual) {
        fechaCubierta = item.fechaPago;
        break;
      }
    }

    setBancoCubierto(fechaCubierta);
  }, [data, bancoActual]);

  // Función para manejar el cambio del estado del cheque
  const handleEstadoChange = async (index, event) => {
    const newStatus = event.target.value;
    const item = filteredData[index];

    const dataIndex = data.findIndex((d) => d.id === item.id);
    if (dataIndex === -1) return;

    const updatedData = [...data];
    updatedData[dataIndex] = { ...updatedData[dataIndex], estado: newStatus };
    setData(updatedData);

    try {
      const chequeRef = doc(db, `users/${userId}/Cheques/Electronicos/Egresos`, item.id);
      await updateDoc(chequeRef, { estado: newStatus });
      console.log('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el estado en la base de datos:', error);
    }
  };

  // Filtrar cheques según el estado y la búsqueda
  const filteredData = data.filter(
    (item) =>
      (statusFilter === '' || item.estado === statusFilter) &&
      (item.numero.toString().includes(searchTerm) ||
        item.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cuit.toString().includes(searchTerm) ||
        item.fechaPago.includes(searchTerm) ||
        item.monto.toString().includes(searchTerm))
  );

  // Total de los cheques filtrados
  const totalMonto = filteredData.reduce((total, item) => total + Number(item.monto), 0);

  // Manejar cambio de filtro por estado
  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
  };



    // Función para obtener el nombre del mes en español
const getMonthName = (monthIndex) => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[monthIndex];
};

// Función para calcular las sumas por mes
const calculateSums = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // mes actual (0-11)
  const currentYear = currentDate.getFullYear();

  const month1 = new Date(currentYear, currentMonth, 1); // Primer mes
  const month2 = new Date(currentYear, currentMonth + 1, 1); // Segundo mes
  const month3 = new Date(currentYear, currentMonth + 2, 1); // Tercer mes

  const sumForMonth = (month) => {
    return filteredData.reduce((sum, item) => {
      // Convertir la fecha de pago en formato DD-MM-AAAA a YYYY-MM-DD
      const fechaPago = new Date(item.fechaPago.split('-').reverse().join('-')); 

      // Convertir monto a número antes de sumarlo
      const monto = Number(item.monto); 

      if (
        fechaPago.getFullYear() === month.getFullYear() &&
        fechaPago.getMonth() === month.getMonth()
      ) {
        return sum + monto; // Sumar el monto como número
      }
      return sum;
    }, 0);
  };

  // Actualizar las sumas de los meses
  setSums({
    mes1: sumForMonth(month1),
    mes2: sumForMonth(month2),
    mes3: sumForMonth(month3),
  });
};

    const handleShowCompromisos = () => {
      setShowCompromisos(!showCompromisos);
      calculateSums();
    }
    if (loading) return <p>Cargando datos...</p>;
    if (error) return <p>Error al cargar los datos: {error.message}</p>;
    
  return (
    <div>
      <div style={{ margin: '1%' }}>
      <div style={{ display: 'flex', justifyContent: "space-between" , justifyItems: "center" }}>
        <h2>EMISION ECHEQ + FISICOS - Cubierto Hasta {bancoCubierto}</h2>
          <button className="btn btn-primary mt-3" onClick={handleShowCompromisos}>
            Compromisos por Mes
          </button>
      </div>


        {showCompromisos &&         
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <h2> {getMonthName(new Date().getMonth())}: {sums.mes1.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}</h2>
            <h2> {getMonthName(new Date().getMonth() + 1)}: {sums.mes2.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}</h2>
            <h2> {getMonthName(new Date().getMonth() + 2)}: {sums.mes3.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}</h2>
          </div>
        }



      </div>
      <div className="mb-3">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control mb-3"
        />
        <select className="form-select me-2" onChange={handleStatusChange} value={statusFilter}>
          <option value="">Filtrar por Estado</option>
          <option value="Emitido">Emitido</option>
          <option value="Aceptado">Aceptado</option>
          <option value="Devolución Pendiente">Devolución Pendiente</option>
          <option value="Repudiado">Repudiado</option>
          <option value="Anulado">Anulado</option>
          <option value="Depósito en proceso">Depósito en proceso</option>
          <option value="Presentado al Cobro">Presentado al Cobro</option>
          <option value="Pagado">Pagado</option>
          <option value="Rechazado">Rechazado</option>
          <option value="Vencido">Vencido</option>
        </select>
      </div>

      <table className="table table-striped table-bordered table-hover">
        <thead>
          <tr>
            <th>Número</th>
            <th className="d-none d-md-table-cell">Proveedor</th>
            <th className="d-none d-md-table-cell">Cuit</th>
            <th id="tablePago">
              <span className="d-none d-md-inline">Fecha de</span> Pago
            </th>
            <th id="tableImporte">Importe</th>
            <th id="tableEstado">Estado</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, index) => (
            <tr key={index}>
              <td>{item.numero}</td>
              <td className="d-none d-md-table-cell">{item.proveedor}</td>
              <td className="d-none d-md-table-cell">{item.cuit}</td>
              <td>{item.fechaPago}</td>
              <td>{Number(item.monto).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
              <td>
                <select
                  className="form-select"
                  value={item.estado}
                  onChange={(e) => handleEstadoChange(index, e)}
                >
                  <option value="Emitido">Emitido</option>
                  <option value="Aceptado">Aceptado</option>
                  <option value="Devolucion Pendiente">Devolución Pendiente</option>
                  <option value="Repudiado">Repudiado</option>
                  <option value="Anulado">Anulado</option>
                  <option value="Depósito en proceso">Depósito en proceso</option>
                  <option value="Presentado al Cobro">Presentado al Cobro</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Rechazado">Rechazado</option>
                  <option value="Vencido">Vencido</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3">
        <strong>Total en Tabla: {totalMonto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong>
      </div>
    </div>
  );
};

export default TableCheques;
