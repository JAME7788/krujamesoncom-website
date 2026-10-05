import React from 'react';
import { getBloomInfo, type BloomLevel } from '../services/bloomTaxonomyService';

interface BloomTaxonomyBadgeProps {
  level: BloomLevel;
  showDescription?: boolean;
  size?: 'sm' | 'md';
}

export const BloomTaxonomyBadge: React.FC<BloomTaxonomyBadgeProps> = ({
  level,
  showDescription = false,
  size = 'sm',
}) => {
  const info = getBloomInfo(level);

  return (
    <span
      className="bloom-badge"
      title={`${info.nameTh}: ${info.description}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        borderRadius: 999,
        background: info.bgColor,
        border: `1px solid ${info.borderColor}`,
        color: info.color,
        fontSize: size === 'sm' ? '0.75rem' : '0.82rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{info.icon}</span>
      <span>{info.nameTh}</span>
      {showDescription && (
        <span style={{ fontWeight: 400, opacity: 0.85, fontSize: '0.7rem' }}>
          • ขั้นที่ {info.tier}/6
        </span>
      )}
    </span>
  );
};

export default BloomTaxonomyBadge;
