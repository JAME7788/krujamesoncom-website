import React from 'react';
import {
  getResistorBandColors,
  type CircuitTopologyMode,
  type ElectronicsCategoryKey,
} from './electronics101Data';
import {
  BREADBOARD_COLS,
  TOPOLOGY_DEFINITIONS,
  getActiveBreadboardStrips,
  type BreadboardHole,
  type BreadboardJumper,
  type BreadboardRow,
  type SelectablePartId,
} from './electronics101Topologies';

export interface DiagramTelemetry {
  Vs: number;
  R: number;
  R2?: number;
  C: number;
  Rb: number;
  lightLevel: number;
  switchClosed: boolean;
  sw2Closed: boolean;
  Vload: number;
  I_mA: number;
  I2_mA: number;
  P_mW: number;
  Vc: number;
  Ib_uA: number;
  R_ldr: number;
  showDMM: boolean;
  led1Inserted?: boolean;
  led2Inserted?: boolean;
  fuseBlown?: boolean;
  breakerTripped?: boolean;
  wireGaugeMm2?: number;
  touchVoltage?: number;
  bodyCurrentMa?: number;
  faultRepaired?: boolean;
}

interface SchematicProps {
  mode: CircuitTopologyMode;
  telemetry: DiagramTelemetry;
  selectedPart: SelectablePartId;
  onSelectPart: (part: SelectablePartId) => void;
  onToggleSwitch1: () => void;
  onToggleSwitch2: () => void;
  compact?: boolean;
}

