import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, X } from 'lucide-react';
import { Component, DragData } from '@/dropdown/types';

// Icon mapping object
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Play,
  X
};

// Helper function to reconstruct a component with its icon
const reconstructComponent = (data: DragData['component'], defaultIcon: React.ComponentType<any>): Component => {
  return {
    id: data.id,
    label: data.label,
    description: data.description,
    icon: ICON_MAP[data.iconType] || defaultIcon
  };
};

interface TriggerNodeData {
  triggerComponent: Component | null;
  onTriggerSelect: (component: Component) => void;
  onTriggerRemove: () => void;
}

// Helper function to check if a value is a valid React component
const isValidReactComponent = (component: any): boolean => {
  return (
    typeof component === 'function' ||
    (typeof component === 'object' && 
     component !== null && 
     (component.$$typeof === Symbol.for('react.forward_ref') || 
      component.$$typeof === Symbol.for('react.memo')))
  );
};

const TriggerNode: React.FC<{ data: TriggerNodeData }> = ({ data }) => {
  console.log('TriggerNode render:', { 
    data, 
    triggerComponent: data.triggerComponent,
    icon: data.triggerComponent?.icon 
  });

  const IconComponent = data.triggerComponent?.icon || Play;
  
  if (!isValidReactComponent(IconComponent)) {
    console.error('Invalid icon component in TriggerNode:', IconComponent);
    return <div>Error: Invalid icon</div>;
  }
  
  return (
    <div 
      className={`bg-white border-2 rounded-lg shadow-lg min-w-[250px] cursor-pointer transition-all ${
        data.triggerComponent 
          ? 'border-blue-500' 
          : 'border-dashed border-blue-300 hover:border-blue-400 hover:shadow-xl'
      }`}
      style={{ pointerEvents: 'all' }}
      onMouseDown={(e) => e.stopPropagation()}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const rawData = e.dataTransfer.getData('application/reactflow');
        if (rawData) {
          const dragData = JSON.parse(rawData) as DragData;
          console.log('TriggerNode drop:', dragData);
          if (dragData.nodeType === 'trigger') {
            const component = reconstructComponent(dragData.component, Play);
            data.onTriggerSelect(component);
          }
        }
      }}
    >
      <div className={`px-4 py-2 flex items-center gap-2 ${
        data.triggerComponent ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        {isValidReactComponent(IconComponent) && <IconComponent size={16} />}
        <span className="font-medium text-sm">1. Trigger</span>
        {data.triggerComponent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onTriggerRemove();
            }}
            className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>
      
      <div className="p-4">
        {data.triggerComponent ? (
          <>
            <h3 className="font-semibold text-gray-800 mb-1">{data.triggerComponent.label}</h3>
            <p className="text-sm text-gray-600">{data.triggerComponent.description}</p>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-gray-800 mb-1">When this happens...</h3>
            <p className="text-sm text-gray-500">Click to select a trigger</p>
          </>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          Select the event that starts your automation
        </div>
      </div>
      
      {data.triggerComponent && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-500 border-2 border-white"
        />
      )}
    </div>
  );
};

export default TriggerNode; 