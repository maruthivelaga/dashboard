import React from 'react';

// Custom SVG Bar Chart
export const BarChart = ({ data = {}, title, color = '#2563eb' }) => {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
        No data available
      </div>
    );
  }

  const values = entries.map(([_, val]) => val);
  const maxValue = Math.max(...values, 1);
  const height = 180;
  const paddingBottom = 24;
  const paddingTop = 16;
  const barHeightLimit = height - paddingBottom - paddingTop;

  return (
    <div style={{ width: '100%' }}>
      {title && <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>{title}</h4>}
      <div style={{ display: 'flex', alignItems: 'end', gap: '0.75rem', height: `${height}px`, padding: '0 0.5rem' }}>
        {entries.map(([label, val]) => {
          const barHeight = (val / maxValue) * barHeightLimit;
          return (
            <div key={label} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              height: '100%',
              justifyContent: 'end'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                {val}
              </div>
              <div 
                style={{
                  width: '100%',
                  height: `${barHeight}px`,
                  backgroundColor: color,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease'
                }}
                title={`${label}: ${val}`}
              />
              <div style={{
                fontSize: '0.75rem',
                color: '#64748b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '60px',
                textAlign: 'center'
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Custom SVG Donut Chart
export const DonutChart = ({ data = {}, title, colors = ['#2563eb', '#ea580c', '#16a34a', '#8b5cf6'] }) => {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [_, val]) => sum + val, 0);

  if (entries.length === 0 || total === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
        No status data available
      </div>
    );
  }

  // Calculate coordinates and dash offsets
  let accumulatedPercent = 0;
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~314.16

  const slices = entries.map(([label, val], idx) => {
    const percent = val / total;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;
    return {
      label,
      val,
      percent,
      strokeDasharray,
      strokeDashoffset,
      color: colors[idx % colors.length]
    };
  });

  return (
    <div style={{ width: '100%' }}>
      {title && <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '1rem' }}>{title}</h4>}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        {/* SVG Circle */}
        <div style={{ position: 'relative', width: '130px', height: '130px' }}>
          <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            {slices.map((slice, idx) => (
              <circle
                key={idx}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            ))}
          </svg>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{total}</span>
            <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Total</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', minWidth: '120px' }}>
          {slices.map((slice, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: slice.color }} />
              <div style={{ color: '#475569', flex: 1, whiteSpace: 'nowrap' }}>{slice.label}</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{slice.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
