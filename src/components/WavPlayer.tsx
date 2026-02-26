import type { WavResult } from '../lib/pe';
import { ResourceCard } from './ResourceCard';

interface WavPlayerProps {
  wavResources: WavResult[];
  createUrl: (blob: Blob) => string;
}

export function WavPlayer({ wavResources, createUrl }: WavPlayerProps) {
  return (
    <>
      {wavResources.map((wav, i) => {
        const url = createUrl(wav.blob);
        const idText = wav.name ? `"${wav.name}"` : `#${wav.id}`;
        return (
          <ResourceCard key={i} label={`WAV ${idText}`} textAlign="left">
            <audio src={url} controls style={{ display: 'block' }} />
          </ResourceCard>
        );
      })}
    </>
  );
}
