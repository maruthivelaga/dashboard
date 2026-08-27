import React from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, MessageSquare } from 'lucide-react';

export const WorkflowBuilder = ({ steps, onChange }) => {
  const handleAddStep = () => {
    const nextNumber = steps.length + 1;
    const newStep = {
      stepNumber: nextNumber,
      stepTitle: `Step ${nextNumber}`,
      description: ''
    };
    onChange([...steps, newStep]);
  };

  const handleDeleteStep = (index) => {
    const updated = steps.filter((_, idx) => idx !== index);
    // Recalculate step numbers
    const renumbered = updated.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1
    }));
    onChange(renumbered);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = steps.map((step, idx) => {
      if (idx === index) {
        return { ...step, [field]: value };
      }
      return step;
    });
    onChange(updated);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...steps];
    // Swap elements
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    // Renumber
    const renumbered = updated.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1
    }));
    onChange(renumbered);
  };

  const handleMoveDown = (index) => {
    if (index === steps.length - 1) return;
    const updated = [...steps];
    // Swap elements
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    // Renumber
    const renumbered = updated.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1
    }));
    onChange(renumbered);
  };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {steps.length === 0 ? (
        <div style={{
          border: '1px dashed #cbd5e1',
          borderRadius: '6px',
          padding: '2rem',
          textAlign: 'center',
          color: '#64748b',
          backgroundColor: '#f8fafc',
          marginBottom: '1rem'
        }}>
          <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
          <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>No workflow steps defined.</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Add steps to map the agent's logical execution pipeline.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  margin: '0.25rem 0',
                  color: '#94a3b8'
                }}>
                  <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }}></div>
                </div>
              )}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'start',
                position: 'relative'
              }}>
                <div style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {step.stepNumber}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Step Title (e.g. Agent understands request)"
                      value={step.stepTitle}
                      onChange={(e) => handleFieldChange(index, 'stepTitle', e.target.value)}
                      style={{ fontWeight: 600 }}
                    />
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Describe what the agent does in this step..."
                      value={step.description}
                      onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  alignSelf: 'stretch',
                  justifyContent: 'center'
                }}>
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      color: index === 0 ? '#cbd5e1' : '#64748b',
                      padding: '4px'
                    }}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === steps.length - 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: index === steps.length - 1 ? 'not-allowed' : 'pointer',
                      color: index === steps.length - 1 ? '#cbd5e1' : '#64748b',
                      padding: '4px'
                    }}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStep(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444',
                      padding: '4px',
                      marginTop: '4px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handleAddStep}
        style={{ marginTop: '0.75rem', width: '100%', borderStyle: 'dashed' }}
      >
        <Plus size={14} /> Add Workflow Step
      </button>
    </div>
  );
};
