import React, { useState } from 'react';
import moment from 'moment';

const ECheques = ({ id, label, icon, value, onChange, onClick, title }) => {
  const fecha = moment().format('DD-MM-YYYY'); // Formato DD-MM-YYYY
  const [localValue, setLocalValue] = useState(value); // Copia inicial del valor


  // Maneja el cambio del select
  const handleChangeSelect = (selectedOption) => {
    setLocalValue(prev => ({
      ...prev,
      motivo: selectedOption ? selectedOption.value : ''
    }));
  };

  // Maneja el cambio de los inputs
  const handleChange = (event) => {
    const { name, value } = event.target;
    setLocalValue(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="infoNubeHorizontal p-3">
      <h3 className='noneInPC'>{title}</h3>

      {/* Input para la fecha */}
      <input
        className="inputCheques m-1"
        type="text"
        id={`${id}-fecha`}
        placeholder={fecha}
        name="fecha"
        value={localValue.fecha}
        onChange={handleChange}
      />
      
      <input
        className="inputCheques m-1"
        type="number"
        id={`${id}-numero`}
        placeholder="Numero de Cheque"
        name="numero"
        value={localValue.numero}
        onChange={handleChange}
      />

      <input
        className="inputCheques m-1"
        type="number"
        id={`${id}-cuit`}
        placeholder="CUIT"
        name="cuit"
        value={localValue.cuit}
        onChange={handleChange}
      />

      <input
        className="inputCheques m-1"
        type="text"
        id={`${id}-importe`}
        placeholder="Importe"
        name="importe"
        value={localValue.importe}
        onChange={handleChange}
      />

      <input
        className="inputCheques m-1"
        type="text"
        id={`${id}-proveedor`}
        placeholder="Proveedor"
        name="proveedor"
        value={localValue.proveedor}
        onChange={handleChange}
      />

      <input
        className="inputCheques m-1"
        type="text"
        id={`${id}-fechaPago`}
        placeholder="Fecha de Pago"
        name="fechaPago"
        value={localValue.fechaPago}
        onChange={handleChange}
      />

        <input
        className="inputCheques m-1"
        type="text"
        id={`${id}-motivo`}
        placeholder="Motivo"
        name="motivo"
        value={localValue.motivo}
        onChange={handleChange}
      />

      <input
        className="inputCheques m-1"
        type="text"
        id={`${id}-descripcion`}
        placeholder="Descripcion (opcional)"
        name="descripcion"
        value={localValue.descripcion}
        onChange={handleChange}
      />

      <button
        id={`${id}Btn`}
        className="inputCheques btnCheques"
        onClick={() => onClick(localValue)}
      >
        {"AGREGAR"}
      </button>
    </div>
  );
};

export default ECheques;
