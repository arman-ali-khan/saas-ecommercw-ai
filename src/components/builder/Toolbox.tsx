
'use client';
import { useEditor, Element } from '@craftjs/core';
import React from 'react';
import { Type, Square, MousePointer2, Image as ImageIcon } from 'lucide-react';
import { Container } from './nodes/Container';
import { Text } from './nodes/Text';
import { BuilderButton } from './nodes/Button';

export const Toolbox = () => {
  const { connectors } = useEditor();

  const ToolItem = ({ icon: Icon, label, node }: any) => (
    <div 
      ref={(ref: any) => connectors.create(ref, node)}
      className="flex flex-col items-center justify-center p-4 border rounded-xl bg-card hover:border-primary cursor-move transition-all group"
    >
      <Icon className="h-6 w-6 mb-2 group-hover:text-primary" />
      <span className="text-[10px] uppercase font-black tracking-widest">{label}</span>
    </div>
  );

  return (
    <div className="w-64 bg-background border-r p-6 space-y-6 overflow-y-auto">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Components</h3>
      <div className="grid grid-cols-2 gap-3">
        <ToolItem icon={Type} label="Text" node={<Text text="New text block" />} />
        <ToolItem icon={MousePointer2} label="Button" node={<BuilderButton text="Button" />} />
        <ToolItem icon={Square} label="Box" node={<Container background="#f3f4f6" padding={20} />} />
      </div>
    </div>
  );
};
