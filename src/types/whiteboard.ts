export type WhiteboardTool =
  | 'select'
  | 'lasso'
  | 'hand'
  | 'pencil'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'double_arrow'
  | 'rectangle'
  | 'rounded_rectangle'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'polygon'
  | 'star'
  | 'text'
  | 'image'
  | 'sticky'
  | 'connector'
  | 'frame'
  | 'laser'
  | 'measure';

export type ElementType =
  | 'pencil'
  | 'pen'
  | 'highlighter'
  | 'line'
  | 'arrow'
  | 'double_arrow'
  | 'rectangle'
  | 'rounded_rectangle'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'polygon'
  | 'star'
  | 'text'
  | 'image'
  | 'sticky'
  | 'connector'
  | 'frame';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type GridType = 'none' | 'dot' | 'square' | 'ruled';
export type ConnectorType = 'straight' | 'elbow' | 'curved';
export type AnchorPoint = 'top' | 'right' | 'bottom' | 'left' | 'center';

export type PenStyle = 'ballpoint' | 'fountain' | 'marker' | 'pencil' | 'fine' | 'highlighter';
export type SmoothingMode = 'off' | 'low' | 'medium' | 'high' | 'natural' | 'smooth' | 'beautify';
export type PenCursorChoice = 'auto' | 'fountain' | 'ballpoint' | 'stylus' | 'pencil' | 'precision';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
  width?: number;
}

export interface ConnectorEndpoint {
  elementId?: string;
  anchor?: AnchorPoint;
  x: number;
  y: number;
}

export interface WhiteboardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // In degrees (0 - 360)
  strokeColor: string;
  strokeWidth: number;
  strokeStyle?: StrokeStyle;
  fillColor?: string; // 'transparent' or hex
  opacity: number; // 0 to 1
  zIndex: number;
  locked?: boolean;
  groupId?: string;

  // Freehand points (pencil, pen, highlighter)
  points?: Point[];
  penStyle?: PenStyle;
  smoothingMode?: SmoothingMode;
  beautify?: boolean;

  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  textBackground?: string;

  // Image specific
  imageUrl?: string;
  naturalWidth?: number;
  naturalHeight?: number;

  // Sticky Note specific
  stickyColor?: string;

  // Connector specific
  connectorStart?: ConnectorEndpoint;
  connectorEnd?: ConnectorEndpoint;
  connectorType?: ConnectorType;

  // Frame specific
  frameTitle?: string;

  // PDF Document Page specific
  pdfDocumentId?: string;
  pdfPageNumber?: number;
  pdfTotalPages?: number;
  pdfDocTitle?: string;
}

export interface WhiteboardPdfDocument {
  id: string;
  title: string;
  totalPages: number;
  pageElementIds: string[];
  createdAt: number;
}

export interface FrameItem {
  id: string;
  title: string;
  elementId: string;
}

export interface WhiteboardBoard {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  backgroundColor: string; // e.g. '#ffffff', '#0f172a', '#1e293b', '#f8fafc', '#fefce8'
  gridType: GridType;
  gridSnap: boolean;
  viewport: {
    x: number;
    y: number;
    zoom: number; // e.g. 1.0 = 100%
  };
  elements: WhiteboardElement[];
  frames?: FrameItem[];
  pdfDocuments?: WhiteboardPdfDocument[];
}

export interface LaserPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface MeasureLine {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'rot';
