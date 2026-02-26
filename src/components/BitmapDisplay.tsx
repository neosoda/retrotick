import { useState, useEffect } from 'preact/hooks';
import type { BitmapResult } from '../lib/pe';
import { dibToTransparentBlob } from '../lib/image';
import { ResourceCard } from './ResourceCard';

interface BitmapDisplayProps {
  bitmaps: BitmapResult[];
  createUrl: (blob: Blob) => string;
}

function BitmapCard({ bmp, createUrl }: { bmp: BitmapResult; createUrl: (b: Blob) => string }) {
  const [src, setSrc] = useState<string | null>(null);
  const idText = bmp.name ? `"${bmp.name}"` : `#${bmp.id}`;

  useEffect(() => {
    if (bmp.magentaIndex >= 0 && bmp.dibData) {
      dibToTransparentBlob(bmp.dibData).then(pngBlob => {
        setSrc(createUrl(pngBlob || bmp.bmpBlob));
      });
    } else {
      setSrc(createUrl(bmp.bmpBlob));
    }
  }, [bmp, createUrl]);

  return (
    <ResourceCard label={`${idText}  ${bmp.width}\u00d7${bmp.height}  ${bmp.bitCount}bpp`}>
      {src && (
        <img
          src={src}
          alt={`Bitmap ${idText}`}
          class="block mx-auto mb-1.5"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
    </ResourceCard>
  );
}

export function BitmapDisplay({ bitmaps, createUrl }: BitmapDisplayProps) {
  return (
    <>
      {bitmaps.map((bmp, i) => (
        <BitmapCard key={i} bmp={bmp} createUrl={createUrl} />
      ))}
    </>
  );
}
