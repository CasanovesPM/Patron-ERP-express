import React from 'react';

const AddValue = ({ id, valor, value, onValueChange, onClick, title }) => {
  return (
    <div className="infoNube">
      <div className="mt-1 mb-1" style={{textAlign:'center'}}>
        <h5>{title}</h5>
        <input
          type="number"
          id={`${id}-valor`}
          className="inputNube mt-2"
          placeholder={valor || "Valor $"}
          value={value}  // Asocia el valor del input con la prop `value`
          onChange={onValueChange}  // Usa la función pasada en `onValueChange` para actualizar el estado
        />
      </div>
      <div className="panelBtnNube">
        <button id={`${id}Btn`} className="btn btn-success btnNube" onClick={onClick}>
          AGREGAR
        </button>
      </div>
    </div>
  );
};

export default AddValue;