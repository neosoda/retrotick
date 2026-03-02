import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { disabledTextStyle, xpTheme } from './styles';

interface ButtonProps {
  children: ComponentChildren;
  fontCSS: string;
  isDefault?: boolean;
  disabled?: boolean;
  fontColor?: string | null;
}

export function Button({ children, fontCSS, isDefault, disabled, fontColor }: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const active = pressed && !disabled;
  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%',
        height: '100%',
        background: active ? xpTheme.button.activeBg : xpTheme.button.background,
        cursor: 'var(--win2k-cursor)',
        border: `1px solid ${isDefault ? xpTheme.button.defaultBorder : xpTheme.button.border}`,
        boxShadow: active
          ? `inset 1px 1px 0 ${xpTheme.button.shadow}`
          : `inset 1px 1px 0 ${xpTheme.button.highlight}, inset -1px -1px 0 ${xpTheme.button.shadow}`,
        font: fontCSS, padding: 0,
        ...(disabled ? disabledTextStyle : fontColor ? { color: fontColor } : {}),
      }}>
      <span style={active ? { position: 'relative', left: '1px', top: '1px' } : undefined}>
        {children}
      </span>
    </button>
  );
}
