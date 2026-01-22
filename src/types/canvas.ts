export type Tool = 'select' | 'draw' | 'eraser' | 'shape' | 'text' | 'image' | 'pan';

export type ShapeType =
  | 'rect' | 'circle' | 'line' | 'triangle' | 'arrow' | 'star'
  // Visio-like shapes
  | 'diamond'           // Decision/rhombus
  | 'parallelogram'     // Data/input-output
  | 'hexagon'           // Preparation
  | 'pentagon'          // General shape
  | 'roundedRect'       // Rounded rectangle
  | 'cylinder'          // Database
  | 'document'          // Document with curved bottom
  | 'cloud'             // Cloud shape
  | 'callout'           // Speech bubble
  | 'plus'              // Plus sign
  | 'cross';            // X shape

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface BaseElement {
  id: string;
  x: number;
  y: number;
  color: string;
  strokeWidth: number;
  locked?: boolean;
}

// History for undo/redo
export interface HistoryEntry {
  elements: CanvasElement[];
  timestamp: number;
}

// Clipboard for copy/paste
export interface Clipboard {
  elements: CanvasElement[];
  copiedAt: number;
}

// Grid settings
export interface GridSettings {
  enabled: boolean;
  size: number;
  snap: boolean;
}

export interface DrawingElement extends BaseElement {
  type: 'drawing';
  points: Point[];
  isEraser?: boolean;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  width: number;
  height: number;
  endX?: number;
  endY?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  imageData: string;
  width: number;
  height: number;
}

export type CanvasElement = DrawingElement | ShapeElement | TextElement | ImageElement;

export interface CanvasState {
  elements: CanvasElement[];
  viewport: Viewport;
  activeTool: Tool;
  activeColor: string;
  activeShapeType: ShapeType;
  strokeWidth: number;
  fontSize: number;
  selectedElementId: string | null;
  isDrawing: boolean;
  currentElement: CanvasElement | null;
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  // Clipboard for copy/paste
  clipboard: Clipboard | null;
  // Grid settings
  gridSettings: GridSettings;
}

export interface CanvasActions {
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  setActiveTool: (tool: Tool) => void;
  setActiveColor: (color: string) => void;
  setActiveShapeType: (shapeType: ShapeType) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  setSelectedElementId: (id: string | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setCurrentElement: (element: CanvasElement | null) => void;
  clearCanvas: () => void;
  // History actions
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  // Clipboard actions
  copy: () => void;
  paste: () => void;
  duplicate: () => void;
  // Z-order actions
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  // Lock actions
  toggleLock: (id: string) => void;
  // Grid actions
  setGridSettings: (settings: Partial<GridSettings>) => void;
  snapToGrid: (value: number) => number;
  // Zoom actions
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (level: number) => void;
  fitToScreen: () => void;
  // Data actions for n8n integration
  setElements: (elements: CanvasElement[]) => void;
  getCanvasData: () => { elements: CanvasElement[]; viewport: Viewport };
  loadCanvasData: (data: { elements: CanvasElement[]; viewport?: Viewport }) => void;
}

export type CanvasStore = CanvasState & CanvasActions;
