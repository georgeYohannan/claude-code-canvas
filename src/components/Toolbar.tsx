'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import ToolbarDropdown from './ToolbarDropdown';
import type { Tool, ShapeType } from '@/types/canvas';

const tools: { id: Tool; label: string; icon: string; shortcut: string }[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { id: 'draw', label: 'Draw', icon: '✏️', shortcut: 'B' },
  { id: 'eraser', label: 'Eraser', icon: '🧹', shortcut: 'E' },
  { id: 'shape', label: 'Shape', icon: '□', shortcut: 'S' },
  { id: 'connector', label: 'Connector', icon: '⟶', shortcut: 'C' },
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
  const {
    activeTool,
    activeColor,
    activeShapeType,
    strokeWidth,
    fontSize,
    viewport,
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
    // Multi-select
    selectedElementIds,
    updateElement,
  } = useCanvasStore();

  const selectedElement = selectedElementIds.length === 1
    ? elements.find((el) => el.id === selectedElementIds[0])
    : null;

  const hasSelection = selectedElementIds.length > 0;

  const handleImageClick = () => {
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) input.click();
  };

  const resetView = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  // Handle color change for selected elements
  const handleColorClick = (color: string) => {
    if (hasSelection) {
      // Update color of all selected elements
      selectedElementIds.forEach((id) => {
        updateElement(id, { color });
      });
    }
    setActiveColor(color);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg px-3 py-2 flex flex-row items-center gap-3 z-50">
      {/* History controls */}
      <div className="flex gap-1">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            canUndo() ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
            canRedo() ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↪
        </button>
      </div>

      <div className="w-px h-8 bg-gray-200" />

      {/* Tools */}
      <div className="flex gap-1">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              if (tool.id === 'image') {
                handleImageClick();
              }
              setActiveTool(tool.id);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              activeTool === tool.id
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <span className="text-sm">{tool.icon}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-8 bg-gray-200" />

      {/* Shapes dropdown */}
      <ToolbarDropdown
        trigger={
          <button
            className={`h-8 px-2 flex items-center gap-1 rounded transition-colors ${
              activeTool === 'shape' ? 'bg-green-100' : 'hover:bg-gray-100'
            }`}
            title="Shapes"
          >
            <span className="text-sm">{shapes.find(s => s.id === activeShapeType)?.icon || '□'}</span>
            <span className="text-xs">▾</span>
          </button>
        }
      >
        <div className="grid grid-cols-4 gap-1 min-w-[160px]">
          {shapes.map((shape) => (
            <button
              key={shape.id}
              onClick={() => {
                setActiveShapeType(shape.id);
                setActiveTool('shape');
              }}
              className={`w-9 h-9 flex items-center justify-center rounded text-lg transition-colors ${
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
      </ToolbarDropdown>

      <div className="w-px h-8 bg-gray-200" />

      {/* Colors dropdown */}
      <ToolbarDropdown
        trigger={
          <button
            className="w-8 h-8 rounded border-2 border-gray-300 transition-transform hover:scale-105"
            style={{ backgroundColor: activeColor }}
            title={hasSelection ? "Change selection color" : "Active color"}
          />
        }
      >
        <div className="flex flex-col gap-3 p-2">
          {hasSelection && (
            <div className="text-sm text-gray-600 text-center pb-2 border-b border-gray-200 font-medium">
              Click to change selection color
            </div>
          )}
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={`w-10 h-10 rounded-lg border-3 transition-all hover:scale-110 shadow-sm ${
                  activeColor === color ? 'border-blue-500 scale-110 ring-2 ring-blue-300' : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="pt-2 border-t border-gray-200">
            <label className="text-xs text-gray-500 block mb-1">Custom color</label>
            <input
              type="color"
              value={activeColor}
              onChange={(e) => handleColorClick(e.target.value)}
              className="w-full h-10 cursor-pointer rounded-lg border border-gray-300"
              title="Custom color"
            />
          </div>
        </div>
      </ToolbarDropdown>

      <div className="w-px h-8 bg-gray-200" />

      {/* Stroke width */}
      <ToolbarDropdown
        trigger={
          <button className="h-8 px-2 flex items-center gap-1 rounded hover:bg-gray-100" title="Stroke width">
            <div className="w-4 h-0.5 bg-current" style={{ height: Math.min(strokeWidth, 4) }} />
            <span className="text-xs">{strokeWidth}px</span>
          </button>
        }
      >
        <div className="flex flex-col gap-2 min-w-[120px]">
          <label className="text-xs text-gray-500 text-center">Stroke Width</label>
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
      </ToolbarDropdown>

      {/* Font size (only when text tool active) */}
      {activeTool === 'text' && (
        <ToolbarDropdown
          trigger={
            <button className="h-8 px-2 flex items-center gap-1 rounded hover:bg-gray-100" title="Font size">
              <span className="text-xs font-bold">A</span>
              <span className="text-xs">{fontSize}px</span>
            </button>
          }
        >
          <div className="flex flex-col gap-2 min-w-[120px]">
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
        </ToolbarDropdown>
      )}

      <div className="w-px h-8 bg-gray-200" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={zoomOut}
          className="w-6 h-6 flex items-center justify-center text-sm bg-gray-100 hover:bg-gray-200 rounded"
          title="Zoom Out (Ctrl+-)"
        >
          −
        </button>
        <span className="text-xs w-10 text-center">{Math.round(viewport.zoom * 100)}%</span>
        <button
          onClick={zoomIn}
          className="w-6 h-6 flex items-center justify-center text-sm bg-gray-100 hover:bg-gray-200 rounded"
          title="Zoom In (Ctrl++)"
        >
          +
        </button>
      </div>

      <div className="w-px h-8 bg-gray-200" />

      {/* Grid snap toggle */}
      <label className="flex items-center gap-1 text-xs cursor-pointer" title="Snap to Grid">
        <input
          type="checkbox"
          checked={gridSettings.snap}
          onChange={(e) => setGridSettings({ snap: e.target.checked })}
          className="rounded w-3 h-3"
        />
        <span>Grid</span>
      </label>

      <div className="w-px h-8 bg-gray-200" />

      {/* Selection controls */}
      {hasSelection && (
        <>
          <div className="flex gap-1">
            <button
              onClick={copy}
              className="w-7 h-7 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Copy (Ctrl+C)"
            >
              📋
            </button>
            <button
              onClick={duplicate}
              className="w-7 h-7 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Duplicate (Ctrl+D)"
            >
              ⊕
            </button>
            <button
              onClick={() => selectedElementIds.forEach(id => bringToFront(id))}
              className="w-7 h-7 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Bring to Front"
            >
              ↑
            </button>
            <button
              onClick={() => selectedElementIds.forEach(id => sendToBack(id))}
              className="w-7 h-7 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Send to Back"
            >
              ↓
            </button>
            {selectedElement && (
              <button
                onClick={() => toggleLock(selectedElement.id)}
                className={`w-7 h-7 flex items-center justify-center text-xs rounded ${
                  selectedElement.locked
                    ? 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title="Lock/Unlock (Ctrl+L)"
              >
                {selectedElement.locked ? '🔒' : '🔓'}
              </button>
            )}
            <button
              onClick={() => {
                selectedElementIds.forEach((id) => {
                  const el = elements.find(e => e.id === id);
                  if (el && !el.locked) deleteElement(id);
                });
              }}
              className="w-7 h-7 flex items-center justify-center text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded"
              title="Delete (Del)"
            >
              🗑
            </button>
          </div>
          <div className="w-px h-8 bg-gray-200" />
        </>
      )}

      {/* Paste button */}
      <button
        onClick={paste}
        className="w-7 h-7 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded"
        title="Paste (Ctrl+V)"
      >
        📥
      </button>

      <div className="w-px h-8 bg-gray-200" />

      {/* Cloud actions */}
      {(onSaveToCloud || onLoadFromCloud) && (
        <>
          <ToolbarDropdown
            trigger={
              <button className="h-8 px-2 flex items-center gap-1 rounded bg-purple-100 hover:bg-purple-200 text-purple-600" title="Cloud">
                <span>☁</span>
                <span className="text-xs">▾</span>
              </button>
            }
          >
            <div className="flex flex-col gap-1 min-w-[100px]">
              {onSaveToCloud && (
                <button
                  onClick={onSaveToCloud}
                  className="w-full py-1 px-2 text-xs text-left hover:bg-gray-100 rounded"
                >
                  ☁ Save to Cloud
                </button>
              )}
              {onLoadFromCloud && (
                <button
                  onClick={onLoadFromCloud}
                  className="w-full py-1 px-2 text-xs text-left hover:bg-gray-100 rounded"
                >
                  ☁ Load from Cloud
                </button>
              )}
            </div>
          </ToolbarDropdown>
          <div className="w-px h-8 bg-gray-200" />
        </>
      )}

      {/* Export menu */}
      <ToolbarDropdown
        trigger={
          <button className="h-8 px-2 flex items-center gap-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-600" title="Export">
            <span className="text-xs">Export</span>
            <span className="text-xs">▾</span>
          </button>
        }
        align="right"
      >
        <div className="flex flex-col gap-1 min-w-[100px]">
          <button
            onClick={() => {
              const canvas = document.querySelector('canvas');
              if (!canvas) return;
              const link = document.createElement('a');
              link.download = `canvas-${Date.now()}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
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
            }}
            className="w-full py-1 px-2 text-xs text-left hover:bg-gray-100 rounded"
          >
            💾 Save JPG
          </button>
        </div>
      </ToolbarDropdown>

      {/* More options dropdown */}
      <ToolbarDropdown
        trigger={
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100" title="More options">
            ⋮
          </button>
        }
        align="right"
      >
        <div className="flex flex-col gap-1 min-w-[120px]">
          <button
            onClick={resetView}
            className="w-full py-1 px-2 text-xs text-left hover:bg-gray-100 rounded"
            title="Reset View (Ctrl+0)"
          >
            🔄 Reset View
          </button>
          <button
            onClick={clearCanvas}
            className="w-full py-1 px-2 text-xs text-left hover:bg-red-100 text-red-600 rounded"
          >
            🗑 Clear All
          </button>
        </div>
      </ToolbarDropdown>
    </div>
  );
}
