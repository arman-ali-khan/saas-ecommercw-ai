
'use client';
import { useNode } from '@craftjs/core';
import React from 'react';

export const Container = ({ background, padding = 0, children }: any) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div 
      ref={(ref: any) => connect(drag(ref))} 
      style={{ 
        background, 
        padding: `${padding}px`,
        minHeight: '50px' 
      }}
      className="w-full transition-all"
    >
      {children}
    </div>
  );
};

Container.craft = {
  props: {
    background: '#ffffff',
    padding: 20
  },
  related: {
    settings: () => {
        const { actions: { setProp }, background, padding } = useNode((node) => ({
            background: node.data.props.background,
            padding: node.data.props.padding
        }));
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Background</label>
                    <input type="color" value={background} onChange={e => setProp((props: any) => props.background = e.target.value)} className="w-full h-8" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Padding ({padding}px)</label>
                    <input type="range" min="0" max="100" value={padding} onChange={e => setProp((props: any) => props.padding = e.target.value)} className="w-full" />
                </div>
            </div>
        )
    }
  }
};
