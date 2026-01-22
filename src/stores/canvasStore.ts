import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CanvasStore, CanvasElement, Tool, ShapeType, Viewport, GridSettings } from '@/types/canvas';

const MAX_HISTORY = 50;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

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
  // History
  history: [] as { elements: CanvasElement[]; timestamp: number }[],
  historyIndex: -1,
  // Clipboard
  clipboard: null as { elements: CanvasElement[]; copiedAt: number } | null,
  // Grid
  gridSettings: { enabled: true, size: 50, snap: false } as GridSettings,
};

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Push current state to history (call before mutations)
      pushHistory: () => {
        const { elements, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({
          elements: deepClone(elements),
          timestamp: Date.now(),
        });
        // Limit history size
        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      addElement: (element: CanvasElement) => {
        get().pushHistory();
        set((state) => ({
          elements: [...state.elements, element],
        }));
      },

      updateElement: (id: string, updates: Partial<CanvasElement>) => {
        const element = get().elements.find((el) => el.id === id);
        if (element?.locked) return; // Don't update locked elements
        get().pushHistory();
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, ...updates } : el
          ) as CanvasElement[],
        }));
      },

      deleteElement: (id: string) => {
        const element = get().elements.find((el) => el.id === id);
        if (element?.locked) return; // Don't delete locked elements
        get().pushHistory();
        set((state) => ({
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        }));
      },

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

      clearCanvas: () => {
        get().pushHistory();
        set({ elements: [], selectedElementId: null });
      },

      // History actions
      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const previousState = history[historyIndex - 1];
          set({
            elements: deepClone(previousState.elements),
            historyIndex: historyIndex - 1,
            selectedElementId: null,
          });
        } else if (historyIndex === 0) {
          // Undo to initial empty state
          set({
            elements: [],
            historyIndex: -1,
            selectedElementId: null,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          set({
            elements: deepClone(nextState.elements),
            historyIndex: historyIndex + 1,
            selectedElementId: null,
          });
        }
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex >= 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      // Clipboard actions
      copy: () => {
        const { selectedElementId, elements } = get();
        if (!selectedElementId) return;
        const element = elements.find((el) => el.id === selectedElementId);
        if (element) {
          set({
            clipboard: {
              elements: [deepClone(element)],
              copiedAt: Date.now(),
            },
          });
        }
      },

      paste: () => {
        const { clipboard } = get();
        if (!clipboard || clipboard.elements.length === 0) return;
        get().pushHistory();
        const pastedElements = clipboard.elements.map((el) => ({
          ...deepClone(el),
          id: generateId(),
          x: el.x + 20,
          y: el.y + 20,
          locked: false, // Pasted elements are unlocked
        }));
        set((state) => ({
          elements: [...state.elements, ...pastedElements] as CanvasElement[],
          selectedElementId: pastedElements[0]?.id ?? null,
        }));
      },

      duplicate: () => {
        const { selectedElementId, elements } = get();
        if (!selectedElementId) return;
        const element = elements.find((el) => el.id === selectedElementId);
        if (!element) return;
        get().pushHistory();
        const duplicated = {
          ...deepClone(element),
          id: generateId(),
          x: element.x + 20,
          y: element.y + 20,
          locked: false,
        };
        set((state) => ({
          elements: [...state.elements, duplicated] as CanvasElement[],
          selectedElementId: duplicated.id,
        }));
      },

      // Z-order actions
      bringToFront: (id: string) => {
        get().pushHistory();
        set((state) => {
          const element = state.elements.find((el) => el.id === id);
          if (!element) return state;
          const others = state.elements.filter((el) => el.id !== id);
          return { elements: [...others, element] };
        });
      },

      sendToBack: (id: string) => {
        get().pushHistory();
        set((state) => {
          const element = state.elements.find((el) => el.id === id);
          if (!element) return state;
          const others = state.elements.filter((el) => el.id !== id);
          return { elements: [element, ...others] };
        });
      },

      bringForward: (id: string) => {
        get().pushHistory();
        set((state) => {
          const index = state.elements.findIndex((el) => el.id === id);
          if (index === -1 || index === state.elements.length - 1) return state;
          const newElements = [...state.elements];
          [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
          return { elements: newElements };
        });
      },

      sendBackward: (id: string) => {
        get().pushHistory();
        set((state) => {
          const index = state.elements.findIndex((el) => el.id === id);
          if (index <= 0) return state;
          const newElements = [...state.elements];
          [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
          return { elements: newElements };
        });
      },

      // Lock actions
      toggleLock: (id: string) => {
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id ? { ...el, locked: !el.locked } : el
          ) as CanvasElement[],
        }));
      },

      // Grid actions
      setGridSettings: (settings: Partial<GridSettings>) =>
        set((state) => ({
          gridSettings: { ...state.gridSettings, ...settings },
        })),

      snapToGrid: (value: number) => {
        const { gridSettings } = get();
        if (!gridSettings.snap) return value;
        return Math.round(value / gridSettings.size) * gridSettings.size;
      },

      // Zoom actions
      zoomIn: () => {
        set((state) => ({
          viewport: {
            ...state.viewport,
            zoom: Math.min(5, state.viewport.zoom * 1.2),
          },
        }));
      },

      zoomOut: () => {
        set((state) => ({
          viewport: {
            ...state.viewport,
            zoom: Math.max(0.1, state.viewport.zoom / 1.2),
          },
        }));
      },

      zoomTo: (level: number) => {
        set((state) => ({
          viewport: {
            ...state.viewport,
            zoom: Math.max(0.1, Math.min(5, level)),
          },
        }));
      },

      fitToScreen: () => {
        set({
          viewport: { x: 0, y: 0, zoom: 1 },
        });
      },

      // Data actions for n8n integration
      setElements: (elements: CanvasElement[]) => {
        get().pushHistory();
        set({ elements, selectedElementId: null });
      },

      getCanvasData: () => {
        const { elements, viewport } = get();
        return { elements: deepClone(elements), viewport: deepClone(viewport) };
      },

      loadCanvasData: (data: { elements: CanvasElement[]; viewport?: Viewport }) => {
        get().pushHistory();
        set({
          elements: data.elements,
          viewport: data.viewport ?? { x: 0, y: 0, zoom: 1 },
          selectedElementId: null,
          // Reset history when loading
          history: [],
          historyIndex: -1,
        });
      },
    }),
    {
      name: 'infinite-canvas-storage',
      partialize: (state) => ({
        elements: state.elements,
        viewport: state.viewport,
        activeColor: state.activeColor,
        strokeWidth: state.strokeWidth,
        fontSize: state.fontSize,
        gridSettings: state.gridSettings,
        // Don't persist history or clipboard (localStorage limits)
      }),
    }
  )
);
