import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CanvasStore, CanvasElement, Tool, ShapeType, Viewport } from '@/types/canvas';

const initialState = {
  elements: [] as CanvasElement[],
  viewport: { x: 0, y: 0, zoom: 1 },
  activeTool: 'draw' as Tool,
  activeColor: '#000000',
  activeShapeType: 'rect' as ShapeType,
  strokeWidth: 2,
  fontSize: 16,
  selectedElementId: null as string | null,
  isDrawing: false,
  currentElement: null as CanvasElement | null,
};

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set) => ({
      ...initialState,

      addElement: (element: CanvasElement) =>
        set((state) => ({
          elements: [...state.elements, element],
        })),

      updateElement: (id: string, updates: Partial<CanvasElement>) =>
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el
          ) as CanvasElement[],
        })),

      deleteElement: (id: string) =>
        set((state) => ({
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        })),

      setActiveTool: (tool: Tool) =>
        set({ activeTool: tool, selectedElementId: null }),

      setActiveColor: (color: string) =>
        set({ activeColor: color }),

      setActiveShapeType: (shapeType: ShapeType) =>
        set({ activeShapeType: shapeType }),

      setStrokeWidth: (width: number) =>
        set({ strokeWidth: width }),

      setFontSize: (size: number) =>
        set({ fontSize: size }),

      setViewport: (viewport: Partial<Viewport>) =>
        set((state) => ({
          viewport: { ...state.viewport, ...viewport },
        })),

      setSelectedElementId: (id: string | null) =>
        set({ selectedElementId: id }),

      setIsDrawing: (isDrawing: boolean) =>
        set({ isDrawing }),

      setCurrentElement: (element: CanvasElement | null) =>
        set({ currentElement: element }),

      clearCanvas: () =>
        set({ elements: [], selectedElementId: null }),
    }),
    {
      name: 'infinite-canvas-storage',
      partialize: (state) => ({
        elements: state.elements,
        viewport: state.viewport,
        activeColor: state.activeColor,
        strokeWidth: state.strokeWidth,
        fontSize: state.fontSize,
      }),
    }
  )
);
