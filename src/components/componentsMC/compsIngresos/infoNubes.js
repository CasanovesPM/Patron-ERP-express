import React from 'react';

const InfoNube = ({ titulo, icono, contenido, subtitulo, colorIcono, colorContenido }) => {
    return (
      <div className="infoNube">
        <div className="d-flex justify-content-between align-items-center">
          <h3>{titulo}</h3>
          <div className="iconNube" style={{ backgroundColor: colorIcono }}>{icono}</div>
        </div>
        <div className="mt-3">
          <h4 className="infoIngreso" style={{ color: colorContenido }}><strong>{contenido}</strong></h4>
          <p style={{fontSize: '100%'}}>{subtitulo}</p>
        </div>
      </div>
    );
  };

export default InfoNube;