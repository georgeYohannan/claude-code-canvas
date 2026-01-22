'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { Tool, ShapeType } from '@/types/canvas';

const tools: { id: Tool; label: string; icon: string; shortcut: string }[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { id: 'draw', label: 'Draw', icon: '✏️', shortcut: 'B' },
  { id: 'eraser', label: 'Eraser', icon: '🧹', shortcut: 'E' },
  { id: 'shape', label: 'Shape', icon: '□', shortcut: 'S' },
  { id: 'text', label: 'Text', icon: 'T', shortcut: 'T' },
  { id: 'image', label: 'Image', icon: '🖼', shortcut: 'I' },
  { id: 'pan', label: 'Pan', icon: '✋', shortcut: 'H' },
];

const shapes: { id: ShapeType; label: string; icon: string }[] = [
  // Basic shapes
  { id: 'rect', label: 'Rectangle', icon: '▢' },
  { id: 'roundedRect', label: 'Rounded Rect', icon: '▢' },
  { id: 'circle', label: 'Circle', icon: '○' },
  { id: 'triangle', label: 'Triangle', icon: '△' },
  { id: 'diamond', label: 'Diamond', icon: '◇' },
  { id: 'pentagon', label: 'Pentagon', icon: '⬠' },
  { id: 'hexagon', label: 'Hexagon', icon: '⬡' },
  { id: 'star', label: 'Star', icon: '☆' },
  // Flowchart shapes
  { id: 'parallelogram', label: 'Parallelogram', icon: '▱' },
  { id: 'cylinder', label: 'Database', icon: '⌭' },
  { id: 'document', label: 'Document', icon: '📄' },
  { id: 'cloud', label: 'Cloud', icon: '☁' },
  { id: 'callout', label: 'Callout', icon: '💬' },
  // Lines & symbols
  { id: 'line', label: 'Line', icon: '/' },
  { id: 'arrow', label: 'Arrow', icon: '→' },
  { id: 'plus', label: 'Plus', icon: '+' },
  { id: 'cross', label: 'Cross', icon: '✕' },
];

const colors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
  '#0080ff', '#00ff80', '#ff0080', '#80ff00', '#808080',
];

interface ToolbarProps {
  onSaveToCloud?: () => void;
  onLoadFromCloud?: () => void;
}

