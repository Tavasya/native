import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Zap, X, Mail, Calendar, Database, MessageSquare, Send, Webhook, Library } from 'lucide-react';
import TriggerNode from './components/TriggerNode';
import ActionNode from './components/ActionNode';
import { Component, DragData } from './types';

// Types
interface BaseNodeData {
  [key: string]: unknown;
}

interface TriggerNodeData extends BaseNodeData {
  triggerComponent: Component | null;
  onTriggerSelect: (component: Component) => void;
  onTriggerRemove: () => void;
}

interface ActionNodeData extends BaseNodeData {
  actionComponent: Component | null;
  onActionSelect: (component: Component) => void;
  onActionRemove: () => void;
}

// Available components
const TRIGGERS: Component[] = [
  { id: 'gmail', label: 'Gmail', description: 'When I receive a new email', icon: Mail },
  { id: 'calendar', label: 'Calendar', description: 'When an event is scheduled', icon: Calendar },
  { id: 'database', label: 'Database', description: 'When a new record is added', icon: Database },
];

const ACTIONS: Component[] = [
  { id: 'slack', label: 'Slack', description: 'Send a message to channel', icon: MessageSquare },
  { id: 'email', label: 'Email', description: 'Send an email', icon: Send },
  { id: 'webhook', label: 'Webhook', description: 'Call an API endpoint', icon: Webhook },
];

// Icon mapping object
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Mail,
  Calendar,
  Database,
  MessageSquare,
  Send,
  Webhook,
  Play,
  Zap,
  X,
  Library
};

interface ComponentLibraryProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Helper function to reconstruct a component with its icon
const reconstructComponent = (data: DragData['component'], defaultIcon: React.ComponentType<any>): Component => {
  return {
    id: data.id,
    label: data.label,
    description: data.description,
    icon: ICON_MAP[data.iconType] || defaultIcon
  };
};

