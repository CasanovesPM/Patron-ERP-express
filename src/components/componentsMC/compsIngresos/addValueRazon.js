import React from 'react';

const AddValueRazon = ({ id, valor, razon, value, motive, onValueChange, onMotiveChange, onClick, title }) => {
  return (
    <div className="infoNube">
      <div className="alignCenterNube mt-1 mb-1">
        <h3 className='noneInPC'>{title}</h3>
        <input
          type="number"
          id={`${id}-valor`}
          className="inputNube"
          placeholder={valor || "Valor $"}
          value={value}  // Asocia el valor del input con la prop `value`
          onChange={onValueChange}  // Usa la función pasada en `onValueChange` para actualizar el estado
        />
      </div>
      <div className="mt-1 mb-1">
        <input
          type="text"
          id={`${id}-razon`}
          className="inputNube"
          placeholder={razon || "Razon"}
          value={motive}  // Asocia el valor del input con la prop `motive`
          onChange={onMotiveChange}  // Usa la función pasada en `onMotiveChange` para actualizar el estado
        />
      </div>
      <div className="panelBtnNube">
        <button id={`${id}Btn`} className="btn btn-success btnNube" onClick={onClick}>
          SUMAR +
        </button>
      </div>
    </div>
  );
};

export default AddValueRazon;