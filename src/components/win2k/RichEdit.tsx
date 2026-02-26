import { useRef, useEffect } from 'preact/hooks';

interface RichEditProps {
  text?: string;
  fontCSS: string;
  fontColor?: string | null;
  readonly?: boolean;
  bgColor?: string | null;
  onTextChange?: (text: string) => void;
}

export function RichEdit({ text, fontCSS, fontColor, readonly, bgColor, onTextChange }: RichEditProps) {
  const bg = bgColor || '#FFF';
  const ref = useRef<HTMLDivElement>(null);
  const userEditing = useRef(false);

  useEffect(() => {
    if (ref.current && !userEditing.current) {
      ref.current.textContent = text || '';
    }
  }, [text]);

  const editable = !readonly && !!onTextChange;

  const onInput = editable ? () => {
    if (ref.current && onTextChange) {
      onTextChange(ref.current.textContent || '');
    }
  } : undefined;

  const onFocus = editable ? () => { userEditing.current = true; } : undefined;
  const onBlur = editable ? () => { userEditing.current = false; } : undefined;

  return (
    <div
      ref={ref}
      contentEditable={editable}
      onInput={onInput}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        width: '100%',
        height: '100%',
        background: bg,
        boxSizing: 'border-box',
        border: '1px solid',
        borderColor: '#808080 #FFF #FFF #808080',
        boxShadow: 'inset 1px 1px 0 #404040, inset -1px -1px 0 #D4D0C8',
        font: fontCSS,
        ...(fontColor ? { color: fontColor } : {}),
        padding: '1px 2px',
        outline: 'none',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    />
  );
}
