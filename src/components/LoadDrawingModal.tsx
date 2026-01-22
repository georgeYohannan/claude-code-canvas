'use client';

import { useState, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

interface Drawing {
  id: string;
  name: string;
  thumbnail: string | null;
  elementCount: number;
  createdAt: string;
  updatedAt: string;
}

interface LoadDrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoadDrawingModal({ isOpen, onClose }: LoadDrawingModalProps) {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { loadCanvasData } = useCanvasStore();

  useEffect(() => {
    if (isOpen) {
      fetchDrawings();
    }
  }, [isOpen]);

  const fetchDrawings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/canvas/list');
      const data = await response.json();

      if (data.success) {
        setDrawings(data.result || []);
      } else {
        setError(data.error || 'Failed to load drawings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drawings');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (id: string) => {
    setLoadingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/canvas/load?id=${encodeURIComponent(id)}`);
      const data = await response.json();

      if (data.success && data.result) {
        loadCanvasData({
          elements: data.result.elements,
          viewport: data.result.viewport,
        });
        onClose();
      } else {
        setError(data.error || 'Failed to load drawing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drawing');
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Load Drawing from Cloud</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-500">Loading drawings...</p>
            </div>
          ) : drawings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-2">📭</p>
              <p>No saved drawings found</p>
              <p className="text-sm mt-1">Save a drawing first to see it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {drawings.map((drawing) => (
                <button
                  key={drawing.id}
                  onClick={() => handleLoad(drawing.id)}
                  disabled={loadingId !== null}
                  className="text-left p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
                    {drawing.thumbnail ? (
                      <img
                        src={drawing.thumbnail}
                        alt={drawing.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-2xl">🖼</span>
                    )}
                  </div>
                  <h3 className="font-medium text-sm truncate">{drawing.name}</h3>
                  <p className="text-xs text-gray-500">
                    {drawing.elementCount} elements
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(drawing.updatedAt)}
                  </p>
                  {loadingId === drawing.id && (
                    <p className="text-xs text-blue-500 mt-1">Loading...</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t flex justify-between">
          <button
            onClick={fetchDrawings}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
