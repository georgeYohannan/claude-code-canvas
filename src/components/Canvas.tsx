'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { Point, CanvasElement, DrawingElement, ShapeElement, TextElement, ImageElement, ConnectorElement } from '@/types/canvas';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const textInputOpenedAt = useRef<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [textInput, setTextInput] = useState<{ show: boolean; x: number; y: number; value: string }>({
    show: false,
    x: 0,
    y: 0,
    value: '',
  });
  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<Point | null>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStartBounds, setResizeStartBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [resizeStartPoint, setResizeStartPoint] = useState<Point | null>(null);

  // Connector state
  const [connectorStart, setConnectorStart] = useState<{ point: Point; elementId: string | null } | null>(null);

  const {
    elements,
    viewport,
    activeTool,
    activeColor,
    activeShapeType,
    strokeWidth,
    fontSize,
    selectedElementIds,
    isDrawing,
    currentElement,
    gridSettings,
    addElement,
    updateElement,
    deleteElement,
    setActiveTool,
    setViewport,
    selectElements,
    addToSelection,
    removeFromSelection,
    clearSelection,
    setIsDrawing,
    setCurrentElement,
    // New actions
    undo,
    redo,
    copy,
    paste,
    duplicate,
    zoomIn,
    zoomOut,
    snapToGrid,
    toggleLock,
  } = useCanvasStore();

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (screenX - rect.left - viewport.x) / viewport.zoom,
        y: (screenY - rect.top - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  const drawElement = useCallback(
    (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
      ctx.save();
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (element.type) {
        case 'drawing': {
          const drawingEl = element as DrawingElement;
          if (drawingEl.points.length < 2) break;

          if (drawingEl.isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
          }

          ctx.beginPath();
          ctx.moveTo(drawingEl.points[0].x, drawingEl.points[0].y);
          for (let i = 1; i < drawingEl.points.length; i++) {
            ctx.lineTo(drawingEl.points[i].x, drawingEl.points[i].y);
          }
          ctx.stroke();

          if (drawingEl.isEraser) {
            ctx.globalCompositeOperation = 'source-over';
          }
          break;
        }
        case 'shape': {
          const shapeEl = element as ShapeElement;
          ctx.beginPath();
          switch (shapeEl.shapeType) {
            case 'rect':
              ctx.strokeRect(shapeEl.x, shapeEl.y, shapeEl.width, shapeEl.height);
              break;
            case 'circle': {
              const centerX = shapeEl.x + shapeEl.width / 2;
              const centerY = shapeEl.y + shapeEl.height / 2;
              const radiusX = Math.abs(shapeEl.width / 2);
              const radiusY = Math.abs(shapeEl.height / 2);
              ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
              ctx.stroke();
              break;
            }
            case 'line':
              ctx.moveTo(shapeEl.x, shapeEl.y);
              ctx.lineTo(shapeEl.endX ?? shapeEl.x + shapeEl.width, shapeEl.endY ?? shapeEl.y + shapeEl.height);
              ctx.stroke();
              break;
            case 'triangle': {
              const midX = shapeEl.x + shapeEl.width / 2;
              ctx.moveTo(midX, shapeEl.y);
              ctx.lineTo(shapeEl.x, shapeEl.y + shapeEl.height);
              ctx.lineTo(shapeEl.x + shapeEl.width, shapeEl.y + shapeEl.height);
              ctx.closePath();
              ctx.stroke();
              break;
            }
            case 'arrow': {
              const endX = shapeEl.endX ?? shapeEl.x + shapeEl.width;
              const endY = shapeEl.endY ?? shapeEl.y + shapeEl.height;
              const angle = Math.atan2(endY - shapeEl.y, endX - shapeEl.x);
              const headLength = 15;
              ctx.moveTo(shapeEl.x, shapeEl.y);
              ctx.lineTo(endX, endY);
              ctx.lineTo(
                endX - headLength * Math.cos(angle - Math.PI / 6),
                endY - headLength * Math.sin(angle - Math.PI / 6)
              );
              ctx.moveTo(endX, endY);
              ctx.lineTo(
                endX - headLength * Math.cos(angle + Math.PI / 6),
                endY - headLength * Math.sin(angle + Math.PI / 6)
              );
              ctx.stroke();
              break;
            }
            case 'star': {
              const cx = shapeEl.x + shapeEl.width / 2;
              const cy = shapeEl.y + shapeEl.height / 2;
              const outerRadius = Math.min(Math.abs(shapeEl.width), Math.abs(shapeEl.height)) / 2;
              const innerRadius = outerRadius / 2.5;
              const spikes = 5;
              let rot = (Math.PI / 2) * 3;
              const step = Math.PI / spikes;
              ctx.moveTo(cx, cy - outerRadius);
              for (let i = 0; i < spikes; i++) {
                let xOuter = cx + Math.cos(rot) * outerRadius;
                let yOuter = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(xOuter, yOuter);
                rot += step;
                let xInner = cx + Math.cos(rot) * innerRadius;
                let yInner = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(xInner, yInner);
                rot += step;
              }
              ctx.lineTo(cx, cy - outerRadius);
              ctx.closePath();
              ctx.stroke();
              break;
            }
            case 'diamond': {
              const cx = shapeEl.x + shapeEl.width / 2;
              const cy = shapeEl.y + shapeEl.height / 2;
              ctx.moveTo(cx, shapeEl.y);
              ctx.lineTo(shapeEl.x + shapeEl.width, cy);
              ctx.lineTo(cx, shapeEl.y + shapeEl.height);
              ctx.lineTo(shapeEl.x, cy);
              ctx.closePath();
              ctx.stroke();
              break;
            }
            case 'parallelogram': {
              const skew = Math.abs(shapeEl.width) * 0.2;
              ctx.moveTo(shapeEl.x + skew, shapeEl.y);
              ctx.lineTo(shapeEl.x + shapeEl.width, shapeEl.y);
              ctx.lineTo(shapeEl.x + shapeEl.width - skew, shapeEl.y + shapeEl.height);
              ctx.lineTo(shapeEl.x, shapeEl.y + shapeEl.height);
              ctx.closePath();
              ctx.stroke();
              break;
            }
            case 'hexagon': {
              const cx = shapeEl.x + shapeEl.width / 2;
              const cy = shapeEl.y + shapeEl.height / 2;
              const halfW = Math.abs(shapeEl.width) / 2;
              ctx.moveTo(cx - halfW * 0.5, shapeEl.y);
              ctx.lineTo(cx + halfW * 0.5, shapeEl.y);
              ctx.lineTo(shapeEl.x + shapeEl.width, cy);
              ctx.lineTo(cx + halfW * 0.5, shapeEl.y + shapeEl.height);
              ctx.lineTo(cx - halfW * 0.5, shapeEl.y + shapeEl.height);
              ctx.lineTo(shapeEl.x, cy);
              ctx.closePath();
              ctx.stroke();
              break;
            }
            case 'pentagon': {
              const cx = shapeEl.x + shapeEl.width / 2;
              const cy = shapeEl.y + shapeEl.height / 2;
              const r = Math.min(Math.abs(shapeEl.width), Math.abs(shapeEl.height)) / 2;
              for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                const px = cx + r * Math.cos(angle);
                const py = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.stroke();
              break;
            }
            case 'roundedRect': {
              const radius = Math.min(15, Math.abs(shapeEl.width) / 4, Math.abs(shapeEl.height) / 4);
              ctx.roundRect(shapeEl.x, shapeEl.y, shapeEl.width, shapeEl.height, radius);
              ctx.stroke();
              break;
            }
            case 'cylinder': {
              const ellipseH = Math.abs(shapeEl.height) * 0.15;
              const w = Math.abs(shapeEl.width);
              const h = Math.abs(shapeEl.height);
              // Top ellipse
              ctx.ellipse(shapeEl.x + w / 2, shapeEl.y + ellipseH, w / 2, ellipseH, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.beginPath();
              // Side lines
              ctx.moveTo(shapeEl.x, shapeEl.y + ellipseH);
              ctx.lineTo(shapeEl.x, shapeEl.y + h - ellipseH);
              ctx.moveTo(shapeEl.x + w, shapeEl.y + ellipseH);
              ctx.lineTo(shapeEl.x + w, shapeEl.y + h - ellipseH);
              ctx.stroke();
              ctx.beginPath();
              // Bottom ellipse (half)
              ctx.ellipse(shapeEl.x + w / 2, shapeEl.y + h - ellipseH, w / 2, ellipseH, 0, 0, Math.PI);
              ctx.stroke();
              break;
            }
            case 'document': {
              const w = shapeEl.width;
              const h = shapeEl.height;
              const waveH = Math.abs(h) * 0.1;
              ctx.moveTo(shapeEl.x, shapeEl.y);
              ctx.lineTo(shapeEl.x + w, shapeEl.y);
              ctx.lineTo(shapeEl.x + w, shapeEl.y + h - waveH);
              ctx.quadraticCurveTo(
                shapeEl.x + w * 0.75, shapeEl.y + h,
                shapeEl.x + w * 0.5, shapeEl.y + h - waveH
              );
              ctx.quadraticCurveTo(
                shapeEl.x + w * 0.25, shapeEl.y + h - waveH * 2,
                shapeEl.x, shapeEl.y + h - waveH
              );
              ctx.closePath();
              ctx.stroke();
              break;
            }
            case 'cloud': {
              const cx = shapeEl.x + shapeEl.width / 2;
              const cy = shapeEl.y + shapeEl.height / 2;
              const w = Math.abs(shapeEl.width) / 2;
              const h = Math.abs(shapeEl.height) / 2;
              // Draw overlapping circles to form cloud
              ctx.arc(cx - w * 0.4, cy + h * 0.2, h * 0.5, 0, Math.PI * 2);
              ctx.arc(cx, cy - h * 0.2, h * 0.6, 0, Math.PI * 2);
              ctx.arc(cx + w * 0.4, cy + h * 0.2, h * 0.5, 0, Math.PI * 2);
              ctx.arc(cx - w * 0.15, cy + h * 0.4, h * 0.35, 0, Math.PI * 2);
              ctx.arc(cx + w * 0.2, cy + h * 0.35, h * 0.4, 0, Math.PI * 2);
              ctx.stroke();
              break;
            }
            case 'callout': {
              const w = shapeEl.width;
              const h = shapeEl.height;
              const tailH = Math.abs(h) * 0.25;
              const bodyH = Math.abs(h) - tailH;
              const radius = Math.min(10, Math.abs(w) / 6, bodyH / 4);
              // Rounded rectangle body
              ctx.roundRect(shapeEl.x, shapeEl.y, w, bodyH, radius);
              ctx.stroke();
              ctx.beginPath();
              // Tail/pointer
              ctx.moveTo(shapeEl.x + Math.abs(w) * 0.2, shapeEl.y + bodyH);
              ctx.lineTo(shapeEl.x + Math.abs(w) * 0.1, shapeEl.y + Math.abs(h));
              ctx.lineTo(shapeEl.x + Math.abs(w) * 0.35, shapeEl.y + bodyH);
              ctx.stroke();
              break;
            }
            case 'plus': {
              const w = Math.abs(shapeEl.width);
              const h = Math.abs(shapeEl.height);
              const armW = w / 3;
              const armH = h / 3;
              ctx.moveTo(shapeEl.x + armW, shapeEl.y);
              ctx.lineTo(shapeEl.x + armW * 2, shapeEl.y);
              ctx.lineTo(shapeEl.x + armW * 2, shapeEl.y + armH);
              ctx.lineTo(shapeEl.x + w, shapeEl.y + armH);
              ctx.lineTo(shapeEl.x + w, shapeEl.y + armH * 2);
              ctx.lineTo(shapeEl.x + armW * 2, shapeEl.y + armH * 2);
              ctx.lineTo(shapeEl.x + armW * 2, shapeEl.y + h);
              ctx.lineTo(shapeEl.x + armW, shapeEl.y + h);
              ctx.lineTo(shapeEl.x + armW, shapeEl.y + armH * 2);
              ctx.lineTo(shapeEl.x, shapeEl.y + armH * 2);
              ctx.lineTo(shapeEl.x, shapeEl.y + armH);
              ctx.lineTo(shapeEl.x + armW, shapeEl.y + armH);
              ctx.closePath();
              ctx.stroke();
              break;
            }
            case 'cross': {
              const w = Math.abs(shapeEl.width);
              const h = Math.abs(shapeEl.height);
              const margin = Math.min(w, h) * 0.15;
              ctx.moveTo(shapeEl.x + margin, shapeEl.y + margin);
              ctx.lineTo(shapeEl.x + w - margin, shapeEl.y + h - margin);
              ctx.moveTo(shapeEl.x + w - margin, shapeEl.y + margin);
              ctx.lineTo(shapeEl.x + margin, shapeEl.y + h - margin);
              ctx.stroke();
              break;
            }
          }
          break;
        }
        case 'text': {
          const textEl = element as TextElement;
          ctx.font = `${textEl.fontSize}px sans-serif`;
          ctx.fillText(textEl.text, textEl.x, textEl.y);
          break;
        }
        case 'image': {
          const imageEl = element as ImageElement;
          const img = new Image();
          img.src = imageEl.imageData;
          ctx.drawImage(img, imageEl.x, imageEl.y, imageEl.width, imageEl.height);
          break;
        }
        case 'connector': {
          const connEl = element as ConnectorElement;
          let startX = connEl.startPoint.x;
          let startY = connEl.startPoint.y;
          let endX = connEl.endPoint.x;
          let endY = connEl.endPoint.y;

          // If connected to elements, get their center points
          if (connEl.startElementId) {
            const startElement = elements.find((el) => el.id === connEl.startElementId);
            if (startElement) {
              const bounds = getElementBounds(startElement);
              startX = bounds.x + bounds.width / 2;
              startY = bounds.y + bounds.height / 2;
            }
          }
          if (connEl.endElementId) {
            const endElement = elements.find((el) => el.id === connEl.endElementId);
            if (endElement) {
              const bounds = getElementBounds(endElement);
              endX = bounds.x + bounds.width / 2;
              endY = bounds.y + bounds.height / 2;
            }
          }

          ctx.beginPath();
          if (connEl.connectorStyle === 'straight') {
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
          } else if (connEl.connectorStyle === 'elbow') {
            // Draw elbow connector (L-shaped)
            const midX = (startX + endX) / 2;
            ctx.moveTo(startX, startY);
            ctx.lineTo(midX, startY);
            ctx.lineTo(midX, endY);
            ctx.lineTo(endX, endY);
          } else if (connEl.connectorStyle === 'curved') {
            // Draw curved connector using bezier
            const controlX1 = startX + (endX - startX) / 3;
            const controlY1 = startY;
            const controlX2 = endX - (endX - startX) / 3;
            const controlY2 = endY;
            ctx.moveTo(startX, startY);
            ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
          }
          ctx.stroke();

          // Draw arrow at the end if hasEndArrow
          if (connEl.hasEndArrow !== false) {
            const angle = Math.atan2(endY - startY, endX - startX);
            const headLength = 12;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLength * Math.cos(angle - Math.PI / 6),
              endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - headLength * Math.cos(angle + Math.PI / 6),
              endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }

          // Draw circle at start point for visual feedback
          ctx.beginPath();
          ctx.arc(startX, startY, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      // Selection indicator
      if (selectedElementIds.includes(element.id)) {
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const bounds = getElementBounds(element);
        ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
        ctx.setLineDash([]);

        // Draw resize handles for shapes and images (only for single selection)
        if (selectedElementIds.length === 1 && (element.type === 'shape' || element.type === 'image') && !element.locked) {
          const handleSize = 8;
          const handles = [
            { x: bounds.x - 5, y: bounds.y - 5 }, // nw
            { x: bounds.x + bounds.width / 2, y: bounds.y - 5 }, // n
            { x: bounds.x + bounds.width + 5, y: bounds.y - 5 }, // ne
            { x: bounds.x + bounds.width + 5, y: bounds.y + bounds.height / 2 }, // e
            { x: bounds.x + bounds.width + 5, y: bounds.y + bounds.height + 5 }, // se
            { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height + 5 }, // s
            { x: bounds.x - 5, y: bounds.y + bounds.height + 5 }, // sw
            { x: bounds.x - 5, y: bounds.y + bounds.height / 2 }, // w
          ];

          handles.forEach((handle) => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0066ff';
            ctx.lineWidth = 2;
            ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
          });
        }
      }

      // Locked element indicator
      if (element.locked) {
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        const bounds = getElementBounds(element);
        ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
        ctx.setLineDash([]);
        // Draw lock icon
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#ff6600';
        ctx.fillText('🔒', bounds.x + bounds.width + 5, bounds.y + 14);
      }

      ctx.restore();
    },
    [selectedElementIds]
  );

  const getElementBounds = (element: CanvasElement): { x: number; y: number; width: number; height: number } => {
    switch (element.type) {
      case 'drawing': {
        const drawingEl = element as DrawingElement;
        if (drawingEl.points.length === 0) return { x: element.x, y: element.y, width: 0, height: 0 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        drawingEl.points.forEach((p) => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
      case 'shape': {
        const shapeEl = element as ShapeElement;
        if (shapeEl.shapeType === 'line' || shapeEl.shapeType === 'arrow') {
          const endX = shapeEl.endX ?? shapeEl.x + shapeEl.width;
          const endY = shapeEl.endY ?? shapeEl.y + shapeEl.height;
          return {
            x: Math.min(shapeEl.x, endX),
            y: Math.min(shapeEl.y, endY),
            width: Math.abs(endX - shapeEl.x),
            height: Math.abs(endY - shapeEl.y),
          };
        }
        return { x: shapeEl.x, y: shapeEl.y, width: shapeEl.width, height: shapeEl.height };
      }
      case 'text': {
        const textEl = element as TextElement;
        const canvas = canvasRef.current;
        if (!canvas) return { x: textEl.x, y: textEl.y - textEl.fontSize, width: 100, height: textEl.fontSize };
        const ctx = canvas.getContext('2d');
        if (!ctx) return { x: textEl.x, y: textEl.y - textEl.fontSize, width: 100, height: textEl.fontSize };
        ctx.font = `${textEl.fontSize}px sans-serif`;
        const metrics = ctx.measureText(textEl.text);
        return { x: textEl.x, y: textEl.y - textEl.fontSize, width: metrics.width, height: textEl.fontSize };
      }
      case 'image': {
        const imageEl = element as ImageElement;
        return { x: imageEl.x, y: imageEl.y, width: imageEl.width, height: imageEl.height };
      }
      case 'connector': {
        const connEl = element as ConnectorElement;
        const minX = Math.min(connEl.startPoint.x, connEl.endPoint.x);
        const minY = Math.min(connEl.startPoint.y, connEl.endPoint.y);
        const maxX = Math.max(connEl.startPoint.x, connEl.endPoint.x);
        const maxY = Math.max(connEl.startPoint.y, connEl.endPoint.y);
        return { x: minX, y: minY, width: maxX - minX || 10, height: maxY - minY || 10 };
      }
    }
  };

  const hitTest = useCallback(
    (point: Point): CanvasElement | null => {
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        const bounds = getElementBounds(element);
        if (
          point.x >= bounds.x - 5 &&
          point.x <= bounds.x + bounds.width + 5 &&
          point.y >= bounds.y - 5 &&
          point.y <= bounds.y + bounds.height + 5
        ) {
          return element;
        }
      }
      return null;
    },
    [elements]
  );

  // Resize handle size
  const HANDLE_SIZE = 8;

  // Get resize handles for a selected element
  const getResizeHandles = useCallback(
    (bounds: { x: number; y: number; width: number; height: number }) => {
      const { x, y, width, height } = bounds;
      return {
        'nw': { x: x - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 },
        'n':  { x: x + width / 2 - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 },
        'ne': { x: x + width - HANDLE_SIZE / 2, y: y - HANDLE_SIZE / 2 },
        'e':  { x: x + width - HANDLE_SIZE / 2, y: y + height / 2 - HANDLE_SIZE / 2 },
        'se': { x: x + width - HANDLE_SIZE / 2, y: y + height - HANDLE_SIZE / 2 },
        's':  { x: x + width / 2 - HANDLE_SIZE / 2, y: y + height - HANDLE_SIZE / 2 },
        'sw': { x: x - HANDLE_SIZE / 2, y: y + height - HANDLE_SIZE / 2 },
        'w':  { x: x - HANDLE_SIZE / 2, y: y + height / 2 - HANDLE_SIZE / 2 },
      };
    },
    []
  );

  // Hit test for resize handles
  const hitTestResizeHandle = useCallback(
    (point: Point): { elementId: string; handle: string } | null => {
      if (selectedElementIds.length !== 1) return null;

      const element = elements.find((el) => el.id === selectedElementIds[0]);
      if (!element || element.locked) return null;

      // Only allow resizing shapes and images
      if (element.type !== 'shape' && element.type !== 'image') return null;

      const bounds = getElementBounds(element);
      const handles = getResizeHandles(bounds);

      for (const [handleName, handlePos] of Object.entries(handles)) {
        if (
          point.x >= handlePos.x - 2 &&
          point.x <= handlePos.x + HANDLE_SIZE + 2 &&
          point.y >= handlePos.y - 2 &&
          point.y <= handlePos.y + HANDLE_SIZE + 2
        ) {
          return { elementId: element.id, handle: handleName };
        }
      }
      return null;
    },
    [selectedElementIds, elements, getResizeHandles]
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Draw grid
    const gridSize = 50;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    const startX = Math.floor(-viewport.x / viewport.zoom / gridSize) * gridSize - gridSize;
    const startY = Math.floor(-viewport.y / viewport.zoom / gridSize) * gridSize - gridSize;
    const endX = startX + (canvas.width / viewport.zoom) + gridSize * 2;
    const endY = startY + (canvas.height / viewport.zoom) + gridSize * 2;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    elements.forEach((element) => drawElement(ctx, element));

    if (currentElement) {
      drawElement(ctx, currentElement);
    }

    // Draw marquee selection rectangle
    if (isMarqueeSelecting && marqueeStart && marqueeEnd) {
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.fillStyle = 'rgba(0, 102, 255, 0.1)';
      const x = Math.min(marqueeStart.x, marqueeEnd.x);
      const y = Math.min(marqueeStart.y, marqueeEnd.y);
      const width = Math.abs(marqueeEnd.x - marqueeStart.x);
      const height = Math.abs(marqueeEnd.y - marqueeStart.y);
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [viewport, elements, currentElement, drawElement, isMarqueeSelecting, marqueeStart, marqueeEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      render();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [render]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        selectedElementIds.forEach((id) => {
          const el = elements.find((e) => e.id === id);
          if (el && !el.locked) deleteElement(id);
        });
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            e.preventDefault();
            copy();
            break;
          case 'v':
            e.preventDefault();
            paste();
            break;
          case 'd':
            e.preventDefault();
            duplicate();
            break;
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            setViewport({ x: 0, y: 0, zoom: 1 });
            break;
          case 'l':
            e.preventDefault();
            if (selectedElementIds.length > 0) {
              selectedElementIds.forEach((id) => toggleLock(id));
            }
            break;
        }
        return;
      }

      // Tool shortcuts (no modifier key)
      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'b':
          setActiveTool('draw');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 's':
          setActiveTool('shape');
          break;
        case 'c':
          setActiveTool('connector');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'i':
          setActiveTool('image');
          document.getElementById('image-upload')?.click();
          break;
        case 'h':
          setActiveTool('pan');
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedElementIds, elements, deleteElement, setActiveTool, setViewport, undo, redo, copy, paste, duplicate, zoomIn, zoomOut, toggleLock]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rawPoint = screenToCanvas(e.clientX, e.clientY);
      const point = {
        x: snapToGrid(rawPoint.x),
        y: snapToGrid(rawPoint.y),
      };

      if (spacePressed || e.button === 1 || activeTool === 'pan') {
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
        return;
      }

      if (activeTool === 'select') {
        // Check for resize handle hit first
        const resizeHit = hitTestResizeHandle(rawPoint);
        if (resizeHit) {
          const element = elements.find((el) => el.id === resizeHit.elementId);
          if (element) {
            setIsResizing(true);
            setResizeHandle(resizeHit.handle);
            setResizeStartBounds(getElementBounds(element));
            setResizeStartPoint(rawPoint);
            return;
          }
        }

        const hitElement = hitTest(rawPoint);

        if (hitElement) {
          // Clicked on an element
          if (e.shiftKey) {
            // Shift+click: toggle selection
            if (selectedElementIds.includes(hitElement.id)) {
              removeFromSelection(hitElement.id);
            } else {
              addToSelection(hitElement.id);
            }
          } else {
            // Regular click: select only this element (unless already selected for multi-drag)
            if (!selectedElementIds.includes(hitElement.id)) {
              selectElements([hitElement.id]);
            }
          }
          // Start dragging if element is not locked
          if (!hitElement.locked) {
            setIsDrawing(true);
            setPanStart(rawPoint);
          }
        } else {
          // Clicked on empty space - start marquee selection
          if (!e.shiftKey) {
            clearSelection();
          }
          setIsMarqueeSelecting(true);
          setMarqueeStart(rawPoint);
          setMarqueeEnd(rawPoint);
        }
        return;
      }

      if (activeTool === 'text') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        textInputOpenedAt.current = Date.now();
        setTextInput({
          show: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          value: '',
        });
        // Focus the input after a small delay to ensure it's rendered
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 50);
        return;
      }

      if (activeTool === 'draw' || activeTool === 'eraser') {
        const newElement: DrawingElement = {
          id: generateId(),
          type: 'drawing',
          x: rawPoint.x,
          y: rawPoint.y,
          color: activeTool === 'eraser' ? '#000000' : activeColor,
          strokeWidth: activeTool === 'eraser' ? strokeWidth * 2 : strokeWidth,
          points: [rawPoint],
          isEraser: activeTool === 'eraser',
        };
        setCurrentElement(newElement);
        setIsDrawing(true);
      }

      if (activeTool === 'shape') {
        const newElement: ShapeElement = {
          id: generateId(),
          type: 'shape',
          x: point.x,
          y: point.y,
          color: activeColor,
          strokeWidth,
          shapeType: activeShapeType,
          width: 0,
          height: 0,
          endX: point.x,
          endY: point.y,
        };
        setCurrentElement(newElement);
        setIsDrawing(true);
      }

      if (activeTool === 'connector') {
        // Check if clicking on an element to start connection
        const hitElement = hitTest(rawPoint);
        const startElementId = hitElement ? hitElement.id : null;

        setConnectorStart({
          point: rawPoint,
          elementId: startElementId,
        });

        const newConnector: ConnectorElement = {
          id: generateId(),
          type: 'connector',
          x: rawPoint.x,
          y: rawPoint.y,
          color: activeColor,
          strokeWidth,
          startElementId,
          endElementId: null,
          startPoint: rawPoint,
          endPoint: rawPoint,
          connectorStyle: 'straight',
          hasEndArrow: true,
        };
        setCurrentElement(newConnector);
        setIsDrawing(true);
      }
    },
    [
      activeTool,
      activeColor,
      strokeWidth,
      activeShapeType,
      viewport,
      screenToCanvas,
      spacePressed,
      hitTest,
      hitTestResizeHandle,
      selectedElementIds,
      elements,
      selectElements,
      addToSelection,
      removeFromSelection,
      clearSelection,
      setIsDrawing,
      setCurrentElement,
      snapToGrid,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        setViewport({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      const rawPoint = screenToCanvas(e.clientX, e.clientY);
      const point = {
        x: snapToGrid(rawPoint.x),
        y: snapToGrid(rawPoint.y),
      };

      // Handle marquee selection
      if (isMarqueeSelecting) {
        setMarqueeEnd(rawPoint);
        return;
      }

      // Handle resizing
      if (isResizing && resizeHandle && resizeStartBounds && resizeStartPoint && selectedElementIds.length === 1) {
        const element = elements.find((el) => el.id === selectedElementIds[0]);
        if (!element || (element.type !== 'shape' && element.type !== 'image')) return;

        const dx = point.x - resizeStartPoint.x;
        const dy = point.y - resizeStartPoint.y;

        let newX = resizeStartBounds.x;
        let newY = resizeStartBounds.y;
        let newWidth = resizeStartBounds.width;
        let newHeight = resizeStartBounds.height;

        // Handle different resize directions
        switch (resizeHandle) {
          case 'nw':
            newX = resizeStartBounds.x + dx;
            newY = resizeStartBounds.y + dy;
            newWidth = resizeStartBounds.width - dx;
            newHeight = resizeStartBounds.height - dy;
            break;
          case 'n':
            newY = resizeStartBounds.y + dy;
            newHeight = resizeStartBounds.height - dy;
            break;
          case 'ne':
            newY = resizeStartBounds.y + dy;
            newWidth = resizeStartBounds.width + dx;
            newHeight = resizeStartBounds.height - dy;
            break;
          case 'e':
            newWidth = resizeStartBounds.width + dx;
            break;
          case 'se':
            newWidth = resizeStartBounds.width + dx;
            newHeight = resizeStartBounds.height + dy;
            break;
          case 's':
            newHeight = resizeStartBounds.height + dy;
            break;
          case 'sw':
            newX = resizeStartBounds.x + dx;
            newWidth = resizeStartBounds.width - dx;
            newHeight = resizeStartBounds.height + dy;
            break;
          case 'w':
            newX = resizeStartBounds.x + dx;
            newWidth = resizeStartBounds.width - dx;
            break;
        }

        // Ensure minimum size
        const minSize = 10;
        if (newWidth < minSize) {
          if (resizeHandle.includes('w')) {
            newX = resizeStartBounds.x + resizeStartBounds.width - minSize;
          }
          newWidth = minSize;
        }
        if (newHeight < minSize) {
          if (resizeHandle.includes('n')) {
            newY = resizeStartBounds.y + resizeStartBounds.height - minSize;
          }
          newHeight = minSize;
        }

        updateElement(element.id, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
        return;
      }

      if (!isDrawing) return;

      // Move all selected elements
      if (activeTool === 'select' && selectedElementIds.length > 0) {
        const dx = rawPoint.x - panStart.x;
        const dy = rawPoint.y - panStart.y;
        selectedElementIds.forEach((id) => {
          const element = elements.find((el) => el.id === id);
          if (element && !element.locked) {
            if (element.type === 'drawing') {
              const drawingEl = element as DrawingElement;
              const newPoints = drawingEl.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
              updateElement(id, { points: newPoints } as Partial<DrawingElement>);
            } else {
              updateElement(id, { x: element.x + dx, y: element.y + dy });
            }
          }
        });
        setPanStart(rawPoint);
        return;
      }

      if ((activeTool === 'draw' || activeTool === 'eraser') && currentElement?.type === 'drawing') {
        const drawingEl = currentElement as DrawingElement;
        setCurrentElement({
          ...drawingEl,
          points: [...drawingEl.points, rawPoint],
        });
      }

      if (activeTool === 'shape' && currentElement?.type === 'shape') {
        const shapeEl = currentElement as ShapeElement;
        if (shapeEl.shapeType === 'line' || shapeEl.shapeType === 'arrow') {
          setCurrentElement({
            ...shapeEl,
            endX: point.x,
            endY: point.y,
            width: point.x - shapeEl.x,
            height: point.y - shapeEl.y,
          });
        } else {
          setCurrentElement({
            ...shapeEl,
            width: point.x - shapeEl.x,
            height: point.y - shapeEl.y,
          });
        }
      }

      if (activeTool === 'connector' && currentElement?.type === 'connector') {
        const connEl = currentElement as ConnectorElement;
        setCurrentElement({
          ...connEl,
          endPoint: rawPoint,
        });
      }
    },
    [
      isPanning,
      isDrawing,
      isMarqueeSelecting,
      isResizing,
      resizeHandle,
      resizeStartBounds,
      resizeStartPoint,
      activeTool,
      panStart,
      currentElement,
      selectedElementIds,
      elements,
      screenToCanvas,
      setViewport,
      setCurrentElement,
      updateElement,
      snapToGrid,
    ]
  );

  // Helper to check if element intersects with marquee rectangle
  const elementIntersectsRect = useCallback(
    (element: CanvasElement, rect: { x: number; y: number; width: number; height: number }) => {
      const bounds = getElementBounds(element);
      return !(
        bounds.x + bounds.width < rect.x ||
        bounds.x > rect.x + rect.width ||
        bounds.y + bounds.height < rect.y ||
        bounds.y > rect.y + rect.height
      );
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // End resizing
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStartBounds(null);
      setResizeStartPoint(null);
      return;
    }

    // Finalize marquee selection
    if (isMarqueeSelecting && marqueeStart && marqueeEnd) {
      const rect = {
        x: Math.min(marqueeStart.x, marqueeEnd.x),
        y: Math.min(marqueeStart.y, marqueeEnd.y),
        width: Math.abs(marqueeEnd.x - marqueeStart.x),
        height: Math.abs(marqueeEnd.y - marqueeStart.y),
      };

      // Only select if marquee has some size
      if (rect.width > 5 || rect.height > 5) {
        const selectedIds = elements
          .filter((el) => elementIntersectsRect(el, rect))
          .map((el) => el.id);
        selectElements(selectedIds);
      }

      setIsMarqueeSelecting(false);
      setMarqueeStart(null);
      setMarqueeEnd(null);
      return;
    }

    if (isDrawing && currentElement) {
      // Special handling for connector - check if end point is on an element
      if (currentElement.type === 'connector') {
        const connEl = currentElement as ConnectorElement;
        const endHit = hitTest(connEl.endPoint);
        // Don't connect to the start element
        const endElementId = endHit && endHit.id !== connEl.startElementId ? endHit.id : null;

        addElement({
          ...connEl,
          endElementId,
        });
        setConnectorStart(null);
      } else {
        addElement(currentElement);
      }
      setCurrentElement(null);
    }
    setIsDrawing(false);
  }, [isPanning, isDrawing, isResizing, isMarqueeSelecting, marqueeStart, marqueeEnd, currentElement, elements, addElement, setCurrentElement, setIsDrawing, selectElements, elementIntersectsRect, hitTest]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * delta));

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
      const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

      setViewport({ x: newX, y: newY, zoom: newZoom });
    },
    [viewport, setViewport]
  );

  const handleTextSubmit = useCallback(() => {
    if (textInput.value.trim()) {
      const point = screenToCanvas(
        textInput.x + (canvasRef.current?.getBoundingClientRect().left ?? 0),
        textInput.y + (canvasRef.current?.getBoundingClientRect().top ?? 0)
      );
      const newElement: TextElement = {
        id: generateId(),
        type: 'text',
        x: point.x,
        y: point.y,
        color: activeColor,
        strokeWidth,
        text: textInput.value,
        fontSize,
      };
      addElement(newElement);
    }
    setTextInput({ show: false, x: 0, y: 0, value: '' });
  }, [textInput, activeColor, strokeWidth, fontSize, screenToCanvas, addElement]);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const canvasPoint = screenToCanvas(canvas.width / 2, canvas.height / 2);
          const newElement: ImageElement = {
            id: generateId(),
            type: 'image',
            x: canvasPoint.x - img.width / 4,
            y: canvasPoint.y - img.height / 4,
            color: activeColor,
            strokeWidth,
            imageData: event.target?.result as string,
            width: img.width / 2,
            height: img.height / 2,
          };
          addElement(newElement);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [activeColor, strokeWidth, screenToCanvas, addElement]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const point = screenToCanvas(e.clientX, e.clientY);
          const newElement: ImageElement = {
            id: generateId(),
            type: 'image',
            x: point.x - img.width / 4,
            y: point.y - img.height / 4,
            color: activeColor,
            strokeWidth,
            imageData: event.target?.result as string,
            width: img.width / 2,
            height: img.height / 2,
          };
          addElement(newElement);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [activeColor, strokeWidth, screenToCanvas, addElement]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-white">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${spacePressed || activeTool === 'pan' ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
        style={{ pointerEvents: textInput.show ? 'none' : 'auto' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      />

      {textInput.show && (
        <input
          ref={textInputRef}
          type="text"
          className="absolute border-2 border-blue-500 px-2 py-1 outline-none bg-white text-black shadow-lg"
          style={{
            left: textInput.x,
            top: textInput.y,
            minWidth: '200px',
            fontSize: '16px',
            zIndex: 9999,
          }}
          value={textInput.value}
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              e.preventDefault();
              handleTextSubmit();
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setTextInput({ show: false, x: 0, y: 0, value: '' });
            }
          }}
          onBlur={() => {
            // Ignore blur events that happen within 500ms of opening
            const timeSinceOpened = Date.now() - textInputOpenedAt.current;
            if (timeSinceOpened < 500) {
              // Re-focus the input
              setTimeout(() => textInputRef.current?.focus(), 10);
              return;
            }
            handleTextSubmit();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="image-upload"
        onChange={handleImageUpload}
      />

      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded shadow text-sm" style={{ zIndex: 100 }}>
        Zoom: {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
}
