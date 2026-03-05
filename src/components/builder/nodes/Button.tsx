
'use client';
import { useNode } from '@craftjs/core';
import React from 'react';
import { Button } from '@/components/ui/button';

export const BuilderButton = ({ text, color, variant }: any) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={(ref: any) => connect(drag(ref))} className="inline-block m-2">
      <Button variant={variant} style={{ backgroundColor: variant === 'default' ? color : undefined }}>
        {text}
      </Button>
    </div>
  );
};

BuilderButton.craft = {
  props: {
    text: "Click Me",
    variant: "default",
    color: "#3b82f6"
  },
  related: {
    settings: () => {
        const { actions: { setProp }, text, variant, color } = useNode((node) => ({
            text: node.data.props.text,
            variant: node.data.props.variant,
            color: node.data.props.color
        }));
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Button Text</label>
                    <input value={text} onChange={e => setProp((props: any) => props.text = e.target.value)} className="w-full p-1 border rounded" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Color</label>
                    <input type="color" value={color} onChange={e => setProp((props: any) => props.color = e.target.value)} className="w-full h-8" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Variant</label>
                    <select value={variant} onChange={e => setProp((props: any) => props.variant = e.target.value)} className="w-full p-1 border rounded text-sm">
                        <option value="default">Default</option>
                        <option value="outline">Outline</option>
                        <option value="secondary">Secondary</option>
                        <option value="ghost">Ghost</option>
                    </select>
                </div>
            </div>
        )
    }
  }
};
