/**
 * Demo Sample Image Generator for ToolTrack Background Remover
 * Generates realistic high-resolution test images client-side without external dependencies.
 */

export type SampleType = 'alpha' | 'resolution' | 'refine';

export interface SampleMeta {
  type: SampleType;
  title: string;
  category: string;
  fileName: string;
  description: string;
}

export const SAMPLES_INFO: Record<SampleType, SampleMeta> = {
  alpha: {
    type: 'alpha',
    title: 'Genuine Alpha Channel',
    category: 'Portrait & Hair',
    fileName: 'sample-portrait-alpha.png',
    description: 'Fine hair strands and soft edges against a colored background.',
  },
  resolution: {
    type: 'resolution',
    title: 'Original Resolution',
    category: 'E-commerce Product',
    fileName: 'sample-product-resolution.png',
    description: 'Crisp product contours, shadows, and reflective highlights.',
  },
  refine: {
    type: 'refine',
    title: 'Manual Refinement',
    category: 'Complex Object & Pet',
    fileName: 'sample-complex-subject.png',
    description: 'Intricate geometry, fine whiskers/petals, and multi-color boundaries.',
  },
};

/**
 * Generates a high-resolution PNG File representing the chosen sample category
 */
export async function generateSampleFile(type: SampleType): Promise<File> {
  const meta = SAMPLES_INFO[type];
  const width = 800;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  if (type === 'alpha') {
    // Studio Portrait with hair strands
    // 1. Studio backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#f97316');
    bgGrad.addColorStop(0.5, '#ea580c');
    bgGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle background bokeh
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(650, 180, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(150, 600, 100, 0, Math.PI * 2);
    ctx.fill();

    // 2. Portrait Silhouette / Subject
    // Torso / Shoulders
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(400, 750, 260, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // Collar / shirt detail
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(350, 600);
    ctx.lineTo(400, 700);
    ctx.lineTo(450, 600);
    ctx.closePath();
    ctx.fill();

    // Neck
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.roundRect(355, 460, 90, 150, 20);
    ctx.fill();

    // Head / Face
    ctx.fillStyle = '#fce7f3';
    ctx.beginPath();
    ctx.ellipse(400, 380, 120, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair mass
    ctx.fillStyle = '#331800';
    ctx.beginPath();
    ctx.arc(400, 320, 150, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // Hair strands & fine curls
    ctx.strokeStyle = '#220e00';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let angle = Math.PI * 0.7; angle <= Math.PI * 2.3; angle += 0.06) {
      const r = 145 + Math.sin(angle * 12) * 15;
      const x1 = 400 + Math.cos(angle) * r;
      const y1 = 330 + Math.sin(angle) * r;
      const x2 = 400 + Math.cos(angle) * (r + 35);
      const y2 = 330 + Math.sin(angle) * (r + 35);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(x1 + 10, y1 + 10, x2, y2);
      ctx.stroke();
    }

    // Glasses / facial features
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.strokeRect(320, 360, 65, 40);
    ctx.strokeRect(415, 360, 65, 40);
    ctx.beginPath();
    ctx.moveTo(385, 380);
    ctx.lineTo(415, 380);
    ctx.stroke();

    // Smile
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(400, 440, 30, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else if (type === 'resolution') {
    // High-Resolution E-commerce Product (Modern Sneaker / Watch)
    // Clean studio floor & gradient wall
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 520);
    wallGrad.addColorStop(0, '#e2e8f0');
    wallGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, 520);

    const floorGrad = ctx.createLinearGradient(0, 520, 0, height);
    floorGrad.addColorStop(0, '#94a3b8');
    floorGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 520, width, height - 520);

    // Studio shadow underneath product
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(400, 560, 260, 35, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Sneaker Sole (White rubber)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(180, 530);
    ctx.quadraticCurveTo(240, 565, 420, 550);
    ctx.quadraticCurveTo(580, 545, 620, 480);
    ctx.quadraticCurveTo(600, 470, 540, 490);
    ctx.quadraticCurveTo(400, 500, 240, 500);
    ctx.quadraticCurveTo(180, 500, 180, 530);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Midsole air cushion window
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(240, 515, 120, 20, 8);
    ctx.fill();

    // Sneaker Upper body (Vibrant Indigo / Crimson)
    const upperGrad = ctx.createLinearGradient(200, 350, 600, 500);
    upperGrad.addColorStop(0, '#4f46e5');
    upperGrad.addColorStop(0.6, '#6366f1');
    upperGrad.addColorStop(1, '#e11d48');
    ctx.fillStyle = upperGrad;
    ctx.beginPath();
    ctx.moveTo(220, 500);
    ctx.quadraticCurveTo(200, 440, 240, 380);
    ctx.quadraticCurveTo(280, 340, 340, 340);
    ctx.quadraticCurveTo(400, 380, 460, 410);
    ctx.quadraticCurveTo(560, 430, 600, 475);
    ctx.quadraticCurveTo(520, 495, 220, 500);
    ctx.closePath();
    ctx.fill();

    // Distinct Brand Swoosh / Stripe
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(270, 440);
    ctx.quadraticCurveTo(360, 410, 500, 450);
    ctx.quadraticCurveTo(430, 470, 330, 470);
    ctx.closePath();
    ctx.fill();

    // Shoe Laces & Eyelets
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const lx = 320 + i * 28;
      const ly = 370 + i * 14;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + 20, ly + 18);
      ctx.stroke();

      // Eyelet rings
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.arc(lx + 20, ly + 18, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Complex Subject: Exotic Wildlife / Tropical Bird with fine feather details
    // Textured jungle / outdoor background
    const natureGrad = ctx.createRadialGradient(400, 400, 100, 400, 400, 500);
    natureGrad.addColorStop(0, '#064e3b');
    natureGrad.addColorStop(0.6, '#047857');
    natureGrad.addColorStop(1, '#065f46');
    ctx.fillStyle = natureGrad;
    ctx.fillRect(0, 0, width, height);

    // Leaves in background
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.beginPath();
    ctx.ellipse(150, 200, 80, 160, 0.4, 0, Math.PI * 2);
    ctx.ellipse(650, 650, 90, 180, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Perch branch
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(120, 620);
    ctx.quadraticCurveTo(400, 600, 720, 640);
    ctx.stroke();

    // Bird Body (Macaw / Parrot)
    const birdGrad = ctx.createLinearGradient(350, 250, 500, 600);
    birdGrad.addColorStop(0, '#dc2626');
    birdGrad.addColorStop(0.4, '#f59e0b');
    birdGrad.addColorStop(0.8, '#10b981');
    birdGrad.addColorStop(1, '#2563eb');
    ctx.fillStyle = birdGrad;

    ctx.beginPath();
    ctx.ellipse(400, 440, 90, 170, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Wing with layered feather tips
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(430, 460, 60, 130, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Fine feather edges
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    for (let f = 0; f < 18; f++) {
      const fy = 420 + f * 10;
      const fx = 450 + Math.sin(f * 0.4) * 20;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + 25, fy + 8);
      ctx.stroke();
    }

    // Bird Head & Crest
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(360, 270, 65, 0, Math.PI * 2);
    ctx.fill();

    // Head Crest Feathers
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 3;
    for (let c = -3; c <= 3; c++) {
      ctx.beginPath();
      ctx.moveTo(350 + c * 8, 220);
      ctx.quadraticCurveTo(340 + c * 15, 170, 330 + c * 18, 150);
      ctx.stroke();
    }

    // Curved Beak
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(310, 260);
    ctx.quadraticCurveTo(240, 280, 270, 320);
    ctx.lineTo(315, 290);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(340, 260, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(338, 260, 6, 0, Math.PI * 2);
    ctx.fill();

    // Long Tail Feathers
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(420, 580);
    ctx.quadraticCurveTo(460, 680, 480, 770);
    ctx.stroke();

    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(410, 590);
    ctx.quadraticCurveTo(440, 690, 450, 760);
    ctx.stroke();
  }

  // Convert to Blob and File
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
  });

  return new File([blob], meta.fileName, { type: 'image/png' });
}
