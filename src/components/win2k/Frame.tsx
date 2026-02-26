import type { ComponentChildren } from 'preact';
import { Window, WS_CAPTION, WS_SYSMENU, WS_MINIMIZEBOX, WS_MAXIMIZEBOX } from './Window';

interface FrameProps {
  title: string;
  clientW: number;
  clientH: number;
  fontCSS: string;
  bgColor?: string | null;
  hasCaption?: boolean;
  hasSysMenu?: boolean;
  hasMin?: boolean;
  hasMax?: boolean;
  hasHelp?: boolean;
  menuBarItems?: { content: ComponentChildren }[] | null;
  iconUrl?: string | null;
  children?: ComponentChildren;
}

export function Frame({
  title, clientW, clientH, fontCSS, bgColor,
  hasCaption, hasSysMenu, hasMin, hasMax, hasHelp,
  menuBarItems, iconUrl, children,
}: FrameProps) {
  let style = 0;
  if (hasCaption) style |= WS_CAPTION;
  if (hasSysMenu) style |= WS_SYSMENU;
  if (hasMin) style |= WS_MINIMIZEBOX;
  if (hasMax) style |= WS_MAXIMIZEBOX;
  // Frame always uses dialog-style border (WS_DLGFRAME is part of WS_CAPTION)

  const menuBar = menuBarItems ? (
    <div style={{
      display: 'flex', background: '#D4D0C8', padding: '1px', borderBottom: '1px solid #808080',
    }}>
      {menuBarItems.map((mi, i) => (
        <div key={i} style={{
          padding: '2px 6px', cursor: 'var(--win2k-cursor)', whiteSpace: 'nowrap', font: '12px/1 "Tahoma",sans-serif',
        }}>
          {mi.content}
        </div>
      ))}
    </div>
  ) : undefined;

  return (
    <div style={{ display: 'inline-block', font: fontCSS, color: '#000' }}>
      <Window
        title={title}
        style={style}
        clientW={clientW}
        clientH={clientH}
        iconUrl={hasSysMenu ? iconUrl : undefined}
        focused={true}
        hasHelp={hasHelp}
        menus={menuBar}
      >
        <div style={{
          width: '100%', height: '100%',
          font: fontCSS,
          ...(bgColor ? { background: bgColor } : {}),
        }}>
          {children}
        </div>
      </Window>
    </div>
  );
}
