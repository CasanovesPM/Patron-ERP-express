import React, { useState } from 'react';
import moment from 'moment';

const Cheques = ({ id, label, icon, value, onChange, onClick, title }) => {
  const [fecha, setFecha] = useState(moment().format('DD-MM-YYYY')); // Formato DD-MM-YYYY
  const [localValue, setLocalValue] = useState(value); // Copia inicial del valor

  const [valores, setValores] = useState({
    id: 'cheques',
    fecha: fecha,
    cliente: '',
    monto: '',
    banco: '',
    nroCheque: '',
    librador: '',
    cuitLibrador: '',
    fechaCobro: '',
    entrega: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLocalValue({ ...localValue, [name]: value }); // Actualiza la propiedad específica
        setValores({ ...valores, [event.target.name]: event.target.value });
  };
  return (
    <div className="infoNubeHorizontal p-3">
      <div >
          <h3 className='noneInPC'>{title}</h3>
        {/* Input para la fecha */}
        <input className="inputCheques m-1"
          type="text"
          id={`${id}-fecha`}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
           />
        <input className="inputCheques m-1"
          type="text"
          id={`${id}-cliente`}
          placeholder="Cliente / Proveedor"
          name="cliente" // Identificador único para el input
          value={localValue.cliente} // Usa el valor local
          onChange={handleChange}
        />
          <input className="inputCheques m-1"
          type="text"
          id={`${id}-monto`}
          placeholder="Monto"
          name="monto" // Identificador único para el input
          value={localValue.monto} // Usa el valor local
          onChange={handleChange}
        />
         <input className="inputCheques m-1"
          type="text"
          id={`${id}-banco`}
          placeholder="Banco"
          name="banco" // Identificador único para el input
          value={localValue.banco} // Usa el valor local
          onChange={handleChange}
        />
        <input className="inputCheques m-1"
          type="number"
          id={`${id}-nroCheque`}
          placeholder="Numero de Cheque"
          name="nrocheque" // Identificador único para el input
          value={localValue.nrocheque} // Usa el valor local
          onChange={handleChange}
        />
         <input className="inputCheques m-1"
          type="text"
          id={`${id}-librador`}
          placeholder="Librador"
          name="librador" // Identificador único para el input
          value={localValue.librador} // Usa el valor local
          onChange={handleChange}
        />
        <input className="inputCheques m-1"
          type="text"
          id={`${id}-cuitLibrador`}
          placeholder="CUIT Librador"
          name="cuitLibrador" // Identificador único para el input
          value={localValue.cuitLibrador} // Usa el valor local
          onChange={handleChange}
        />
        <input className="inputCheques m-1" 
          type="text"
          id={`${id}-fechaCobro`}
          placeholder="Fecha de Cobro"
          name="fechaCobro" // Identificador único para el input
          value={localValue.fechaCobro} // Usa el valor local
          onChange={handleChange}
        />
        <button id={`${id}Btn`} className="inputCheques btnCheques" onClick={() => {
        onClick(valores); // Pasa los valores al onClick
      }}>
          {"AGREGAR"}
        </button>
      </div>

    </div>
  );
};

export default Cheques;