/**
 * Background Removal Web Worker
 * Persistent, pre-warmed worker for real-time background removal
 * Offloads AI segmentation & IndexedDB persistent weight caching off the main UI thread.
 */
import { removeBackground, preload } from '@imgly/background-removal';
import { getWeight, setWeight } from '../lib/indexedDbCache';

let hadCacheMiss = false;
let isWarmedUp = false;

// Custom fetcher that leverages IndexedDB for persistent caching of model weights
const customFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  try {
    const cachedBlob = await getWeight(url);
    if (cachedBlob) {
      self.postMessage({ type: 'CACHE_HIT', url });
      return new Response(cachedBlob);
    }

    // Cache miss: model weight needs to be fetched from network & cached
    hadCacheMiss = true;
    self.postMessage({ type: 'CACHE_MISS', url });

    const response = await fetch(url, init);
    const fetchedBlob = await response.blob();
    await setWeight(url, fetchedBlob);
    return new Response(fetchedBlob);
  } catch (e) {
    // Graceful fallback to standard network fetch
    return fetch(url, init);
  }
};

self.onmessage = async (e) => {
  // Handle background warm-up
  if (e.data.type === 'WARMUP') {
    if (isWarmedUp) return;
    try {
      const warmupConfig = {
        model: e.data.model || 'medium',
        device: 'gpu' as const,
        fetch: customFetch,
      };
      await preload(warmupConfig);
      isWarmedUp = true;
      self.postMessage({ type: 'WARMED_UP' });
    } catch {
      // Pre-warm is opportunistic and will run on first demand
    }
    return;
  }

  const { imageSource, config } = e.data;
  hadCacheMiss = false;

  try {
    const modelToUse = config?.model || 'medium';
    const enhancedConfig = {
      model: modelToUse,
      device: (config?.device || 'gpu') as 'gpu' | 'cpu',
      fetch: customFetch,
      progress: (key: string, current: number, total: number) => {
        const pct = total > 0 ? current / total : 0;
        self.postMessage({
          type: 'PROGRESS',
          progress: 0.2 + pct * 0.7,
          stage: hadCacheMiss ? 'Initializing AI engine...' : 'Segmenting subject...',
          hadCacheMiss,
        });
      },
    };

    const blob = await removeBackground(imageSource, enhancedConfig);
    isWarmedUp = true;

    self.postMessage({
      type: 'SUCCESS',
      blob,
      isCacheHit: !hadCacheMiss,
    });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: (error as Error).message });
  }
};
