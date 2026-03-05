
'use client';
import { useNode } from '@craftjs/core';
import React, { useState, useEffect } from 'react';
import ContentEditable from 'react-contenteditable';

export const Text = ({ text, fontSize, textAlign, color }: any) => {
  const { connectors: { connect, drag }, actions: { setProp }, selected } = useNode((state) => ({
    selected: state.events.selected
  }));

  const [editable, setEditable] = useState(false);

  useEffect(() => {
    if (!selected) setEditable(false);
  }, [selected]);

  return (
    <div 
      ref={(ref: any) => connect(drag(ref))}
      onClick={() => selected && setEditable(true)}
      style={{ textAlign }}
    >
      <ContentEditable
        html={text}
        disabled={!editable}
        onChange={(e) => setProp((props: any) => props.text = e.target.value)}
        tagName="p"
        style={{ fontSize: `${fontSize}px`, color }}
        className={cn(editable && "outline-none ring-2 ring-primary p-1 rounded")}
      />
    </div>
  );
};

import { cn } from '@/lib/utils';

Text.craft = {
  props: {
    text: "Type your text here",
    fontSize: 16,
    textAlign: 'left',
    color: '#000000'
  },
  related: {
    settings: () => {
        const { actions: { setProp }, fontSize, textAlign, color } = useNode((node) => ({
            fontSize: node.data.props.fontSize,
            textAlign: node.data.props.textAlign,
            color: node.data.props.color
        }));
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Font Size</label>
                    <input type="number" value={fontSize} onChange={e => setProp((props: any) => props.fontSize = e.target.value)} className="w-full p-1 border rounded" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Color</label>
                    <input type="color" value={color} onChange={e => setProp((props: any) => props.color = e.target.value)} className="w-full" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Align</label>
                    <div className="flex gap-1">
                        {['left', 'center', 'right'].map(a => (
                            <button key={a} onClick={() => setProp((props: any) => props.textAlign = a)} className={cn("flex-1 p-1 border rounded text-xs capitalize", textAlign === a && "bg-primary text-white")}>{a}</button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }
  }
};
