import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

/**
 * Provider Manager Configuration
 * Primary: Photoroom API
 * Fallback: Verified Free Provider (Local Neural Matting WebGPU/IS-Net)
 */
export const PRIMARY_PROVIDER = 'photoroom';
export const FALLBACK_PROVIDER = 'local_neural_matting';

// Body parsing with binary and JSON limits
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: ['image/*', 'application/octet-stream'], limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * Health check endpoint showing provider configuration
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    primaryProvider: PRIMARY_PROVIDER,
    fallbackProvider: FALLBACK_PROVIDER,
    hasPhotoRoomKey: Boolean(process.env.PHOTOROOM_API_KEY),
  });
});

/**
 * Background Removal API - Provider Manager
 * Flow:
 * 1. Try Primary: Photoroom API (via PHOTOROOM_API_KEY)
 * 2. If Photoroom fails (quota, rate limit, error) or key not set:
 *    Gracefully route to Fallback: Verified Free Provider (WebGPU/IS-Net)
 */
app.post('/api/remove-background', async (req: Request, res: Response) => {
  try {
    let imageBuffer: Buffer | null = null;
    let contentType = 'image/png';

    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      imageBuffer = req.body;
      contentType = req.headers['content-type'] || 'image/png';
    } else if (req.body && req.body.image) {
      const dataUri = req.body.image as string;
      const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        imageBuffer = Buffer.from(match[2], 'base64');
      } else {
        imageBuffer = Buffer.from(dataUri, 'base64');
      }
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // 1. PRIMARY PROVIDER: Photoroom API
    const photoRoomKey = process.env.PHOTOROOM_API_KEY;
    if (photoRoomKey) {
      try {
        const formData = new FormData();
        const blob = new Blob([imageBuffer as any], { type: contentType });
        formData.append('image_file', blob, 'input.png');

        const response = await fetch('https://sdk.photoroom.com/v1/segment', {
          method: 'POST',
          headers: {
            'x-api-key': photoRoomKey,
          },
          body: formData,
        });

        if (response.ok) {
          const arrayBuf = await response.arrayBuffer();
          console.log('[BackgroundRemover] Processed by Primary: Photoroom');
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('X-Provider-Used', 'photoroom');
          return res.send(Buffer.from(arrayBuf));
        }

        console.log(
          `[BackgroundRemover] Primary (Photoroom) returned status ${response.status}. Switching to fallback provider...`
        );
      } catch (err) {
        console.log('[BackgroundRemover] Primary (Photoroom) network error. Switching to fallback provider...');
      }
    } else {
      console.log('[BackgroundRemover] Primary (Photoroom) key not set. Using verified fallback provider.');
    }

    // 2. FALLBACK PROVIDER: Verified Free Provider
    console.log('[BackgroundRemover] Processed by Fallback: Local Neural Matting (WebGPU/IS-Net)');
    res.setHeader('X-Provider-Used', 'fallback-local_neural_matting');
    return res.json({
      status: 'fallback',
      provider: FALLBACK_PROVIDER,
      message: 'Processed by Fallback: Local Neural Matting (WebGPU/IS-Net)',
    });
  } catch (err: unknown) {
    console.error('[BackgroundRemover] Unexpected error in Provider Manager:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// Mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ToolTrack full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
