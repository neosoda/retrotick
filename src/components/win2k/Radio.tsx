import type { ComponentChildren } from 'preact';
import { disabledTextStyle } from './styles';

interface RadioProps {
  children: ComponentChildren;
  fontCSS: string;
  checked?: boolean;
  disabled?: boolean;
}

export function Radio({ children, fontCSS, checked, disabled }: RadioProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', cursor: 'var(--win2k-cursor)' }}>
      <input
        type="radio"
        checked={checked}
        readOnly
        style={{ margin: '0 4px 0 0', flexShrink: 0, pointerEvents: 'none' }}
      />
      <span style={{ font: fontCSS, ...(disabled ? disabledTextStyle : {}) }}>{children}</span>
    </div>
  );
}
