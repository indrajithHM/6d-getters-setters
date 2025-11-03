import React from 'react';
import './getterSetterlogo.css';

const GetterSetterLogo = ({ size = 100, className = '' }) => {
  return (
    <div 
      className={`gs-logo ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="gs-logo-inner">
        <div className="letter-g">G</div>
        <div className="letter-s">S</div>
        <div className="code-brackets">
          <span className="bracket">{'{'}</span>
          <span className="bracket">{'}'}</span>
        </div>
        <div className="circuit-line horizontal-line-1"></div>
        <div className="circuit-line horizontal-line-2"></div>
        <div className="circuit-line vertical-line-1"></div>
        <div className="circuit-line vertical-line-2"></div>
        <div className="connection-dot dot-1"></div>
        <div className="connection-dot dot-2"></div>
        <div className="connection-dot dot-3"></div>
        <div className="connection-dot dot-4"></div>
      </div>
    </div>
  );
};

export default GetterSetterLogo;