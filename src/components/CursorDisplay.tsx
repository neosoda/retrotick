import type { CursorResult } from '../lib/pe';
import { ResourceCard } from './ResourceCard';

interface CursorDisplayProps {
  cursors: CursorResult[];
  createUrl: (blob: Blob) => string;
}

export function CursorDisplay({ cursors, createUrl }: CursorDisplayProps) {
  return (
    <>
      {cursors.map((cursor, i) => {
        const url = createUrl(cursor.blob);
        const idText = cursor.name ? `"${cursor.name}"` : `#${cursor.id}`;
        const sizes = cursor.variants
          .map(v => `${v.width}\u00d7${v.height} hotspot(${v.hotspotX},${v.hotspotY})`)
          .join(', ');
        return (
          <ResourceCard key={i} label={`${idText}  ${sizes}`}>
            <img
              src={url}
              alt={`Cursor ${idText}`}
              class="block mx-auto mb-1.5"
              style={{ imageRendering: 'pixelated' }}
            />
          </ResourceCard>
        );
      })}
    </>
  );
}
