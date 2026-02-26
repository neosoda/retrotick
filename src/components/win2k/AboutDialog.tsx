import { useState, useRef, useEffect } from 'preact/hooks';
import { useLayoutEffect } from 'preact/hooks';
import { Window, WS_CAPTION, WS_SYSMENU } from './Window';
import { Button } from './Button';

const FONT = '11px/1 "Tahoma","MS Sans Serif",sans-serif';

interface AboutDialogProps {
  caption: string;
  extraInfo: string;
  otherText: string;
  onDismiss: () => void;
  focused?: boolean;
  flashTrigger?: number;
  parentRef?: { current: HTMLDivElement | null };
}

export function AboutDialog({ caption, extraInfo, otherText, onDismiss, focused = true, flashTrigger, parentRef }: AboutDialogProps) {
  const [initialPos, setInitialPos] = useState<{ x: number; y: number } | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const r = measureRef.current.getBoundingClientRect();
    const p = parentRef?.current?.getBoundingClientRect();
    const cx = p ? p.left + p.width / 2 : window.innerWidth / 2;
    const cy = p ? p.top + p.height / 2 : window.innerHeight / 2;
    setInitialPos({ x: cx - r.width / 2, y: cy - r.height / 2 });
  }, []);

  useEffect(() => {
    if (initialPos) setVisible(true);
  }, [initialPos]);

  return (
    <div ref={measureRef} style={{ visibility: visible ? 'visible' : 'hidden', position: 'absolute', font: FONT }}>
      <Window title={`About ${caption}`} style={WS_CAPTION | WS_SYSMENU} focused={focused} flashTrigger={flashTrigger} draggable initialPos={initialPos} onClose={onDismiss}>
        <div style={{ background: '#D4D0C8', width: '340px' }}>
          {/* Header band — Windows 2000 style blue banner */}
          <div style={{
            background: 'linear-gradient(to right, #000080, #1084D0)',
            color: '#FFF', padding: '12px 14px', display: 'flex', alignItems: 'flex-end', gap: '10px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'Tahoma,sans-serif', letterSpacing: '0.5px' }}>
                {caption}
              </div>
              {extraInfo && <div style={{ fontSize: '11px', opacity: 0.9 }}>{extraInfo}</div>}
            </div>
          </div>
          {/* Body */}
          <div style={{ padding: '10px 14px 4px' }}>
            {otherText && (
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '6px', lineHeight: '1.4' }}>{otherText}</div>
            )}
            {/* System info line — Win2K style */}
            <div style={{ borderTop: '1px solid #808080', borderBottom: '1px solid #FFF', margin: '6px 0' }} />
            <div style={{ fontSize: '11px', color: '#444', lineHeight: '1.4' }}>
              {'deviceMemory' in navigator && `Physical memory available to Windows: ${(navigator as Navigator & { deviceMemory: number }).deviceMemory * 1024 * 1024} KB`}
            </div>
          </div>
          {/* OK button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 14px 10px' }}>
            <div style={{ width: '75px', height: '23px', cursor: 'var(--win2k-cursor)' }} onClick={onDismiss}>
              <Button fontCSS={FONT} isDefault>OK</Button>
            </div>
          </div>
        </div>
      </Window>
    </div>
  );
}