export const InteractiveSchematicSvg: React.FC<SchematicProps> = ({
  mode,
  telemetry,
  selectedPart,
  onSelectPart,
  onToggleSwitch1,
  onToggleSwitch2,
  compact = false,
}) => {
  const {
    Vs,
    R,
    C,
    Rb,
    switchClosed,
    sw2Closed,
    Vload,
    I_mA,
    I2_mA,
    Vc,
    Ib_uA,
    R_ldr,
    showDMM,
  } = telemetry;
  const R2 = telemetry.R2 ?? R;
  const fuseBlown = Boolean(telemetry.fuseBlown);
  const breakerTripped = Boolean(telemetry.breakerTripped);
  const wireGaugeMm2 = telemetry.wireGaugeMm2 ?? 2.5;
  const touchVoltage = telemetry.touchVoltage ?? 0;

  const hasCurrent = I_mA > 0.08;
  const hasCurrent2 = I2_mA > 0.08;
  const ink = '#151a2c';
  const teal = '#0f766e';
  const tealSoft = 'rgba(20, 184, 166, 0.16)';
  const red = '#dc2626';
  const amber = '#d97706';

  const selBox = (
    id: SelectablePartId,
    x: number,
    y: number,
    w: number,
    h: number,
    extraClick?: () => void,
  ) => {
    const active = selectedPart === id;
    return (
      <g
        className="e101-svg-selectable"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPart(id);
          if (extraClick) extraClick();
        }}
      >
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={7}
          fill={active ? tealSoft : 'transparent'}
          stroke={active ? teal : 'rgba(15, 118, 110, 0.32)'}
          strokeWidth={active ? 2 : 1.2}
          strokeDasharray={active ? 'none' : '4 3'}
        />
      </g>
    );
  };

  const renderBattery = (x: number, y: number, label = `${Vs.toFixed(1)} V`) => (
    <g>
      {selBox('supply', x - 24, y - 28, 48, 56)}
      <line x1={x} y1={y - 28} x2={x} y2={y - 12} stroke={ink} strokeWidth={2.4} />
      <line x1={x - 15} y1={y - 12} x2={x + 15} y2={y - 12} stroke={ink} strokeWidth={2.8} />
      <line x1={x - 8} y1={y - 4} x2={x + 8} y2={y - 4} stroke={ink} strokeWidth={4} />
      <line x1={x - 15} y1={y + 4} x2={x + 15} y2={y + 4} stroke={ink} strokeWidth={2.8} />
      <line x1={x - 8} y1={y + 12} x2={x + 8} y2={y + 12} stroke={ink} strokeWidth={4} />
      <line x1={x} y1={y + 12} x2={x} y2={y + 28} stroke={ink} strokeWidth={2.4} />
      <text x={x + 12} y={y - 15} fill={red} fontSize={11} fontWeight={700} stroke="none">
        +
      </text>
      <text
        x={x - 28}
        y={y + 4}
        fill={ink}
        fontSize={12}
        fontWeight={700}
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
        stroke="none"
      >
        {label}
      </text>
    </g>
  );

  const renderSwitch = (
    id: 'sw1' | 'sw2',
    x: number,
    y: number,
    closed: boolean,
    onToggle: () => void,
    label?: string,
  ) => (
    <g>
      {selBox(id, x - 26, y - 20, 52, 36, onToggle)}
      <circle cx={x - 16} cy={y} r={3.5} fill="#fff" stroke={ink} strokeWidth={2.2} />
      <circle cx={x + 16} cy={y} r={3.5} fill="#fff" stroke={ink} strokeWidth={2.2} />
      <line
        x1={x - 13}
        y1={y}
        x2={closed ? x + 13 : x + 10}
        y2={closed ? y : y - 14}
        stroke={closed ? teal : red}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <text
        x={x}
        y={y + 24}
        fill={closed ? teal : red}
        fontSize={10.5}
        fontWeight={700}
        textAnchor="middle"
        stroke="none"
      >
        {label || (closed ? 'closed' : 'open')}
      </text>
    </g>
  );

  const renderResistorHoriz = (
    id: 'r1' | 'r2',
    x: number,
    y: number,
    textLabel: string,
    subLabel?: string,
  ) => (
    <g>
      {selBox(id, x - 34, y - 20, 68, 40)}
      <polyline
        points={`${x - 30},${y} ${x - 22},${y} ${x - 18},${y - 8} ${x - 10},${y + 8} ${x - 2},${y - 8} ${x + 6},${y + 8} ${x + 14},${y - 8} ${x + 20},${y} ${x + 30},${y}`}
        fill="none"
        stroke={ink}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <text
        x={x}
        y={y - 12}
        fill={ink}
        fontSize={11.5}
        fontWeight={700}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        stroke="none"
      >
        {textLabel}
      </text>
      {subLabel && (
        <text
          x={x}
          y={y + 21}
          fill={amber}
          fontSize={10}
          fontWeight={700}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          stroke="none"
        >
          {subLabel}
        </text>
      )}
    </g>
  );

  const renderResistorVert = (id: 'r1' | 'r2', x: number, y: number, textLabel: string) => (
    <g>
      {selBox(id, x - 24, y - 32, 48, 64)}
      <polyline
        points={`${x},${y - 28} ${x},${y - 20} ${x - 7},${y - 15} ${x + 7},${y - 8} ${x - 7},${y} ${x + 7},${y + 8} ${x - 7},${y + 15} ${x},${y + 20} ${x},${y + 28}`}
        fill="none"
        stroke={ink}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <text
        x={x - 13}
        y={y + 4}
        fill={ink}
        fontSize={11}
        fontWeight={700}
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
        stroke="none"
      >
        {textLabel}
      </text>
    </g>
  );

  const renderLedVert = (
    id: 'led1' | 'led2',
    x: number,
    y: number,
    active: boolean,
    colorHex: string,
    label = 'LED',
  ) => (
    <g>
      {selBox(id, x - 24, y - 24, 48, 48)}
      <circle
        cx={x}
        cy={y}
        r={15}
        fill={active ? colorHex : '#fff'}
        fillOpacity={active ? 0.88 : 1}
        stroke={ink}
        strokeWidth={2.2}
      />
      <polygon
        points={`${x - 7},${y - 7} ${x + 7},${y - 7} ${x},${y + 6}`}
        fill={active ? '#fff' : 'none'}
        stroke={ink}
        strokeWidth={2}
      />
      <line x1={x - 8} y1={y + 7} x2={x + 8} y2={y + 7} stroke={ink} strokeWidth={2.2} />
      {/* Light rays */}
      <line x1={x + 11} y1={y - 4} x2={x + 19} y2={y - 10} stroke={active ? colorHex : ink} strokeWidth={1.8} />
      <line x1={x + 13} y1={y + 3} x2={x + 21} y2={y - 3} stroke={active ? colorHex : ink} strokeWidth={1.8} />
      <text
        x={x + 22}
        y={y + 5}
        fill={ink}
        fontSize={11.5}
        fontWeight={700}
         stroke="none"
      >
        {label}
      </text>
    </g>
  );

  const renderCapacitorVert = (x: number, y: number, label: string) => (
    <g>
      {selBox('cap1', x - 24, y - 24, 48, 48)}
      <line x1={x} y1={y - 24} x2={x} y2={y - 5} stroke={ink} strokeWidth={2.4} />
      <line x1={x - 13} y1={y - 5} x2={x + 13} y2={y - 5} stroke={ink} strokeWidth={3} />
      <line x1={x - 13} y1={y + 5} x2={x + 13} y2={y + 5} stroke={ink} strokeWidth={3} />
      <line x1={x} y1={y + 5} x2={x} y2={y + 24} stroke={ink} strokeWidth={2.4} />
      <text x={x - 16} y={y - 8} fill={red} fontSize={10} fontWeight={700} stroke="none">
        +
      </text>
      <text
        x={x - 18}
        y={y + 4}
        fill={teal}
        fontSize={11}
        fontWeight={700}
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
        stroke="none"
      >
        {label}
      </text>
    </g>
  );

  const renderBjtNpn = (x: number, y: number, label = 'BC547') => (
    <g>
      {selBox('bjt1', x - 24, y - 24, 48, 48)}
      <circle cx={x} cy={y} r={16} fill="#fff" stroke={ink} strokeWidth={2.2} />
      <line x1={x - 6} y1={y - 10} x2={x - 6} y2={y + 10} stroke={ink} strokeWidth={2.8} />
      <line x1={x - 22} y1={y} x2={x - 6} y2={y} stroke={ink} strokeWidth={2.2} />
      <line x1={x - 6} y1={y - 5} x2={x + 8} y2={y - 14} stroke={ink} strokeWidth={2.2} />
      <line x1={x - 6} y1={y + 5} x2={x + 8} y2={y + 14} stroke={ink} strokeWidth={2.2} />
      <polygon points={`${x + 8},${y + 14} ${x + 1},${y + 13} ${x + 6},${y + 7}`} fill={ink} stroke="none" />
      <text x={x + 20} y={y + 5} fill={ink} fontSize={11} fontWeight={700} stroke="none">
        {label}
      </text>
    </g>
  );

  const renderLdrVert = (x: number, y: number) => {
    const rStr = R_ldr >= 1000 ? `${(R_ldr / 1000).toFixed(1)} kΩ` : `${R_ldr} Ω`;
    return (
      <g>
        {selBox('ldr', x - 24, y - 28, 48, 56)}
        <rect x={x - 12} y={y - 20} width={24} height={40} rx={5} fill="#fef3c7" stroke={ink} strokeWidth={2} />
        <polyline
          points={`${x},${y - 20} ${x - 6},${y - 13} ${x + 6},${y - 6} ${x - 6},${y + 2} ${x + 6},${y + 9} ${x},${y + 20}`}
          fill="none"
          stroke={ink}
          strokeWidth={2}
        />
        <line x1={x - 24} y1={y - 10} x2={x - 14} y2={y - 3} stroke={amber} strokeWidth={1.8} />
        <line x1={x - 24} y1={y + 2} x2={x - 14} y2={y + 9} stroke={amber} strokeWidth={1.8} />
        <text
          x={x - 28}
          y={y + 4}
          fill={teal}
          fontSize={10.5}
          fontWeight={700}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          stroke="none"
        >
          LDR {rStr}
        </text>
      </g>
    );
  };

  const renderCurrentArrow = (x: number, y: number, dir: 'right' | 'left' | 'down', text?: string) => {
    if (!hasCurrent) return null;
    const pts =
      dir === 'right'
        ? `${x - 5},${y - 4} ${x + 5},${y} ${x - 5},${y + 4}`
        : dir === 'left'
          ? `${x + 5},${y - 4} ${x - 5},${y} ${x + 5},${y + 4}`
          : `${x - 4},${y - 5} ${x},${y + 5} ${x + 4},${y - 5}`;
    return (
      <g>
        <polygon points={pts} fill={teal} stroke="none" />
        {text && (
          <text
            x={x}
            y={y - 8}
            fill={teal}
            fontSize={11}
            fontWeight={700}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            stroke="none"
          >
            {text}
          </text>
        )}
      </g>
    );
  };

  return (
    <svg
      viewBox="-18 0 438 220"
      className={`e101-schematic-svg ${compact ? 'is-compact' : ''}`}
      aria-label={`Circuit schematic for ${mode}`}
    >
      {/* Topology-specific schematic drawing */}
      {(mode === 'DC' || mode === 'LDR_DIRECT') && (
        <g>
          {/* Outer loop */}
          <path
            d="M 66 82 L 66 42 L 336 42 L 336 182 L 66 182 L 66 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          {renderBattery(66, 110)}
          {renderSwitch('sw1', 142, 42, switchClosed, onToggleSwitch1)}
          {renderResistorHoriz(
            'r1',
            245,
            42,
            `${R} Ω`,
            mode === 'LDR_DIRECT' ? `LDR ${(R_ldr / 1000).toFixed(1)}kΩ` : undefined,
          )}
          {mode === 'LDR_DIRECT' ? (
            <>
              <rect x={320} y={62} width={32} height={24} fill="#fff" stroke="none" />
              {renderLdrVert(336, 76)}
              <rect x={320} y={118} width={32} height={36} fill="#fff" stroke="none" />
              {renderLedVert('led1', 336, 136, hasCurrent, '#ef4444', 'LED')}
            </>
          ) : (
            <>
              <rect x={320} y={90} width={32} height={44} fill="#fff" stroke="none" />
              {renderLedVert('led1', 336, 112, hasCurrent, '#ef4444', 'LED')}
            </>
          )}
          {renderCurrentArrow(100, 42, 'right', `${I_mA.toFixed(1)} mA`)}
          {renderCurrentArrow(200, 182, 'left')}
          {showDMM && (
            <g onClick={() => onSelectPart('dmm')} style={{ cursor: 'pointer' }}>
              <path
                d="M 336 68 L 386 68 L 386 156 L 336 156"
                fill="none"
                stroke="#64748b"
                strokeWidth={1.6}
                strokeDasharray="4 3"
              />
              <circle cx={386} cy={112} r={12} fill="#fef3c7" stroke={ink} strokeWidth={2} />
              <text x={386} y={116} fill={ink} fontSize={11} fontWeight={700} textAnchor="middle" stroke="none">
                V
              </text>
            </g>
          )}
        </g>
      )}

      {mode === 'SERIES' && (
        <g>
          <path
            d="M 62 82 L 62 42 L 336 42 L 336 182 L 62 182 L 62 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          {renderBattery(62, 110)}
          {renderSwitch('sw1', 120, 42, switchClosed, onToggleSwitch1)}
          {renderResistorHoriz('r1', 198, 42, `R1 ${R}Ω`)}
          {renderResistorHoriz('r2', 282, 42, `R2 ${R2}Ω`)}
          {renderLedVert(
            'led1',
            336,
            86,
            hasCurrent && telemetry.led1Inserted !== false,
            '#ef4444',
            telemetry.led1Inserted === false ? 'LED1 (ถอด)' : 'LED 1',
          )}
          {renderLedVert(
            'led2',
            336,
            142,
            hasCurrent && telemetry.led2Inserted !== false,
            '#22c55e',
            telemetry.led2Inserted === false ? 'LED2 (ถอด)' : 'LED 2',
          )}
          {renderCurrentArrow(155, 42, 'right', `${I_mA.toFixed(1)} mA`)}
          {renderCurrentArrow(195, 182, 'left')}
        </g>
      )}

      {mode === 'PARALLEL' && (
        <g>
          <path
            d="M 58 82 L 58 40 L 346 40 L 346 182 L 58 182 L 58 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          <line x1={236} y1={40} x2={236} y2={182} stroke={ink} strokeWidth={2.4} />
          {renderBattery(58, 110)}
          {renderSwitch('sw1', 132, 40, switchClosed, onToggleSwitch1)}
          {renderResistorVert('r1', 236, 78, `R1 ${R}Ω`)}
          {renderLedVert(
            'led1',
            236,
            142,
            hasCurrent && telemetry.led1Inserted !== false,
            '#ef4444',
            `I1 ${I_mA.toFixed(1)}mA`,
          )}
          {renderResistorVert('r2', 346, 78, `R2 ${R2}Ω`)}
          {renderLedVert(
            'led2',
            346,
            142,
            hasCurrent2 && telemetry.led2Inserted !== false,
            '#22c55e',
            `I2 ${I2_mA.toFixed(1)}mA`,
          )}
          {renderCurrentArrow(184, 40, 'right', `${(I_mA + I2_mA).toFixed(1)} mA`)}
          {renderCurrentArrow(290, 40, 'right', `${I2_mA.toFixed(1)} mA`)}
        </g>
      )}

      {mode === 'VDIV' && (
        <g>
          <path
            d="M 64 82 L 64 38 L 246 38 L 246 184 L 64 184 L 64 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          <path
            d="M 246 111 L 348 111 L 348 184 L 246 184"
            fill="none"
            stroke={ink}
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          {renderBattery(64, 110)}
          {renderSwitch('sw1', 145, 38, switchClosed, onToggleSwitch1)}
          {renderResistorVert('r1', 246, 74, `R1 ${R}Ω`)}
          {renderResistorVert('r2', 246, 148, `R2 ${R2}Ω`)}
          {renderLedVert('led1', 348, 148, hasCurrent, '#ef4444', `Vout ${Vload.toFixed(1)}V`)}
          <circle cx={246} cy={111} r={4} fill={teal} stroke="none" />
          <text
            x={256}
            y={105}
            fill={teal}
            fontSize={11}
            fontWeight={700}
            fontFamily="JetBrains Mono, monospace"
            stroke="none"
          >
            V_mid = {Vload.toFixed(2)}V
          </text>
        </g>
      )}

      {(mode === 'RC' || mode === 'AC') && (
        <g>
          <path
            d="M 62 82 L 62 40 L 344 40 L 344 182 L 62 182 L 62 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          <line x1={238} y1={40} x2={238} y2={182} stroke={ink} strokeWidth={2.4} />
          {renderBattery(62, 110, mode === 'AC' ? `${Vs.toFixed(1)}V AC` : `${Vs.toFixed(1)} V`)}
          {renderSwitch('sw1', 124, 40, switchClosed, onToggleSwitch1)}
          {renderResistorHoriz('r1', 190, 40, `${R} Ω`)}
          {renderCapacitorVert(238, 111, `${C} µF`)}
          {renderLedVert('led1', 344, 111, hasCurrent, '#ef4444', 'LED')}
          <text
            x={238}
            y={28}
            fill={teal}
            fontSize={11}
            fontWeight={700}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            stroke="none"
          >
            Vc = {Vc.toFixed(2)} V
          </text>
          {renderCurrentArrow(290, 40, 'right', `${I_mA.toFixed(1)} mA`)}
        </g>
      )}

      {mode === 'ASTABLE' && (
        <g>
          <path
            d="M 56 82 L 56 32 L 364 32 L 364 190 L 56 190 L 56 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.2}
          />
          <line x1={126} y1={32} x2={126} y2={190} stroke={ink} strokeWidth={2.2} />
          <line x1={194} y1={32} x2={194} y2={108} stroke={ink} strokeWidth={2} />
          <line x1={262} y1={32} x2={262} y2={108} stroke={ink} strokeWidth={2} />
          {renderBattery(56, 110)}
          {renderResistorVert('r1', 126, 62, `${R} Ω`)}
          {renderLedVert('led1', 126, 112, I_mA > 1, '#ef4444', 'Red')}
          {renderBjtNpn(126, 162, 'Q1')}
          {renderResistorVert('r2', 364, 62, `${R} Ω`)}
          {renderLedVert('led2', 364, 112, I2_mA > 1, '#22c55e', 'Green')}
          {/* Cross-coupling capacitor */}
          {selBox('cap1', 186, 92, 84, 34)}
          <line x1={126} y1={134} x2={218} y2={108} stroke={teal} strokeWidth={2} />
          <line x1={232} y1={108} x2={342} y2={162} stroke={teal} strokeWidth={2} />
          <text
            x={228}
            y={100}
            fill={teal}
            fontSize={10.5}
            fontWeight={700}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            stroke="none"
          >
            C1/C2 {C}µF
          </text>
        </g>
      )}

      {(mode === 'AND' || mode === 'SPDT') && (
        <g>
          <path
            d="M 60 82 L 60 42 L 342 42 L 342 182 L 60 182 L 60 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          {renderBattery(60, 110)}
          {renderSwitch('sw1', 126, 42, switchClosed, onToggleSwitch1, 'SW 1')}
          {renderSwitch('sw2', 202, 42, sw2Closed, onToggleSwitch2, 'SW 2')}
          {renderResistorHoriz('r1', 282, 42, `${R} Ω`)}
          {renderLedVert('led1', 342, 112, hasCurrent, '#ef4444', 'LED')}
          {renderCurrentArrow(200, 182, 'left', `${I_mA.toFixed(1)} mA`)}
        </g>
      )}

      {(mode === 'BJT' || mode === 'NOT') && (
        <g>
          <path
            d="M 60 82 L 60 36 L 324 36 L 324 184 L 60 184 L 60 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          <path d="M 60 124 L 300 124" fill="none" stroke={ink} strokeWidth={2.2} />
          {renderBattery(60, 110)}
          {renderSwitch('sw1', 126, 124, switchClosed, onToggleSwitch1, 'Base SW')}
          {renderResistorHoriz('r2', 218, 124, `RB ${(Rb / 1000).toFixed(1)}kΩ`)}
          {renderResistorVert('r1', 324, 68, `${R} Ω`)}
          {renderLedVert('led1', 324, 114, hasCurrent, '#ef4444', 'LED')}
          {renderBjtNpn(324, 156, 'BC547')}
          <text
            x={218}
            y={155}
            fill={teal}
            fontSize={10.5}
            fontWeight={700}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            stroke="none"
          >
            Ib = {Ib_uA.toFixed(0)} µA
          </text>
          {renderCurrentArrow(210, 36, 'right', `Ic = ${I_mA.toFixed(1)} mA`)}
        </g>
      )}

      {mode === 'LDR_NIGHT' && (
        <g>
          <path
            d="M 58 82 L 58 34 L 332 34 L 332 186 L 58 186 L 58 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          <line x1={182} y1={34} x2={182} y2={186} stroke={ink} strokeWidth={2.2} />
          <path d="M 182 108 L 248 108 L 248 154 L 308 154" fill="none" stroke={ink} strokeWidth={2.2} />
          {renderBattery(58, 110)}
          {renderResistorVert('r2', 182, 68, `${(Rb / 1000).toFixed(0)} kΩ`)}
          {renderLdrVert(182, 146)}
          {renderResistorVert('r1', 332, 66, `${R} Ω`)}
          {renderLedVert('led1', 332, 110, hasCurrent, '#ef4444', 'LED')}
          {renderBjtNpn(332, 154, 'BC547')}
          <circle cx={182} cy={108} r={3.5} fill={teal} stroke="none" />
          <text
            x={172}
            y={104}
            fill={teal}
            fontSize={10}
            fontWeight={700}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            stroke="none"
          >
            {Ib_uA > 0.5 ? '0.70 V' : '0.18 V'}
          </text>
          {renderCurrentArrow(258, 34, 'right', `${I_mA.toFixed(1)} mA`)}
        </g>
      )}

      {(mode === 'FUSE_TRIP' || mode === 'TROUBLESHOOT') && (
        <g>
          <path
            d="M 58 82 L 58 40 L 344 40 L 344 182 L 58 182 L 58 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          {mode === 'FUSE_TRIP' && (
            <line x1={222} y1={40} x2={222} y2={182} stroke={red} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {renderBattery(58, 110)}
          {renderSwitch('sw1', 112, 40, switchClosed, onToggleSwitch1, 'MAIN')}
          {/* Fuse symbol */}
          <g onClick={() => onSelectPart('fuse1')} style={{ cursor: 'pointer' }}>
            {selBox('fuse1', 152, 22, 52, 36)}
            <rect
              x={158}
              y={32}
              width={40}
              height={16}
              rx={3}
              fill={fuseBlown ? '#fee2e2' : '#f8fafc'}
              stroke={fuseBlown ? red : ink}
              strokeWidth={2}
            />
            {fuseBlown ? (
              <>
                <line x1={158} y1={40} x2={172} y2={36} stroke={red} strokeWidth={2} />
                <line x1={184} y1={44} x2={198} y2={40} stroke={red} strokeWidth={2} />
              </>
            ) : (
              <path
                d="M 158 40 Q 168 33, 178 40 T 198 40"
                fill="none"
                stroke={teal}
                strokeWidth={2.2}
              />
            )}
            <text
              x={178}
              y={26}
              fill={fuseBlown ? red : ink}
              fontSize={10}
              fontWeight={700}
              textAnchor="middle"
              stroke="none"
            >
              {fuseBlown ? 'FUSE BLOWN!' : 'FUSE 35mA'}
            </text>
          </g>
          {renderResistorHoriz('r1', 278, 40, `R1 ${R}Ω`)}
          {renderLedVert('led1', 344, 112, hasCurrent && !fuseBlown, '#ef4444', 'LOAD')}
          {mode === 'FUSE_TRIP' &&
            renderSwitch('sw2', 222, 112, sw2Closed, onToggleSwitch2, 'SHORT SW2')}
          {renderCurrentArrow(242, 40, 'right', `${I_mA.toFixed(1)} mA`)}
        </g>
      )}

      {mode === 'BREAKER' && (
        <g>
          <path
            d="M 60 82 L 60 42 L 340 42 L 340 182 L 60 182 L 60 138"
            fill="none"
            stroke="#7c2d12"
            strokeWidth={Math.max(2.2, Math.min(5.2, wireGaugeMm2 * 1.15))}
          />
          {renderBattery(60, 110)}
          {renderSwitch(
            'sw1',
            142,
            42,
            switchClosed && !breakerTripped,
            onToggleSwitch1,
            breakerTripped ? 'CB TRIPPED!' : 'CB ON',
          )}
          {renderResistorHoriz(
            'r1',
            248,
            42,
            `LOAD ${R}Ω`,
            `สาย ${wireGaugeMm2} ตร.มม. (มอก.11-2553)`,
          )}
          {renderLedVert('led1', 340, 112, hasCurrent && !breakerTripped, '#ef4444', 'MOTOR/LAMP')}
          {renderCurrentArrow(196, 42, 'right', `${I_mA.toFixed(1)} mA`)}
        </g>
      )}

      {mode === 'SAFETY_GROUND' && (
        <g>
          <path
            d="M 58 82 L 58 38 L 328 38 L 328 176 L 58 176 L 58 138"
            fill="none"
            stroke={ink}
            strokeWidth={2.4}
          />
          <path
            d="M 328 118 L 382 118 L 382 192"
            fill="none"
            stroke="#16a34a"
            strokeWidth={2.4}
            strokeDasharray={sw2Closed ? 'none' : '4 3'}
          />
          {renderBattery(58, 110, '220V SIM')}
          {renderSwitch('sw1', 132, 38, switchClosed, onToggleSwitch1, 'Line (L)')}
          {renderResistorHoriz('r1', 232, 38, `Load ${R}Ω`)}
          {renderLedVert(
            'led1',
            328,
            102,
            hasCurrent,
            sw2Closed ? '#22c55e' : '#ef4444',
            `โครง ${touchVoltage.toFixed(0)}V`,
          )}
          {renderSwitch(
            'sw2',
            382,
            152,
            sw2Closed,
            onToggleSwitch2,
            sw2Closed ? 'G ต่อลงดิน' : 'G หลุด!',
          )}
          {/* Earth Ground Rod Symbol */}
          <line x1={368} y1={192} x2={396} y2={192} stroke="#16a34a" strokeWidth={2.8} />
          <line x1={373} y1={198} x2={391} y2={198} stroke="#16a34a" strokeWidth={2.4} />
          <line x1={378} y1={204} x2={386} y2={204} stroke="#16a34a" strokeWidth={2} />
        </g>
      )}
    </svg>
  );
};

