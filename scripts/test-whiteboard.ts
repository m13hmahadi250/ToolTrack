import { createDefaultBoard } from '../src/lib/whiteboardStorage';
import { calculateExportBounds } from '../src/lib/whiteboardExport';
import { WHITEBOARD_TEMPLATES } from '../src/lib/whiteboardTemplates';
import { resolveSeoRoute } from '../src/data/seoRegistry';
import { WhiteboardElement, WhiteboardBoard } from '../src/types/whiteboard';

async function runWhiteboardTests() {
  console.log('--- STARTING WHITEBOARD FUNCTIONAL AUDIT TESTS ---');

  // Test 1: SEO Routing
  const routeDirect = resolveSeoRoute('/whiteboard', '');
  const routeTools = resolveSeoRoute('/tools/whiteboard', '');
  if (routeDirect.type !== 'tool' || routeDirect.tool?.toolId !== 'whiteboard') {
    throw new Error('SEO route resolution failed for /whiteboard');
  }
  if (routeTools.type !== 'tool' || routeTools.tool?.toolId !== 'whiteboard') {
    throw new Error('SEO route resolution failed for /tools/whiteboard');
  }
  console.log('[PASS] Whiteboard SEO routing: /whiteboard and /tools/whiteboard verified.');

  // Test 2: Board Data Model Creation
  const board = createDefaultBoard('Test Chemistry Diagram');
  if (!board.id || !board.viewport || board.backgroundColor !== '#0f172a') {
    throw new Error('Default board creation failed');
  }
  console.log('[PASS] Board data model and default initialization passed.');

  // Test 3: Elements Creation (Drawing, Shapes, Text, Images, Sticky, Frames, Connectors)
  const elements: WhiteboardElement[] = [
    {
      id: 'el_pen_1',
      type: 'pen',
      x: 50,
      y: 50,
      width: 100,
      height: 80,
      strokeColor: '#38bdf8',
      strokeWidth: 4,
      opacity: 1,
      zIndex: 1,
      points: [
        { x: 50, y: 50, pressure: 0.5 },
        { x: 100, y: 80, pressure: 0.7 },
        { x: 150, y: 130, pressure: 0.8 },
      ],
    },
    {
      id: 'el_rect_1',
      type: 'rectangle',
      x: 200,
      y: 100,
      width: 180,
      height: 90,
      strokeColor: '#ffffff',
      strokeWidth: 2,
      fillColor: 'rgba(255,255,255,0.1)',
      opacity: 0.9,
      zIndex: 2,
    },
    {
      id: 'el_txt_1',
      type: 'text',
      x: 220,
      y: 120,
      width: 140,
      height: 30,
      strokeColor: '#f8fafc',
      strokeWidth: 1,
      opacity: 1,
      zIndex: 3,
      text: 'Chemical Reaction',
      fontSize: 18,
      bold: true,
    },
    {
      id: 'el_sticky_1',
      type: 'sticky',
      x: 450,
      y: 100,
      width: 160,
      height: 160,
      strokeColor: '#ca8a04',
      strokeWidth: 1,
      opacity: 1,
      zIndex: 4,
      stickyColor: '#fef08a',
      text: 'Note: Exothermic reaction\nRelease heat ΔH < 0',
    },
    {
      id: 'el_frame_1',
      type: 'frame',
      x: 20,
      y: 20,
      width: 700,
      height: 500,
      strokeColor: '#6366f1',
      strokeWidth: 2,
      opacity: 1,
      zIndex: 0,
      frameTitle: 'Frame 1: Thermodynamics',
    },
  ];

  board.elements = elements;
  board.frames = [{ id: 'f1', title: 'Frame 1: Thermodynamics', elementId: 'el_frame_1' }];

  // Test 4: Bounds calculation for Export
  const bounds = calculateExportBounds(board.elements, 20);
  if (bounds.width < 500 || bounds.height < 400) {
    throw new Error('Export bounds calculation incorrect');
  }
  console.log('[PASS] Export bounds calculated:', bounds);

  // Test 5: Templates Generation
  if (WHITEBOARD_TEMPLATES.length < 4) {
    throw new Error('Templates library missing expected templates');
  }
  for (const tpl of WHITEBOARD_TEMPLATES) {
    const tplBoard = tpl.createBoard();
    if (!tplBoard.id || !tplBoard.title) {
      throw new Error(`Template ${tpl.name} generated invalid board`);
    }
  }
  console.log(`[PASS] Templates verified (${WHITEBOARD_TEMPLATES.length} templates available).`);

  // Test 6: Board JSON serialization & restore
  const serialized = JSON.stringify(board);
  const restored: WhiteboardBoard = JSON.parse(serialized);
  if (restored.elements.length !== 5 || restored.frames?.length !== 1) {
    throw new Error('Board JSON serialization and restore corrupted element count');
  }
  console.log('[PASS] Board JSON serialization and restore passed.');

  console.log('--- ALL WHITEBOARD UNIT TESTS PASSED ---');
}

runWhiteboardTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
