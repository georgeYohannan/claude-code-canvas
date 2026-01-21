'use client';

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
  { id: 'rect', label: 'Rectangle', icon: '▢' },
  { id: 'circle', label: 'Circle', icon: '○' },
  { id: 'line', label: 'Line', icon: '/' },
  { id: 'triangle', label: 'Triangle', icon: '△' },
  { id: 'arrow', label: 'Arrow', icon: '→' },
  { id: 'star', label: 'Star', icon: '☆' },
];

const colors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
  '#0080ff', '#00ff80', '#ff0080', '#80ff00', '#808080',
];

export default function Toolbar() {
  const {
    activeTool,
    activeColor,
    activeShapeType,
    strokeWidth,
    fontSize,
    setActiveTool,
    setActiveColor,
    setActiveShapeType,
    setStrokeWidth,
    setFontSize,
    clearCanvas,
    setViewport,
  } = useCanvasStore();

  const handleImageClick = () => {
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) input.click();
  };

  const resetView = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2">
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
          <div className="flex flex-col gap-1">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => setActiveShapeType(shape.id)}
                className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
                  activeShapeType === shape.id
                    ? 'bg-green-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                title={shape.label}
              >
                <span className="text-lg">{shape.icon}</span>
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

      {/* Actions */}
      <button
        onClick={() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = `canvas-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }}
        className="w-full py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
        title="Save as PNG"
      >
        Save Image
      </button>
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