interface BreadboardSvgProps {
  mode: CircuitTopologyMode;
  telemetry: DiagramTelemetry;
  selectedPart: SelectablePartId;
  onSelectPart: (part: SelectablePartId) => void;
  seeThrough: boolean;
  breadboardStep?: 1 | 2 | 3;
  customJumpers?: BreadboardJumper[];
  pendingHole?: BreadboardHole | null;
  onClickHole?: (hole: BreadboardHole) => void;
  showWiringHint?: boolean;
}

const UPPER_ROWS: BreadboardRow[] = ['a', 'b', 'c', 'd', 'e'];
const LOWER_ROWS: BreadboardRow[] = ['f', 'g', 'h', 'i', 'j'];

function holeToSvgXY(hole: BreadboardHole): [number, number] {
  const x0 = 218;
  const colPitch = 14;
  const x = x0 + (hole.col - 1) * colPitch;

  const rowY: Record<BreadboardRow, number> = {
    '+T': 36,
    '-T': 49,
    a: 74,
    b: 87,
    c: 100,
    d: 113,
    e: 126,
    f: 154,
    g: 167,
    h: 180,
    i: 193,
    j: 206,
    '+B': 231,
    '-B': 244,
  };
  return [x, rowY[hole.row] ?? 140];
}

export const InteractiveBreadboardSvg: React.FC<BreadboardSvgProps> = ({
  mode,
  telemetry,
  selectedPart,
  onSelectPart,
  seeThrough,
  breadboardStep = 2,
  customJumpers,
  pendingHole,
  onClickHole,
  showWiringHint = false,
}) => {
  const topo = TOPOLOGY_DEFINITIONS[mode] || TOPOLOGY_DEFINITIONS.DC;
  const activeStrips = getActiveBreadboardStrips(topo);
  const bandColors = getResistorBandColors(telemetry.R);
  const bandColorsR2 = getResistorBandColors(telemetry.R2 ?? telemetry.R);
  const hasCurrent = telemetry.I_mA > 0.08;
  const displayedJumpers = customJumpers !== undefined ? customJumpers : topo.bbJumpers;

  // Step 3 (common mistake demo on Lesson 7): both LED legs in column 14
  const isShortMistake = breadboardStep === 3;
  const isStep1Only = breadboardStep === 1;

  return (
    <svg viewBox="0 0 580 280" className="e101-breadboard-svg" aria-label="2D Breadboard layout">
      {/* Off-board Battery Pack (2 x AA / Bench Supply) */}
      <g
        style={{ cursor: 'pointer' }}
        onClick={() => onSelectPart('supply')}
      >
        <rect
          x={18}
          y={102}
          width={136}
          height={88}
          rx={6}
          fill="#27272a"
          stroke={selectedPart === 'supply' ? '#0f766e' : '#151a2c'}
          strokeWidth={selectedPart === 'supply' ? 3 : 2}
        />
        <rect x={26} y={108} width={118} height={36} rx={4} fill="#b59469" stroke="#151a2c" strokeWidth={1.5} />
        <rect x={26} y={148} width={118} height={36} rx={4} fill="#b59469" stroke="#151a2c" strokeWidth={1.5} />
        <text
          x={86}
          y={208}
          fill="#151a2c"
          fontSize={10.5}
          fontWeight={700}
          textAnchor="middle"
        >
          Battery pack · {telemetry.Vs.toFixed(1)} V
        </text>
        {/* Supply Leads to +B and -B rails */}
        <path
          d="M 154 166 C 176 166, 178 231, 218 231"
          fill="none"
          stroke="#dc2626"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path
          d="M 154 128 C 184 128, 184 244, 232 244"
          fill="none"
          stroke="#1e293b"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>

      {/* Solderless Breadboard Housing */}
      <rect
        x={196}
        y={20}
        width={364}
        height={240}
        rx={8}
        fill="#f7f2e7"
        stroke="#151a2c"
        strokeWidth={2.2}
      />

      {/* Center IC Channel */}
      <rect x={198} y={135} width={360} height={10} fill="#e5dec9" />

      {/* Power Rail Red/Blue Lines */}
      <line x1={212} y1={31} x2={544} y2={31} stroke="#ef4444" strokeWidth={1.6} />
      <line x1={212} y1={55} x2={544} y2={55} stroke="#3b82f6" strokeWidth={1.6} />
      <line x1={212} y1={226} x2={544} y2={226} stroke="#ef4444" strokeWidth={1.6} />
      <line x1={212} y1={250} x2={544} y2={250} stroke="#3b82f6" strokeWidth={1.6} />

      {/* Internal Metal Clips (See-Through Mode) */}
      {seeThrough && (
        <g opacity={0.85}>
          {/* Bottom power rail strips */}
          <rect x={213} y={228} width={332} height={6} rx={3} fill="rgba(239, 68, 68, 0.35)" />
          <rect x={213} y={241} width={332} height={6} rx={3} fill="rgba(59, 130, 246, 0.35)" />
          {/* 5-hole vertical strips */}
          {Array.from({ length: BREADBOARD_COLS }, (_, idx) => {
            const col = idx + 1;
            const cx = 218 + idx * 14;
            const isUpperActive = activeStrips.upperCols.has(col);
            const isLowerActive = activeStrips.lowerCols.has(col);
            return (
              <React.Fragment key={col}>
                <rect
                  x={cx - 3.5}
                  y={70}
                  width={7}
                  height={60}
                  rx={3}
                  fill={isUpperActive ? 'rgba(20, 184, 166, 0.45)' : 'rgba(148, 163, 184, 0.25)'}
                  stroke={isUpperActive ? '#0f766e' : 'none'}
                  strokeWidth={1}
                />
                <rect
                  x={cx - 3.5}
                  y={150}
                  width={7}
                  height={60}
                  rx={3}
                  fill={isLowerActive ? 'rgba(20, 184, 166, 0.45)' : 'rgba(148, 163, 184, 0.25)'}
                  stroke={isLowerActive ? '#0f766e' : 'none'}
                  strokeWidth={1}
                />
              </React.Fragment>
            );
          })}
        </g>
      )}

      {/* Breadboard Pin Holes */}
      {Array.from({ length: BREADBOARD_COLS }, (_, idx) => {
        const col = idx + 1;
        const cx = 218 + idx * 14;
        return (
          <g key={col}>
            {col % 5 === 0 && (
              <>
                <text x={cx} y={67} fontSize={7.5} fill="#64748b" textAnchor="middle" fontWeight={700}>
                  {col}
                </text>
                <text x={cx} y={220} fontSize={7.5} fill="#64748b" textAnchor="middle" fontWeight={700}>
                  {col}
                </text>
              </>
            )}
            {(['+T', '-T', ...UPPER_ROWS, ...LOWER_ROWS, '+B', '-B'] as BreadboardRow[]).map((r) => {
              const [, cy] = holeToSvgXY({ col, row: r });
              const isPending = pendingHole?.col === col && pendingHole?.row === r;
              return (
                <g
                  key={r}
                  style={{ cursor: onClickHole ? 'crosshair' : 'default' }}
                  onClick={() => onClickHole?.({ col, row: r })}
                >
                  <rect x={cx - 5.5} y={cy - 5.5} width={11} height={11} fill="transparent" />
                  <rect
                    x={cx - 2}
                    y={cy - 2}
                    width={4}
                    height={4}
                    rx={0.8}
                    fill={isPending ? '#0f766e' : '#334155'}
                  />
                  {isPending && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5.5}
                      fill="none"
                      stroke="#0f766e"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Row Labels */}
      {[...UPPER_ROWS, ...LOWER_ROWS].map((r) => {
        const [, cy] = holeToSvgXY({ col: 1, row: r });
        return (
          <React.Fragment key={r}>
            <text x={205} y={cy + 2.5} fontSize={8} fill="#64748b" fontWeight={700} textAnchor="middle">
              {r}
            </text>
            <text x={551} y={cy + 2.5} fontSize={8} fill="#64748b" fontWeight={700} textAnchor="middle">
              {r}
            </text>
          </React.Fragment>
        );
      })}

      {/* Target Hint Circles for Wiring Challenge */}
      {showWiringHint &&
        topo.bbJumpers.map((j, i) => {
          const [x1, y1] = holeToSvgXY(j.from);
          const [x2, y2] = holeToSvgXY(j.to);
          return (
            <g key={`hint-${i}`} pointerEvents="none">
              <circle cx={x1} cy={y1} r={6} fill="rgba(217, 119, 6, 0.2)" stroke="#d97706" strokeWidth={1.6} strokeDasharray="2 2" />
              <circle cx={x2} cy={y2} r={6} fill="rgba(217, 119, 6, 0.2)" stroke="#d97706" strokeWidth={1.6} strokeDasharray="2 2" />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d97706" strokeWidth={1.4} strokeDasharray="3 3" opacity={0.65} />
            </g>
          );
        })}

      {/* Jumper Wires */}
      {!isStep1Only &&
        displayedJumpers.map((j, i) => {
          const [x1, y1] = holeToSvgXY(j.from);
          const [x2, y2] = holeToSvgXY(j.to);
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#151a2c"
                strokeWidth={5.2}
                strokeLinecap="round"
              />
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={j.color}
                strokeWidth={3.4}
                strokeLinecap="round"
              />
            </g>
          );
        })}

      {/* Plugged-in Components */}
      {!isStep1Only &&
        topo.bbParts.map((part) => {
          const [p1x, p1y] = holeToSvgXY(part.pins[0]);
          const [p2x, p2y] = holeToSvgXY(
            isShortMistake && part.id === 'led1'
              ? { col: part.pins[0].col, row: 'd' }
              : part.pins[1],
          );
          const mx = (p1x + p2x) / 2;
          const my = (p1y + p2y) / 2;

          if (part.kind === 'resistor') {
            const rCols = part.id === 'r2' ? bandColorsR2 : bandColors;
            return (
              <g
                key={part.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectPart(part.id)}
              >
                <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="#94a3b8" strokeWidth={2.5} />
                <rect
                  x={mx - 17}
                  y={my - 6}
                  width={34}
                  height={12}
                  rx={4}
                  fill="#dfbe8f"
                  stroke="#151a2c"
                  strokeWidth={1.8}
                />
                <rect x={mx - 11} y={my - 5.5} width={3.5} height={11} fill={rCols[0]} />
                <rect x={mx - 4} y={my - 5.5} width={3.5} height={11} fill={rCols[1]} />
                <rect x={mx + 3} y={my - 5.5} width={3.5} height={11} fill={rCols[2]} />
                <rect x={mx + 10} y={my - 5.5} width={3} height={11} fill="#d4af37" />
              </g>
            );
          }

          if (part.kind === 'fuse') {
            const blown = Boolean(telemetry.fuseBlown);
            return (
              <g
                key={part.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectPart(part.id)}
              >
                <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="#94a3b8" strokeWidth={2.5} />
                <rect
                  x={mx - 18}
                  y={my - 6}
                  width={36}
                  height={12}
                  rx={5}
                  fill={blown ? '#fee2e2' : '#e0f2fe'}
                  stroke="#151a2c"
                  strokeWidth={1.8}
                />
                <rect x={mx - 18} y={my - 6} width={7} height={12} rx={2} fill="#cbd5e1" stroke="#151a2c" strokeWidth={1.2} />
                <rect x={mx + 11} y={my - 6} width={7} height={12} rx={2} fill="#cbd5e1" stroke="#151a2c" strokeWidth={1.2} />
                {!blown && (
                  <line x1={mx - 11} y1={my} x2={mx + 11} y2={my} stroke="#d97706" strokeWidth={1.8} />
                )}
              </g>
            );
          }

          if (part.kind === 'led_red' || part.kind === 'led_green') {
            const isRed = part.kind === 'led_red';
            const lit = !isShortMistake && (isRed ? hasCurrent : telemetry.I2_mA > 0.08);
            const baseCol = isRed ? '#ef4444' : '#22c55e';
            return (
              <g
                key={part.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectPart(part.id)}
              >
                <line x1={p1x} y1={p1y} x2={mx - 4} y2={my - 10} stroke="#64748b" strokeWidth={2.2} />
                <line x1={p2x} y1={p2y} x2={mx + 4} y2={my - 10} stroke="#64748b" strokeWidth={2.2} />
                {lit && (
                  <circle cx={mx} cy={my - 12} r={18} fill={baseCol} opacity={0.32} />
                )}
                <circle
                  cx={mx}
                  cy={my - 12}
                  r={10}
                  fill={baseCol}
                  stroke="#151a2c"
                  strokeWidth={2}
                />
                <circle cx={mx - 3} cy={my - 15} r={2.5} fill="#fff" opacity={0.85} />
              </g>
            );
          }

          if (part.kind === 'capacitor') {
            return (
              <g key={part.id} style={{ cursor: 'pointer' }} onClick={() => onSelectPart(part.id)}>
                <line x1={p1x} y1={p1y} x2={mx} y2={my} stroke="#64748b" strokeWidth={2.2} />
                <line x1={p2x} y1={p2y} x2={mx} y2={my} stroke="#64748b" strokeWidth={2.2} />
                <circle cx={mx} cy={my} r={10} fill="#1d4ed8" stroke="#151a2c" strokeWidth={2} />
                <circle cx={mx} cy={my} r={6} fill="#cbd5e1" />
              </g>
            );
          }

          if (part.kind === 'bjt' && part.pins[2]) {
            const [p3x, p3y] = holeToSvgXY(part.pins[2]);
            const bx = p2x;
            const by = p2y;
            return (
              <g key={part.id} style={{ cursor: 'pointer' }} onClick={() => onSelectPart(part.id)}>
                <line x1={p1x} y1={p1y} x2={bx - 6} y2={by - 8} stroke="#64748b" strokeWidth={2} />
                <line x1={p2x} y1={p2y} x2={bx} y2={by - 8} stroke="#64748b" strokeWidth={2} />
                <line x1={p3x} y1={p3y} x2={bx + 6} y2={by - 8} stroke="#64748b" strokeWidth={2} />
                <rect
                  x={bx - 12}
                  y={by - 18}
                  width={24}
                  height={12}
                  rx={4}
                  fill="#1e293b"
                  stroke="#151a2c"
                  strokeWidth={1.8}
                />
                <text x={bx} y={by - 10} fontSize={7} fill="#fff" textAnchor="middle" fontWeight={700}>
                  BC547
                </text>
              </g>
            );
          }

          if (part.kind === 'ldr') {
            return (
              <g key={part.id} style={{ cursor: 'pointer' }} onClick={() => onSelectPart(part.id)}>
                <line x1={p1x} y1={p1y} x2={mx - 5} y2={my} stroke="#64748b" strokeWidth={2} />
                <line x1={p2x} y1={p2y} x2={mx + 5} y2={my} stroke="#64748b" strokeWidth={2} />
                <circle cx={mx} cy={my} r={10} fill="#fde68a" stroke="#151a2c" strokeWidth={2} />
                <path
                  d={`M ${mx - 5} ${my - 3} L ${mx + 5} ${my - 3} L ${mx - 5} ${my + 3} L ${mx + 5} ${my + 3}`}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth={1.8}
                />
              </g>
            );
          }

          // Switch
          return (
            <g key={part.id} style={{ cursor: 'pointer' }} onClick={() => onSelectPart(part.id)}>
              <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="#475569" strokeWidth={3} />
              <rect
                x={mx - 12}
                y={my - 8}
                width={24}
                height={16}
                rx={3}
                fill="#334155"
                stroke="#151a2c"
                strokeWidth={1.8}
              />
              <circle
                cx={telemetry.switchClosed ? mx + 4 : mx - 4}
                cy={my}
                r={4.5}
                fill={telemetry.switchClosed ? '#22c55e' : '#ef4444'}
              />
            </g>
          );
        })}
    </svg>
  );
};

export const LessonThumbnailSvg: React.FC<{
  category: ElectronicsCategoryKey;
  index: number;
  mode: CircuitTopologyMode;
}> = ({ category, index, mode }) => {
  return (
    <svg viewBox="0 0 68 46" className="e101-thumb-svg" aria-hidden="true">
      <rect x={2} y={2} width={64} height={42} rx={6} fill="#efe8d8" stroke="#d5ccb8" strokeWidth={1} />
      {category === 'basics' && index === 6 ? (
        // Breadboard icon
        <g>
          <rect x={12} y={10} width={44} height={26} rx={3} fill="#fff" stroke="#151a2c" strokeWidth={1.6} />
          <line x1={14} y1={14} x2={54} y2={14} stroke="#ef4444" strokeWidth={1.2} />
          <line x1={14} y1={32} x2={54} y2={32} stroke="#3b82f6" strokeWidth={1.2} />
          <circle cx={24} cy={23} r={2} fill="#151a2c" />
          <circle cx={34} cy={23} r={2} fill="#151a2c" />
          <circle cx={44} cy={23} r={2} fill="#151a2c" />
        </g>
      ) : category === 'resistors' ? (
        <g>
          <line x1={8} y1={23} x2={60} y2={23} stroke="#64748b" strokeWidth={2.2} />
          <rect x={18} y={16} width={32} height={14} rx={4} fill="#dfbe8f" stroke="#151a2c" strokeWidth={1.6} />
          <rect x={24} y={17} width={4} height={12} fill="#ef4444" />
          <rect x={32} y={17} width={4} height={12} fill="#a855f7" />
          <rect x={40} y={17} width={4} height={12} fill="#d4af37" />
        </g>
      ) : category === 'leds' ? (
        <g>
          <line x1={30} y1={28} x2={30} y2={40} stroke="#64748b" strokeWidth={2} />
          <line x1={38} y1={28} x2={38} y2={40} stroke="#64748b" strokeWidth={2} />
          <path d="M 24 28 L 24 16 A 10 10 0 0 1 44 16 L 44 28 Z" fill="#ef4444" stroke="#151a2c" strokeWidth={1.6} />
        </g>
      ) : category === 'capacitors' ? (
        <g>
          {mode === 'ASTABLE' ? (
            <>
              <circle cx={22} cy={16} r={6} fill="#ef4444" stroke="#151a2c" strokeWidth={1.4} />
              <circle cx={46} cy={16} r={6} fill="#22c55e" stroke="#151a2c" strokeWidth={1.4} />
              <rect x={28} y={22} width={12} height={14} rx={2} fill="#2563eb" stroke="#151a2c" strokeWidth={1.4} />
            </>
          ) : (
            <>
              <line x1={30} y1={28} x2={30} y2={40} stroke="#64748b" strokeWidth={2} />
              <line x1={38} y1={28} x2={38} y2={40} stroke="#64748b" strokeWidth={2} />
              <rect x={23} y={10} width={22} height={20} rx={3} fill="#2563eb" stroke="#151a2c" strokeWidth={1.6} />
              <ellipse cx={34} cy={12} rx={9} ry={3} fill="#cbd5e1" />
            </>
          )}
        </g>
      ) : category === 'transistors' ? (
        <g>
          <line x1={27} y1={26} x2={27} y2={40} stroke="#64748b" strokeWidth={1.8} />
          <line x1={34} y1={26} x2={34} y2={40} stroke="#64748b" strokeWidth={1.8} />
          <line x1={41} y1={26} x2={41} y2={40} stroke="#64748b" strokeWidth={1.8} />
          <rect x={22} y={11} width={24} height={16} rx={3} fill="#1e293b" stroke="#151a2c" strokeWidth={1.6} />
          <text x={34} y={22} fontSize={7} fill="#fff" textAnchor="middle" fontWeight={700}>
            NPN
          </text>
        </g>
      ) : category === 'sensors' ? (
        <g>
          <line x1={30} y1={26} x2={30} y2={40} stroke="#64748b" strokeWidth={2} />
          <line x1={38} y1={26} x2={38} y2={40} stroke="#64748b" strokeWidth={2} />
          <ellipse cx={34} cy={18} rx={12} ry={8} fill="#fde68a" stroke="#151a2c" strokeWidth={1.6} />
          <path d="M 27 16 L 41 16 L 27 20 L 41 20" fill="none" stroke="#dc2626" strokeWidth={1.5} />
        </g>
      ) : category === 'protection' ? (
        <g>
          <line x1={8} y1={23} x2={60} y2={23} stroke="#7c2d12" strokeWidth={2.4} />
          <rect x={18} y={14} width={32} height={18} rx={4} fill="#e0f2fe" stroke="#151a2c" strokeWidth={1.6} />
          <rect x={18} y={14} width={7} height={18} fill="#cbd5e1" stroke="#151a2c" strokeWidth={1.2} />
          <rect x={43} y={14} width={7} height={18} fill="#cbd5e1" stroke="#151a2c" strokeWidth={1.2} />
          <path d="M 25 23 Q 30 18, 34 23 T 43 23" fill="none" stroke="#d97706" strokeWidth={2} />
        </g>
      ) : category === 'safety' ? (
        <g>
          <circle cx={34} cy={17} r={9} fill="#dcfce7" stroke="#16a34a" strokeWidth={1.8} />
          <line x1={34} y1={12} x2={34} y2={28} stroke="#16a34a" strokeWidth={2.2} />
          <line x1={22} y1={28} x2={46} y2={28} stroke="#16a34a" strokeWidth={2.4} />
          <line x1={26} y1={33} x2={42} y2={33} stroke="#16a34a" strokeWidth={2} />
          <line x1={30} y1={38} x2={38} y2={38} stroke="#16a34a" strokeWidth={1.8} />
        </g>
      ) : (
        <g>
          <rect x={14} y={24} width={26} height={12} rx={4} fill="#84cc16" stroke="#151a2c" strokeWidth={1.5} />
          <circle cx={48} cy={18} r={8} fill="#fde047" stroke="#151a2c" strokeWidth={1.5} />
          <line x1={40} y1={30} x2={48} y2={26} stroke="#dc2626" strokeWidth={2} />
        </g>
      )}
    </svg>
  );
};
