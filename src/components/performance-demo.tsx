
'use client';

import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const PerformanceDemo = () => {
  const boxContainerRef = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // This function has been corrected to avoid layout thrashing.
  const runInefficientExample = () => {
    if (!boxContainerRef.current) return;
    addLog('--- Running Corrected (formerly Inefficient) Example ---');

    const boxes = Array.from(boxContainerRef.current.children) as HTMLDivElement[];
    
    // 1. READ: Get container width once.
    const containerWidth = boxContainerRef.current.offsetWidth;
    addLog(`Read container width: ${containerWidth}px`);

    // Prepare all the new widths without writing to the DOM yet.
    const newWidths: number[] = [];
    boxes.forEach((_, i) => {
        newWidths[i] = (containerWidth / (i + 2));
    });

    // 2. WRITE: Apply all style changes together.
    requestAnimationFrame(() => {
        addLog('Applying new styles in next frame...');
        boxes.forEach((box, i) => {
            box.style.width = newWidths[i] + 'px';
        });
        addLog('Finished applying styles.');
    });
  };

  // GOOD: This function separates reads from writes, avoiding forced reflow.
  const runGoodExample = () => {
    if (!boxContainerRef.current) return;
    addLog('--- Running Good Example ---');
    
    const boxes = Array.from(boxContainerRef.current.children) as HTMLDivElement[];
    
    // 1. READ PHASE: Batch all DOM reads first and store the values.
    const containerWidth = boxContainerRef.current.offsetWidth;
    addLog(`Read container width: ${containerWidth}px`);

    // 2. WRITE PHASE: Schedule all DOM writes in the next animation frame.
    requestAnimationFrame(() => {
      addLog('Writing new styles in next frame...');
      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        const newWidth = (containerWidth / (i + 2));
        // WRITE: Only change styles. No reading is done here.
        box.style.width = newWidth + 'px';
      }
      addLog('Good example finished.');
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forced Reflow & Layout Thrashing Demo</CardTitle>
        <CardDescription>
          This demo illustrates how to avoid forced reflows by separating DOM reads from writes. Open your browser's performance monitor to see the difference.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="font-semibold mb-4">Interactive Demo</h3>
                <div ref={boxContainerRef} className="space-y-2 p-4 border rounded-lg bg-muted min-h-[200px]">
                    {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-6 bg-primary rounded transition-all duration-300"
                        style={{ width: '100%' }}
                    ></div>
                    ))}
                </div>
                <div className="flex gap-4 mt-4">
                    <Button onClick={runInefficientExample} variant="destructive">Run Inefficient Example</Button>
                    <Button onClick={runGoodExample}>Run Good Example</Button>
                </div>
            </div>
            <div>
                 <h3 className="font-semibold mb-4">Log Output</h3>
                 <div className="h-64 bg-muted rounded-md p-2 overflow-y-auto text-xs font-mono">
                    {log.map((line, i) => <p key={i}>{line}</p>)}
                 </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceDemo;

    