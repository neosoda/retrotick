import { useRef, useEffect } from 'preact/hooks';
import type { AviResult } from '../lib/pe';
import { parseAviFrames, renderAviFrame } from '../lib/avi';
import { ResourceCard } from './ResourceCard';

interface AviPlayerProps {
  aviResources: AviResult[];
}

function AviCard({ avi }: { avi: AviResult }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const parsed = parseAviFrames(avi.rawData);

  useEffect(() => {
    if (!parsed || parsed.frames.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let pixels = renderAviFrame(ctx, parsed.frames[0], parsed, null);
    let frameIdx = 0;
    const interval = Math.max(parsed.usPerFrame / 1000, 30);
    const timer = setInterval(() => {
      frameIdx = (frameIdx + 1) % parsed.frames.length;
      pixels = renderAviFrame(ctx, parsed.frames[frameIdx], parsed, pixels);
    }, interval);

    return () => clearInterval(timer);
  }, [parsed]);

  if (!parsed || parsed.frames.length === 0) return null;

  const idText = avi.name ? `"${avi.name}"` : `#${avi.id}`;
  const scale = parsed.width <= 64 ? 2 : 1;

  return (
    <ResourceCard
      label={`${idText}  ${parsed.width}\u00d7${parsed.height}  ${parsed.frames.length} frames  ${(1000000 / parsed.usPerFrame).toFixed(0)}fps`}
    >
      <canvas
        ref={canvasRef}
        width={parsed.width}
        height={parsed.height}
        style={{
          width: `${parsed.width * scale}px`,
          height: `${parsed.height * scale}px`,
          imageRendering: 'pixelated',
          display: 'block',
          margin: '0 auto',
        }}
      />
    </ResourceCard>
  );
}

export function AviPlayer({ aviResources }: AviPlayerProps) {
  return (
    <>
      {aviResources.map((avi, i) => (
        <AviCard key={i} avi={avi} />
      ))}
    </>
  );
}
