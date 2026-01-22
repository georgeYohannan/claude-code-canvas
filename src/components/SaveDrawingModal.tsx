'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

interface SaveDrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SaveDrawingModal({ isOpen, onClose }: SaveDrawingModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { getCanvasData } = useCanvasStore();

  const generateThumbnail = (): string | null => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;

    // Create a smaller thumbnail
    const thumbnailCanvas = document.createElement('canvas');
    const scale = 0.2;
    thumbnailCanvas.width = canvas.width * scale;
    thumbnailCanvas.height = canvas.height * scale;

    const ctx = thumbnailCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0);

    return thumbnailCanvas.toDataURL('image/png', 0.5);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for your drawing');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const canvasData = getCanvasData();
      const thumbnail = generateThumbnail();

      const response = await fetch('/api/canvas/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          elements: canvasData.elements,
          viewport: canvasData.viewport,
          thumbnail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setName('');
          setSuccess(false);
        }, 1500);
      } else {
        setError(data.error || 'Failed to save drawing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save drawing');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Save Drawing to Cloud</h2>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-4xl mb-2">✓</div>
            <p className="text-green-600">Drawing saved successfully!</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drawing Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My awesome drawing"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