// Component Library Sidebar
const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ isOpen, onToggle }) => {
  const onDragStart = (event: React.DragEvent, nodeType: 'trigger' | 'action', component: Component) => {
    // Create a serializable version of the component
    const dragData: DragData = {
      nodeType,
      component: {
        id: component.id,
        label: component.label,
        description: component.description,
        iconType: component.icon.name
      }
    };
    console.log('Drag start:', dragData);
    event.dataTransfer.setData('application/reactflow', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute top-4 left-4 z-50 bg-white border border-gray-300 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all hover:border-blue-400"
      >
        <Library size={20} className="text-gray-600" />
      </button>

      {/* Library Panel */}
      {isOpen && (
        <div className="absolute top-20 left-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Component Library</h2>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Triggers Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                <Play size={16} className="text-blue-500" />
                Triggers
              </h3>
              <div className="space-y-2">
                {TRIGGERS.map((trigger) => {
                  console.log('Rendering trigger:', { trigger, icon: trigger.icon });
                  return (
                    <div
                      key={trigger.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, 'trigger', trigger)}
                      className="p-3 border-2 border-dashed border-blue-200 rounded-lg cursor-grab hover:border-blue-400 hover:bg-blue-50 transition-colors active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-3">
                        {trigger.icon && React.createElement(trigger.icon, { size: 18, className: "text-blue-600" })}
                        <div>
                          <div className="font-medium text-sm text-gray-800">{trigger.label}</div>
                          <div className="text-xs text-gray-500">{trigger.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                <Zap size={16} className="text-green-500" />
                Actions
              </h3>
              <div className="space-y-2">
                {ACTIONS.map((action) => {
                  console.log('Rendering action:', { action, icon: action.icon });
                  return (
                    <div
                      key={action.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, 'action', action)}
                      className="p-3 border-2 border-dashed border-green-200 rounded-lg cursor-grab hover:border-green-400 hover:bg-green-50 transition-colors active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-3">
                        {action.icon && React.createElement(action.icon, { size: 18, className: "text-green-600" })}
                        <div>
                          <div className="font-medium text-sm text-gray-800">{action.label}</div>
                          <div className="text-xs text-gray-500">{action.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                💡 <strong>Tip:</strong> Drag components onto empty nodes or click nodes to select.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface SelectionPanelProps {
  type: 'trigger' | 'action';
  onSelect: (component: Component) => void;
  onClose: () => void;
}

const SelectionPanel: React.FC<SelectionPanelProps> = ({ type, onSelect, onClose }) => {
  const items = type === 'trigger' ? TRIGGERS : ACTIONS;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Choose a {type}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                {React.createElement(item.icon, { size: 20, className: "text-gray-600" })}
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-gray-500">{item.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Component
const AutomationBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TriggerNodeData | ActionNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showTriggerPanel, setShowTriggerPanel] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [triggerComponent, setTriggerComponent] = useState<Component | null>(null);
  const [actionComponent, setActionComponent] = useState<Component | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node clicks
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<TriggerNodeData | ActionNodeData>) => {
    event.stopPropagation();
    if (node.id === 'trigger-node' && !triggerComponent) {
      setShowTriggerPanel(true);
    } else if (node.id === 'action-node' && !actionComponent) {
      setShowActionPanel(true);
    }
  }, [triggerComponent, actionComponent]);

  // Handle drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;

    const data = event.dataTransfer.getData('application/reactflow');
    if (!data) return;

    const dragData = JSON.parse(data) as DragData;

    if (dragData.nodeType === 'trigger' && !triggerComponent) {
      const component = reconstructComponent(dragData.component, Play);
      setTriggerComponent(component);
      updateConnection(component, actionComponent);
    } else if (dragData.nodeType === 'action' && !actionComponent) {
      const component = reconstructComponent(dragData.component, Zap);
      setActionComponent(component);
      updateConnection(triggerComponent, component);
    }
  }, [triggerComponent, actionComponent]);

  // Handle trigger selection
  const handleTriggerSelect = (component: Component) => {
    setTriggerComponent(component);
    setShowTriggerPanel(false);
    updateConnection(component, actionComponent);
  };

  // Handle action selection
  const handleActionSelect = (component: Component) => {
    setActionComponent(component);
    setShowActionPanel(false);
    updateConnection(triggerComponent, component);
  };

  // Update connection between nodes
  const updateConnection = (trigger: Component | null, action: Component | null) => {
    if (trigger && action) {
      const newEdge: Edge = {
        id: 'trigger-action',
        source: 'trigger-node',
        target: 'action-node',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      };
      setEdges([newEdge]);
    } else {
      setEdges([]);
    }
  };

  // Remove components
  const removeTrigger = () => {
    setTriggerComponent(null);
    setEdges([]);
  };

  const removeAction = () => {
    setActionComponent(null);
    setEdges([]);
  };

  // Memoize nodeTypes to prevent ReactFlow warnings
  const nodeTypes = React.useMemo(() => ({
    trigger: TriggerNode,
    action: ActionNode,
  }), []);

  // Initialize nodes
  React.useEffect(() => {
    const initialNodes: Node<TriggerNodeData | ActionNodeData>[] = [
      {
        id: 'trigger-node',
        type: 'trigger',
        position: { x: 100, y: 100 },
        data: {
          triggerComponent,
          onTriggerSelect: handleTriggerSelect,
          onTriggerRemove: removeTrigger
        },
        draggable: false,
      },
      {
        id: 'action-node',
        type: 'action',
        position: { x: 100, y: 300 },
        data: {
          actionComponent,
          onActionSelect: handleActionSelect,
          onActionRemove: removeAction
        },
        draggable: false,
      },
    ];
    
    setNodes(initialNodes);
  }, [triggerComponent, actionComponent, setNodes]);

  return (
    <div className="w-full h-screen bg-gray-50 relative">
      <ComponentLibrary 
        isOpen={isLibraryOpen} 
        onToggle={() => setIsLibraryOpen(!isLibraryOpen)} 
      />
      
      <div 
        ref={reactFlowWrapper}
        className="w-full h-full"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
          nodesDraggable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          nodesFocusable={false}
          edgesFocusable={false}
        >
          <Controls className="bg-white border border-gray-200" />
          <Background color="#e5e7eb" gap={20} />
        </ReactFlow>

        {showTriggerPanel && (
          <SelectionPanel
            type="trigger"
            onSelect={handleTriggerSelect}
            onClose={() => setShowTriggerPanel(false)}
          />
        )}

        {showActionPanel && (
          <SelectionPanel
            type="action"
            onSelect={handleActionSelect}
            onClose={() => setShowActionPanel(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AutomationBuilder;