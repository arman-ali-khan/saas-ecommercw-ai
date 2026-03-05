
'use client';
import { useEditor } from '@craftjs/core';
import React from 'react';
import { Settings, Info } from 'lucide-react';

export const SettingsPanel = () => {
  const { actions, selected, isEnabled } = useEditor((state) => {
    const [currentNodeId] = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related && state.nodes[currentNodeId].related.settings,
        isDeletable: actions.history(state).canDeletable(currentNodeId)
      };
    }

    return {
      selected,
      isEnabled: state.options.enabled
    };
  });

  return isEnabled && selected ? (
    <div className="w-72 bg-background border-l p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-6 text-primary">
        <Settings className="h-5 w-5" />
        <h3 className="font-bold uppercase tracking-wider text-sm">Settings: {selected.name}</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2">
        {selected.settings && React.createElement(selected.settings)}
      </div>

      <div className="pt-6 mt-6 border-t">
        <button 
            onClick={() => actions.deserialize(JSON.stringify({}))}
            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
        >
            Clear Canvas
        </button>
      </div>
    </div>
  ) : (
    <div className="w-72 bg-background border-l p-8 flex flex-col items-center justify-center text-center opacity-50">
        <Info className="h-10 w-10 mb-4 text-muted-foreground" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select an element to edit properties</p>
    </div>
  );
};
