import { useRef, useCallback } from 'preact/hooks';

export function useBlobUrls() {
  const urls = useRef<string[]>([]);

  const createUrl = useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    urls.current.push(url);
    return url;
  }, []);

  const revokeAll = useCallback(() => {
    for (const u of urls.current) {
      URL.revokeObjectURL(u);
    }
    urls.current = [];
  }, []);

  return { createUrl, revokeAll };
}
