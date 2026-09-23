import { useState } from 'react';

/** Keep partial typing local; blank is an explicit clear and zero is a score. */
export function ExamScoreInput({ value, max, label, onSave }: {
  value: number | undefined;
  max: number;
  label: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  return <span>
    <input
      type="number" className="k-input" min={0} max={max} step="any" placeholder="-"
      aria-label={label} aria-invalid={Boolean(error)} title={error || `${label} (0–${max})`}
      value={editing ? draft : value ?? ''}
      onFocus={() => {
        if (!editing) setDraft(value == null ? '' : String(value));
        setEditing(true);
      }}
      onChange={(event) => { setDraft(event.target.value); setDirty(true); setError(''); }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          setDraft(value == null ? '' : String(value));
          setEditing(false); setDirty(false); setError('');
        }
      }}
      onBlur={(event) => {
        const number = Number(draft);
        if (dirty && (event.currentTarget.validity.badInput || (draft.trim() !== '' && (!Number.isFinite(number) || number < 0 || number > max)))) {
          setError(`กรอกคะแนน 0–${max}`);
          return;
        }
        if (dirty) onSave(draft.trim() === '' ? '' : String(number));
        setEditing(false); setDirty(false); setError('');
      }}
    />
    {error && <small role="alert" style={{ display: 'block', color: '#b91c1c' }}>{error}</small>}
  </span>;
}
