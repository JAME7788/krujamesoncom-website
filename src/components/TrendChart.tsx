import React from 'react';

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface Props {
  data: DataPoint[];
  height?: number;
  color?: string;
  yMax?: number;
  ySuffix?: string;
  title?: string;
}

const TrendChart: React.FC<Props> = ({
  data, height = 200, color = '#6366f1', yMax = 100, ySuffix = '%', title,
}) => {
  if (data.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
        ยังไม่มีข้อมูลสำหรับสร้างกราฟ
      </div>
    );
  }

  const w = 600;
  const h = height;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const yScale = (v: number) => innerH - (v / yMax) * innerH;

  const points = data.map((d, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + yScale(d.value),
    ...d,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M ${pad.left} ${pad.top + innerH} L ${polyline.split(' ').join(' L ')} L ${pad.left + (data.length - 1) * xStep} ${pad.top + innerH} Z`;

  return (
    <div className="trend-chart">
      {title && <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#374151' }}>{title}</h4>}
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = pad.top + innerH - p * innerH;
          return (
            <g key={i}>
              <line
                x1={pad.left} y1={y} x2={pad.left + innerW} y2={y}
                stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3,3"
              />
              <text x={pad.left - 8} y={y + 4} fontSize="10" textAnchor="end" fill="#9ca3af">
                {Math.round(yMax * p)}{ySuffix}
              </text>
            </g>
          );
        })}

        {/* Area */}
        <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
            <title>{p.label || p.date}: {p.value}{ySuffix}</title>
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((p, i) => {
          if (data.length > 8 && i % 2 === 1) return null; // skip alternate
          return (
            <text
              key={i}
              x={p.x}
              y={h - 5}
              fontSize="9"
              textAnchor="middle"
              fill="#6b7280"
            >
              {p.date.slice(5)}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default TrendChart;
