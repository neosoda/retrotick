import type { IconResult } from '../lib/pe';
import { ResourceCard } from './ResourceCard';

interface IconDisplayProps {
  icons: IconResult[];
  createUrl: (blob: Blob) => string;
}

export function IconDisplay({ icons, createUrl }: IconDisplayProps) {
  return (
    <>
      {icons.map((icon, i) => {
        const url = createUrl(icon.blob);
        const idText = icon.name ? `"${icon.name}"` : `#${icon.id}`;
        const sizes = icon.variants.map(v => `${v.width}\u00d7${v.height}`).join(', ');
        return (
          <ResourceCard key={i} label={`${idText}  ${sizes}`}>
            <img
              src={url}
              alt={`Icon ${idText}`}
              class="block mx-auto mb-1.5"
              style={{ imageRendering: 'pixelated' }}
            />
          </ResourceCard>
        );
      })}
    </>
  );
}
