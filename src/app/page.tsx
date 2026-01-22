'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Toolbar from '@/components/Toolbar';
import SaveDrawingModal from '@/components/SaveDrawingModal';
import LoadDrawingModal from '@/components/LoadDrawingModal';

const Canvas = dynamic(() => import('@/components/Canvas'), { ssr: false });

export default function Home() {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  return (
    <main className="w-screen h-screen overflow-hidden">
      <Canvas />
      <Toolbar
        onSaveToCloud={() => setShowSaveModal(true)}
        onLoadFromCloud={() => setShowLoadModal(true)}
      />
      <SaveDrawingModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
      />
      <LoadDrawingModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
      />
    </main>
  );
}
