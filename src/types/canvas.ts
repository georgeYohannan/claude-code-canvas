export type Tool = 'select' | 'draw' | 'eraser' | 'shape' | 'text' | 'image' | 'pan';

export type ShapeType = 'rect' | 'circle' | 'line' | 'triangle' | 'arrow' | 'star';

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
}

export type CanvasStore = CanvasState & CanvasActions;
