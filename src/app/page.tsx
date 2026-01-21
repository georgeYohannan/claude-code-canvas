'use client';

import dynamic from 'next/dynamic';
import Toolbar from '@/components/Toolbar';

const Canvas = dynamic(() => import('@/components/Canvas'), { ssr: false });

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <Canvas />
      <Toolbar />
    </main>
  );
}
