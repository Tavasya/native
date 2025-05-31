import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap, X } from 'lucide-react';
import { Component, DragData } from '@/dropdown/types';

// Icon mapping object
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Zap,
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

interface ActionNodeData {
  actionComponent: Component | null;
  onActionSelect: (component: Component) => void;
  onActionRemove: () => void;
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

const ActionNode: React.FC<{ data: ActionNodeData }> = ({ data }) => {
  console.log('ActionNode render:', { 
    data, 
    actionComponent: data.actionComponent,
    icon: data.actionComponent?.icon 
  });

  const IconComponent = data.actionComponent?.icon || Zap;
  
  if (!isValidReactComponent(IconComponent)) {
    console.error('Invalid icon component in ActionNode:', IconComponent);
    return <div>Error: Invalid icon</div>;
  }
  
  return (
    <div 
      className={`bg-white border-2 rounded-lg shadow-lg min-w-[250px] cursor-pointer transition-all ${
        data.actionComponent 
          ? 'border-green-500' 
          : 'border-dashed border-green-300 hover:border-green-400 hover:shadow-xl'
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
          console.log('ActionNode drop:', dragData);
          if (dragData.nodeType === 'action') {
            const component = reconstructComponent(dragData.component, Zap);
            data.onActionSelect(component);
          }
        }
      }}
    >
      <div className={`px-4 py-2 flex items-center gap-2 ${
        data.actionComponent ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        {isValidReactComponent(IconComponent) && <IconComponent size={16} />}
        <span className="font-medium text-sm">2. Action</span>
        {data.actionComponent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onActionRemove();
            }}
            className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>
      
      <div className="p-4">
        {data.actionComponent ? (
          <>
            <h3 className="font-semibold text-gray-800 mb-1">{data.actionComponent.label}</h3>
            <p className="text-sm text-gray-600">{data.actionComponent.description}</p>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-gray-800 mb-1">Then do this...</h3>
            <p className="text-sm text-gray-500">Click to select an action</p>
          </>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          Select what happens when the trigger occurs
        </div>
      </div>
      
      {data.actionComponent && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-green-500 border-2 border-white"
        />
      )}
    </div>
  );
};

export default ActionNode; 