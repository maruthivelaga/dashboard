import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'info' }) => {
  if (!isOpen) return null;

  const getHeaderIcon = () => {
    if (type === 'danger') {
      return (
        <div style={{
          background: '#fee2e2',
          color: '#dc2626',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <AlertTriangle size={20} />
        </div>
      );
    }
    return null;
  };

  const getConfirmButtonClass = () => {
    if (type === 'danger') {
      return 'btn btn-danger';
    }
    return 'btn btn-primary';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        border: '1px solid #e2e8f0',
        width: '100%',
        maxWidth: '450px',
        animation: 'modalFade 0.15s ease'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {getHeaderIcon()}
          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          padding: '0.875rem 1.25rem',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px'
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button className={getConfirmButtonClass()} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// CSS Injection for modal fade animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes modalFade {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);
