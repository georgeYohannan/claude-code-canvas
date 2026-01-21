'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { Point, CanvasElement, DrawingElement, ShapeElement, TextElement, ImageElement } from '@/types/canvas';

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

  const {
    elements,
    viewport,
    activeTool,
    activeColor,
    activeShapeType,
    strokeWidth,
    fontSize,
    selectedElementId,
    isDrawing,
    currentElement,
    addElement,
    updateElement,
    deleteElement,
    setActiveTool,
    setViewport,
    setSelectedElementId,
    setIsDrawing,
    setCurrentElement,
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
      }

      if (selectedElementId === element.id) {
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const bounds = getElementBounds(element);
        ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
        ctx.setLineDash([]);
      }

      ctx.restore();
    },
    [selectedElementId]
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

    ctx.restore();
  }, [viewport, elements, currentElement, drawElement]);

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
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        deleteElement(selectedElementId);
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
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
      }

      // Reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setViewport({ x: 0, y: 0, zoom: 1 });
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
  }, [selectedElementId, deleteElement, setActiveTool, setViewport]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = screenToCanvas(e.clientX, e.clientY);

      if (spacePressed || e.button === 1 || activeTool === 'pan') {
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
        return;
      }

      if (activeTool === 'select') {
        const hitElement = hitTest(point);
        setSelectedElementId(hitElement?.id ?? null);
        if (hitElement) {
          setIsDrawing(true);
          setPanStart(point);
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
          x: point.x,
          y: point.y,
          color: activeTool === 'eraser' ? '#000000' : activeColor,
          strokeWidth: activeTool === 'eraser' ? strokeWidth * 2 : strokeWidth,
          points: [point],
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
      setSelectedElementId,
      setIsDrawing,
      setCurrentElement,
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

      if (!isDrawing) return;

      const point = screenToCanvas(e.clientX, e.clientY);

      if (activeTool === 'select' && selectedElementId) {
        const dx = point.x - panStart.x;
        const dy = point.y - panStart.y;
        const element = elements.find((el) => el.id === selectedElementId);
        if (element) {
          if (element.type === 'drawing') {
            const drawingEl = element as DrawingElement;
            const newPoints = drawingEl.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
            updateElement(selectedElementId, { points: newPoints } as Partial<DrawingElement>);
          } else {
            updateElement(selectedElementId, { x: element.x + dx, y: element.y + dy });
          }
        }
        setPanStart(point);
        return;
      }

      if ((activeTool === 'draw' || activeTool === 'eraser') && currentElement?.type === 'drawing') {
        const drawingEl = currentElement as DrawingElement;
        setCurrentElement({
          ...drawingEl,
          points: [...drawingEl.points, point],
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
    },
    [
      isPanning,
      isDrawing,
      activeTool,
      panStart,
      currentElement,
      selectedElementId,
      elements,
      screenToCanvas,
      setViewport,
      setCurrentElement,
      updateElement,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentElement) {
      addElement(currentElement);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  }, [isPanning, isDrawing, currentElement, addElement, setCurrentElement, setIsDrawing]);

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
