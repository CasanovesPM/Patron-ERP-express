import React from 'react';
import { ArrowRightCircleFill, CircleFill } from 'react-bootstrap-icons';

const InfoX2Nube = ({ titulo, icono, contenido, contenido2, subtitulo, colorIcono, colorContenido, colorContenido2 }) => {
  // Estilos condicionales para el contenido
  const contenidoStyle = contenido.startsWith('-') ? { color: 'red' } : { color: colorContenido };
  const contenido2Style = contenido2.startsWith('-') ? { color: 'red' } : { color: colorContenido2 };

  return (
    <div className="infoNubeX2">
      <div className="d-flex justify-content-between align-items-center">
        <h3>{titulo}</h3>
        <div className="iconNube" style={{ backgroundColor: colorIcono }}>
          {icono}
        </div>
      </div>
      <div className="mt-2">
        <div className="d-flex justify-content-between align-items-center">
          <div className="circle-with-number">
            <CircleFill className="arrowNubes" />
            <span className="circle-number">15</span>
          </div>
          <ArrowRightCircleFill className="arrowNubes" />
          <h5 className="infoIngreso" style={contenidoStyle}>
            <strong>{contenido}</strong>
          </h5>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div className="circle-with-number">
            <CircleFill className="arrowNubes" />
            <span className="circle-number">30</span>
          </div>
          <ArrowRightCircleFill className="arrowNubes" />
          <h5 className="infoIngreso" style={contenido2Style}>
            <strong>{contenido2}</strong>
          </h5>
        </div>
        <p style={{ fontSize: '100%' }}>{subtitulo}</p>
      </div>
    </div>
  );
};

export default InfoX2Nube;
