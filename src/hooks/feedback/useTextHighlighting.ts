import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { 
  addHighlight, 
  setActiveColor, 
  removeInvalidHighlights,
  selectHighlightsForQuestion,
  type Highlight 
} from '@/features/highlights/highlightsSlice';

export interface TextSelection {
  range: Range;
  text: string;
  containerPath: number[];
  startOffset: number;
  endOffset: number;
  position: { x: number; y: number };
}

export const useTextHighlighting = (
  submissionId: string,
  questionIndex: number,
  section: 'fluency' | 'grammar' | 'vocabulary' | 'pronunciation' | 'overall' = 'overall',
  isActive: boolean = true
) => {
  const dispatch = useAppDispatch();
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  
  const { activeColor, availableColors } = useAppSelector(state => state.highlights);
  const highlights = useAppSelector(state => 
    selectHighlightsForQuestion(state, submissionId, questionIndex, section)
  );

  // Memoize highlights to prevent unnecessary re-renders
  const memoizedHighlights = useMemo(() => highlights, [highlights]);

  // Helper function to get DOM path to a node
  const getNodePath = useCallback((node: Node, container: Element): number[] => {
    const path: number[] = [];
    let current = node;
    
    while (current && current !== container) {
      const parent = current.parentNode;
      if (!parent) break;
      
      const siblings = Array.from(parent.childNodes);
      const index = siblings.indexOf(current as ChildNode);
      path.unshift(index);
      current = parent;
    }
    
    return path;
  }, []);

  // Helper function to restore a node from path
  const getNodeFromPath = useCallback((path: number[], container: Element): Node | null => {
    let current: Node = container;
    
    for (const index of path) {
      if (!current.childNodes[index]) return null;
      current = current.childNodes[index];
    }
    
    return current;
  }, []);

  // Helper function to check if selection contains restricted elements
  const hasRestrictedElementInSelection = useCallback((range: Range): boolean => {
    // Create a document fragment from the range to analyze its contents
    const contents = range.cloneContents();
    
    // Check if the selection itself contains restricted elements
    const walker = document.createTreeWalker(
      contents,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const element = node as Element;
          
          // Check for existing highlights within the selection
          if (element.classList.contains('text-highlight')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          // Allow pronunciation feedback elements (they're safe to highlight)
          if (element.title && element.title.includes('pronunciation feedback')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Check for actual form controls and buttons
          if (element.tagName === 'BUTTON' ||
              element.tagName === 'INPUT' ||
              element.tagName === 'SELECT' ||
              element.tagName === 'TEXTAREA') {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          // Check for elements with explicit button role
          if (element.getAttribute('role') === 'button' && 
              !element.title?.includes('pronunciation feedback')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          // Check for modal/popup elements (but not pronunciation feedback)
          if (element.classList.contains('popover-content') ||
              element.classList.contains('tooltip') ||
              element.getAttribute('role') === 'tooltip' ||
              element.getAttribute('data-state') === 'open') {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          return NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    // If we find any restricted elements, return true
    return walker.nextNode() !== null;
  }, []);

  // Helper function to check if selection crosses problematic block-level elements
  const crossesProblematicElements = useCallback((range: Range): boolean => {
    const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE 
      ? range.startContainer as Element
      : range.startContainer.parentElement;
    const endElement = range.endContainer.nodeType === Node.ELEMENT_NODE
      ? range.endContainer as Element  
      : range.endContainer.parentElement;
    
    if (!startElement || !endElement) return true;
    
    // Check if both elements are within a pronunciation feedback element
    const findPronunciationParent = (element: Element | null): Element | null => {
      while (element && element !== containerRef.current) {
        if (element.title && element.title.includes('pronunciation feedback')) {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    };
    
    const startPronunciationParent = findPronunciationParent(startElement);
    const endPronunciationParent = findPronunciationParent(endElement);
    
    // If both are within the same pronunciation feedback element, allow it
    if (startPronunciationParent && endPronunciationParent && startPronunciationParent === endPronunciationParent) {
      return false;
    }
    
    // Only restrict crossing between major structural elements
    const majorBlockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'SECTION', 'ARTICLE'];
    
    let startBlock = startElement;
    while (startBlock && startBlock !== containerRef.current && !majorBlockTags.includes(startBlock.tagName)) {
      startBlock = startBlock.parentElement;
    }
    
    let endBlock = endElement;
    while (endBlock && endBlock !== containerRef.current && !majorBlockTags.includes(endBlock.tagName)) {
      endBlock = endBlock.parentElement;
    }
    
    // Allow highlighting within the same container or within span/div wrappers
    return startBlock !== endBlock && startBlock !== containerRef.current && endBlock !== containerRef.current;
  }, []);

  // Helper function to check for overlapping highlights  
  const hasOverlappingHighlight = useCallback((range: Range): boolean => {
    const existingHighlights = containerRef.current?.querySelectorAll('.text-highlight');
    if (!existingHighlights) return false;
    
    for (const highlight of existingHighlights) {
      try {
        const highlightRange = document.createRange();
        highlightRange.selectNodeContents(highlight);
        
        // Check if ranges intersect (more permissive check)
        const startComparison = range.compareBoundaryPoints(Range.START_TO_END, highlightRange);
        const endComparison = range.compareBoundaryPoints(Range.END_TO_START, highlightRange);
        
        // Only consider it overlapping if there's actual content overlap, not just touching boundaries
        if (startComparison > 0 && endComparison < 0) {
          // Additional check: see if they actually share text content
          const rangeText = range.toString();
          const highlightText = highlightRange.toString();
          
          // Allow if they're just adjacent or barely touching
          if (rangeText.length > 0 && highlightText.length > 0) {
            const overlap = rangeText.includes(highlightText) || highlightText.includes(rangeText);
            if (overlap) return true;
          }
        }
      } catch (error) {
        // If we can't create a range, be more permissive and continue checking
        console.warn('Could not check highlight overlap:', error);
        continue;
      }
    }
    
    return false;
  }, []);

  // Capture current text selection with validation
  const captureSelection = useCallback((): TextSelection | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !containerRef.current) return null;
    
    const range = selection.getRangeAt(0);
    const text = range.toString().trim();
    
    if (!text || text.length === 0) return null;
    
    // Ensure selection is within our container
    if (!containerRef.current.contains(range.startContainer) || 
        !containerRef.current.contains(range.endContainer)) {
      return null;
    }
    
    // Check for restricted elements within the selection
    if (hasRestrictedElementInSelection(range)) {
      console.warn('Cannot highlight: Selection contains restricted elements (existing highlights, buttons, etc.)');
      return null;
    }
    
    // Check if selection crosses problematic block-level elements
    if (crossesProblematicElements(range)) {
      console.warn('Cannot highlight: Selection crosses different structural elements');
      return null;
    }
    
    // Check for overlapping highlights
    if (hasOverlappingHighlight(range)) {
      console.warn('Cannot highlight: Selection overlaps with existing highlight');
      return null;
    }
    
    // Simple validation: ensure selection has meaningful content
    if (text.length < 2) {
      console.warn('Cannot highlight: Selection too short');
      return null;
    }
    
    const startPath = getNodePath(range.startContainer, containerRef.current);
    const endPath = getNodePath(range.endContainer, containerRef.current);
    
    // Get selection position for popup
    const rect = range.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top
    };
    
    return {
      range: range.cloneRange(),
      text,
      containerPath: startPath,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      position,
    };
  }, [getNodePath, hasRestrictedElementInSelection, crossesProblematicElements, hasOverlappingHighlight]);

  // Create highlight from selection
  const createHighlight = useCallback(() => {
    const selection = captureSelection();
    if (!selection) {
      // Show a brief visual feedback for failed highlighting
      const currentSelection = window.getSelection();
      if (currentSelection && currentSelection.rangeCount > 0) {
        // Create a temporary red overlay to indicate invalid selection
        const range = currentSelection.getRangeAt(0);
        try {
          const span = document.createElement('span');
          span.style.backgroundColor = 'rgba(239, 68, 68, 0.3)'; // red-500 with opacity
          span.style.transition = 'opacity 0.5s ease';
          span.className = 'invalid-selection-feedback';
          
          range.surroundContents(span);
          
          // Remove the feedback after a short delay
          setTimeout(() => {
            const parent = span.parentNode;
            if (parent) {
              parent.replaceChild(document.createTextNode(span.textContent || ''), span);
              parent.normalize();
            }
          }, 800);
        } catch (error) {
          // If we can't surround contents, just clear the selection
          console.warn('Could not show selection feedback:', error);
        }
      }
      
      // Clear the invalid selection
      window.getSelection()?.removeAllRanges();
      setCurrentSelection(null);
      return;
    }
    
    const highlight: Omit<Highlight, 'id' | 'createdAt' | 'updatedAt'> = {
      submissionId,
      questionIndex,
      section,
      color: activeColor,
      text: selection.text,
      startContainerPath: selection.containerPath,
      startOffset: selection.startOffset,
      endContainerPath: getNodePath(selection.range.endContainer, containerRef.current!),
      endOffset: selection.endOffset,
      containerSelector: containerRef.current?.tagName?.toLowerCase() || 'div',
    };
    
    dispatch(addHighlight(highlight));
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setCurrentSelection(null);
  }, [submissionId, questionIndex, section, activeColor, captureSelection, dispatch, getNodePath]);

  // Restore highlight ranges in DOM with improved error handling
  const restoreHighlights = useCallback(() => {
    if (!containerRef.current || !isActive) return;
    
    // Prevent concurrent DOM manipulations
    if (containerRef.current.dataset.restoring === 'true') {
      return;
    }
    
    // Additional safety check: don't manipulate DOM if React is managing the content
    const hasReactHighlights = containerRef.current.querySelectorAll('[class*="bg-red-100"], [class*="bg-blue-100"]').length > 0;
    if (hasReactHighlights) {
      return;
    }
    
    containerRef.current.dataset.restoring = 'true';
    
    // Remove existing highlight spans and invalid selection feedback with better error handling
    const existingHighlights = containerRef.current.querySelectorAll('.text-highlight, .invalid-selection-feedback');
    existingHighlights.forEach(span => {
      try {
        const parent = span.parentNode;
        if (parent && parent.contains(span)) {
          parent.replaceChild(document.createTextNode(span.textContent || ''), span);
          parent.normalize();
        }
      } catch (error) {
        // Silently continue if DOM manipulation fails - element may have been removed by React
        console.warn('Failed to remove highlight span:', error);
      }
    });
    
    // Track failed highlights for cleanup
    const failedHighlightIds: string[] = [];
    
    // Apply current highlights with validation
    memoizedHighlights.forEach(highlight => {
      try {
        const startNode = getNodeFromPath(highlight.startContainerPath, containerRef.current!);
        const endNode = getNodeFromPath(highlight.endContainerPath, containerRef.current!);
        
        if (!startNode || !endNode) {
          failedHighlightIds.push(highlight.id);
          return;
        }
        
        const range = document.createRange();
        
        // Validate offsets before setting range
        const startTextLength = startNode.textContent?.length || 0;
        const endTextLength = endNode.textContent?.length || 0;
        
        if (highlight.startOffset > startTextLength || highlight.endOffset > endTextLength) {
          failedHighlightIds.push(highlight.id);
          return;
        }
        
        range.setStart(startNode, Math.min(highlight.startOffset, startTextLength));
        range.setEnd(endNode, Math.min(highlight.endOffset, endTextLength));
        
        // Validate that the range still contains similar text (allow minor differences)
        const rangeText = range.toString();
        const textSimilarity = rangeText.length > 0 && highlight.text.length > 0 
          ? Math.min(rangeText.length, highlight.text.length) / Math.max(rangeText.length, highlight.text.length)
          : 0;
        
        if (textSimilarity < 0.8) { // Allow 20% text difference
          failedHighlightIds.push(highlight.id);
          return;
        }
        
        // Check if range is still valid
        if (range.collapsed) {
          failedHighlightIds.push(highlight.id);
          return;
        }
        
        const span = document.createElement('span');
        span.className = 'text-highlight';
        span.style.backgroundColor = highlight.color;
        span.style.cursor = 'pointer';
        span.dataset.highlightId = highlight.id;
        span.title = highlight.text;
        
        // Use surroundContents with error handling
        try {
          range.surroundContents(span);
        } catch (error) {
          // If surroundContents fails, mark as invalid but don't crash
          console.warn('Failed to surround contents with highlight span:', error);
          failedHighlightIds.push(highlight.id);
        }
        
      } catch (error) {
        failedHighlightIds.push(highlight.id);
      }
    });
    
    // Clean up failed highlights
    if (failedHighlightIds.length > 0) {
      console.log('Removing', failedHighlightIds.length, 'invalid highlights');
      dispatch(removeInvalidHighlights(failedHighlightIds));
    }
    
    // Clear the restoring flag
    if (containerRef.current) {
      containerRef.current.dataset.restoring = 'false';
    }
  }, [memoizedHighlights, getNodeFromPath, dispatch, isActive]);

  // Handle mouse events for selection
  const handleMouseDown = useCallback(() => {
    setIsSelecting(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    const selection = captureSelection();
    setCurrentSelection(selection);
  }, [captureSelection]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'h':
          event.preventDefault();
          createHighlight(false);
          break;
        case 'j':
          event.preventDefault();
          createHighlight(true);
          break;
      }
    }
  }, [createHighlight]);

  // Set up event listeners only when active
  useEffect(() => {
    if (!isActive) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleMouseDown, handleMouseUp, handleKeyDown]);

  // Restore highlights when they change (debounced) - only when active
  useEffect(() => {
    if (!isActive) return;
    
    const timer = setTimeout(restoreHighlights, 300); // Increased to 300ms debounce
    return () => clearTimeout(timer);
  }, [isActive, memoizedHighlights.length]); // Only re-run when highlight count changes

  // Cleanup effect when highlighting is disabled
  useEffect(() => {
    if (!isActive && containerRef.current) {
      // Remove any existing highlights when disabling
      const existingHighlights = containerRef.current.querySelectorAll('.text-highlight, .invalid-selection-feedback');
      existingHighlights.forEach(span => {
        try {
          const parent = span.parentNode;
          if (parent && parent.contains(span)) {
            parent.replaceChild(document.createTextNode(span.textContent || ''), span);
            parent.normalize();
          }
        } catch (error) {
          // Silently continue if DOM manipulation fails
          console.warn('Failed to cleanup highlight span:', error);
        }
      });
    }
  }, [isActive]);


  return {
    containerRef,
    currentSelection,
    isSelecting,
    highlights: memoizedHighlights,
    activeColor,
    availableColors,
    createHighlight,
    setActiveColor: (color: string) => dispatch(setActiveColor(color)),
    captureSelection,
    selectionPosition: currentSelection?.position || null,
  };
};

export default useTextHighlighting;