export default function Toolbar({ onSaveToCloud, onLoadFromCloud }: ToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const {
    activeTool,
    activeColor,
    activeShapeType,
    strokeWidth,
    fontSize,
    viewport,
    selectedElementId,
    elements,
    gridSettings,
    setActiveTool,
    setActiveColor,
    setActiveShapeType,
    setStrokeWidth,
    setFontSize,
    setViewport,
    clearCanvas,
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    // Clipboard
    copy,
    paste,
    duplicate,
    // Z-order
    bringToFront,
    sendToBack,
    // Lock
    toggleLock,
    // Grid
    setGridSettings,
    // Zoom
    zoomIn,
    zoomOut,
    // Delete
    deleteElement,
  } = useCanvasStore();

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  const handleImageClick = () => {
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) input.click();
  };

  const resetView = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2 max-h-[90vh] overflow-y-auto">
      {/* History controls */}
      <div className="flex gap-1">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={`flex-1 py-1 text-xs rounded transition-colors ${
            canUndo() ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={`flex-1 py-1 text-xs rounded transition-colors ${
            canRedo() ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪
        </button>
      </div>

      <hr className="border-gray-200" />

      {/* Tools */}
      <div className="flex flex-col gap-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              if (tool.id === 'image') {
                handleImageClick();
              }
              setActiveTool(tool.id);
            }}
            className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
              activeTool === tool.id
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <span className="text-lg">{tool.icon}</span>
          </button>
        ))}
      </div>

      <hr className="border-gray-200" />

      {/* Shape selector (only when shape tool is active) */}
      {activeTool === 'shape' && (
        <>
          <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => setActiveShapeType(shape.id)}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
                  activeShapeType === shape.id
                    ? 'bg-green-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                title={shape.label}
              >
                {shape.icon}
              </button>
            ))}
          </div>
          <hr className="border-gray-200" />
        </>
      )}

      {/* Color palette */}
      <div className="grid grid-cols-3 gap-1">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => setActiveColor(color)}
            className={`w-6 h-6 rounded border-2 transition-transform ${
              activeColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom color picker */}
      <input
        type="color"
        value={activeColor}
        onChange={(e) => setActiveColor(e.target.value)}
        className="w-full h-8 cursor-pointer rounded"
        title="Custom color"
      />

      <hr className="border-gray-200" />

      {/* Stroke width */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 text-center">Stroke</label>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-center text-gray-600">{strokeWidth}px</span>
      </div>

      {/* Font size (only when text tool is active) */}
      {activeTool === 'text' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 text-center">Font Size</label>
          <input
            type="range"
            min="8"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
          <span className="text-xs text-center text-gray-600">{fontSize}px</span>
        </div>
      )}

      <hr className="border-gray-200" />

      {/* Zoom controls */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 text-center">Zoom</label>
        <div className="flex gap-1">
          <button
            onClick={zoomOut}
            className="flex-1 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            title="Zoom Out (Ctrl+-)"
          >
            −
          </button>
          <span className="flex-1 text-xs text-center py-1">{Math.round(viewport.zoom * 100)}%</span>
          <button
            onClick={zoomIn}
            className="flex-1 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            title="Zoom In (Ctrl++)"
          >
            +
          </button>
        </div>
      </div>

      {/* Grid snap toggle */}
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={gridSettings.snap}
          onChange={(e) => setGridSettings({ snap: e.target.checked })}
          className="rounded"
        />
        <span>Snap to Grid</span>
      </label>

      <hr className="border-gray-200" />

      {/* Selection-based controls */}
      {selectedElementId && selectedElement && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 text-center">Selection</label>
            {/* Clipboard */}
            <div className="flex gap-1">
              <button
                onClick={copy}
                className="flex-1 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                title="Copy (Ctrl+C)"
              >
                Copy
              </button>
              <button
                onClick={duplicate}
                className="flex-1 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                title="Duplicate (Ctrl+D)"
              >
                Dup
              </button>
            </div>
            {/* Z-order */}
            <div className="flex gap-1">
              <button
                onClick={() => bringToFront(selectedElementId)}
                className="flex-1 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                title="Bring to Front"
              >
                ↑ Front
              </button>
              <button
                onClick={() => sendToBack(selectedElementId)}
                className="flex-1 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                title="Send to Back"
              >
                ↓ Back
              </button>
            </div>
            {/* Lock and Delete */}
            <div className="flex gap-1">
              <button
                onClick={() => toggleLock(selectedElementId)}
                className={`flex-1 py-1 text-xs rounded ${
                  selectedElement.locked
                    ? 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title="Lock/Unlock (Ctrl+L)"
              >
                {selectedElement.locked ? '🔒' : '🔓'}
              </button>
              <button
                onClick={() => deleteElement(selectedElementId)}
                disabled={selectedElement.locked}
                className={`flex-1 py-1 text-xs rounded ${
                  selectedElement.locked
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'bg-red-100 hover:bg-red-200 text-red-600'
                }`}
                title="Delete (Del)"
              >
                🗑
              </button>
            </div>
          </div>
          <hr className="border-gray-200" />
        </>
      )}

      {/* Paste button (always available if clipboard has content) */}
      <button
        onClick={paste}
        className="w-full py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        title="Paste (Ctrl+V)"
      >
        Paste
      </button>

      <hr className="border-gray-200" />

      {/* Cloud actions */}
      {(onSaveToCloud || onLoadFromCloud) && (
        <>
          <div className="flex flex-col gap-1">
            {onSaveToCloud && (
              <button
                onClick={onSaveToCloud}
                className="w-full py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-600 rounded transition-colors"
                title="Save to Cloud"
              >
                ☁ Save
              </button>
            )}
            {onLoadFromCloud && (
              <button
                onClick={onLoadFromCloud}
                className="w-full py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-600 rounded transition-colors"
                title="Load from Cloud"
              >
                ☁ Load
              </button>
            )}
          </div>
          <hr className="border-gray-200" />
        </>
      )}

      {/* Export menu */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="w-full py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
        >
          Export ▾
        </button>
        {showExportMenu && (
          <div className="absolute left-full ml-2 top-0 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1 min-w-[100px] z-50">
            <button
              onClick={() => {
                const canvas = document.querySelector('canvas');
                if (!canvas) return;
                const link = document.createElement('a');
                link.download = `canvas-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                setShowExportMenu(false);
              }}
              className="w-full py-1 px-2 text-xs text-left hover:bg-gray-100 rounded"
            >
              💾 Save PNG
            </button>
            <button
              onClick={() => {
                const canvas = document.querySelector('canvas');
                if (!canvas) return;
                const link = document.createElement('a');
                link.download = `canvas-${Date.now()}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.click();
                setShowExportMenu(false);
              }}
              className="w-full py-1 px-2 text-xs text-left hover:bg-gray-100 rounded"
            >
              💾 Save JPG
            </button>
          </div>
        )}
      </div>

      <button
        onClick={resetView}
        className="w-full py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        title="Reset View (Ctrl+0)"
      >
        Reset View
      </button>
      <button
        onClick={clearCanvas}
        className="w-full py-1 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors"
      >
        Clear All
      </button>
    </div>
  );
}
