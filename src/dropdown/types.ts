export interface Component {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

export interface DragData {
  nodeType: 'trigger' | 'action';
  component: {
    id: string;
    label: string;
    description: string;
    iconType: string;
  };
}

export interface TriggerNodeData {
  triggerComponent: Component | null;
  onTriggerSelect: (component: Component) => void;
  onTriggerRemove: () => void;
}

export interface ActionNodeData {
  actionComponent: Component | null;
  onActionSelect: (component: Component) => void;
  onActionRemove: () => void;
} 