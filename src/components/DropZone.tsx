import { useState, useRef } from 'preact/hooks';
import clsx from 'clsx';

interface DropZoneProps {
  onFile: (file: File) => void;
}

export function DropZone({ onFile }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        class={clsx(
          'border-3 border-dashed rounded-xl p-12 text-center text-lg cursor-pointer transition-colors mb-4',
          dragOver
            ? 'border-blue-400 bg-blue-50 text-blue-400'
            : 'border-gray-300 text-gray-400 hover:border-gray-400',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer?.files[0];
          if (file) onFile(file);
        }}
        onClick={() => inputRef.current?.click()}
      >
        Drop an .exe or .dll file here, or click to select
      </div>
      <input
        ref={inputRef}
        type="file"
        class="hidden"
        accept=".exe,.dll,.ocx,.scr,.cpl,.drv,.sys"
        onChange={() => {
          const file = inputRef.current?.files?.[0];
          if (file) onFile(file);
        }}
      />
    </>
  );
}
