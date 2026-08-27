import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '400px',
      width: '100%'
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const { id, type, message, duration = 4000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-600" style={{ color: '#16a34a' }} />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-600" style={{ color: '#d97706' }} />;
      case 'error':
        return <AlertCircle size={18} className="text-red-600" style={{ color: '#dc2626' }} />;
      default:
        return <Info size={18} className="text-blue-600" style={{ color: '#2563eb' }} />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d'
        };
      case 'warning':
        return {
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          color: '#c2410c'
        };
      case 'error':
        return {
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c'
        };
      default:
        return {
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8'
        };
    }
  };

  return (
    <div style={{
      ...getStyles(),
      display: 'flex',
      alignItems: 'start',
      gap: '0.75rem',
      padding: '0.875rem 1rem',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      transition: 'all 0.2s ease',
      animation: 'slideIn 0.2s ease'
    }}>
      <div style={{ marginTop: '2px' }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>
        {message}
      </div>
      <button 
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          borderRadius: '4px'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.6'}
      >
        <X size={14} />
      </button>
    </div>
  );
};

// CSS Injection for animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);
