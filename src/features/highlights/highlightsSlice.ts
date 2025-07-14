import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Highlight {
  id: string;
  submissionId: string;
  questionIndex: number;
  section: 'fluency' | 'grammar' | 'vocabulary' | 'pronunciation' | 'overall';
  color: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  
  // DOM positioning data
  startContainerPath: number[];
  startOffset: number;
  endContainerPath: number[];
  endOffset: number;
  text: string;
  
  // Additional context for restoration
  containerSelector?: string;
  parentElement?: string;
}

export interface HighlightsState {
  highlights: Record<string, Highlight[]>; // submissionId -> highlights
  selectedHighlight: string | null;
  activeColor: string;
  availableColors: string[];
  showCommentModal: boolean;
  commentModalHighlightId: string | null;
}

const HIGHLIGHT_COLORS = [
  '#FFE066', // Yellow
  '#FF9999', // Red
  '#99FF99', // Green
  '#99CCFF', // Blue
  '#FFCC99', // Orange
  '#CC99FF', // Purple
  '#FFB366', // Peach
  '#B3FFB3', // Light Green
];

const initialState: HighlightsState = {
  highlights: {},
  selectedHighlight: null,
  activeColor: HIGHLIGHT_COLORS[0],
  availableColors: HIGHLIGHT_COLORS,
  showCommentModal: false,
  commentModalHighlightId: null,
};

const highlightsSlice = createSlice({
  name: 'highlights',
  initialState,
  reducers: {
    addHighlight: {
      reducer: (state, action: PayloadAction<Highlight>) => {
        const highlight = action.payload;
        const submissionId = highlight.submissionId;
        if (!state.highlights[submissionId]) {
          state.highlights[submissionId] = [];
        }
        state.highlights[submissionId].push(highlight);
      },
      prepare: (payload: Omit<Highlight, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          payload: {
            ...payload,
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          meta: { highlightId: id },
        };
      },
    },
    
    updateHighlight: (state, action: PayloadAction<{ id: string; updates: Partial<Highlight> }>) => {
      const { id, updates } = action.payload;
      
      for (const submissionId in state.highlights) {
        const highlightIndex = state.highlights[submissionId].findIndex(h => h.id === id);
        if (highlightIndex !== -1) {
          state.highlights[submissionId][highlightIndex] = {
            ...state.highlights[submissionId][highlightIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          break;
        }
      }
    },
    
    removeHighlight: (state, action: PayloadAction<string>) => {
      const highlightId = action.payload;
      
      for (const submissionId in state.highlights) {
        state.highlights[submissionId] = state.highlights[submissionId].filter(
          h => h.id !== highlightId
        );
      }
      
      if (state.selectedHighlight === highlightId) {
        state.selectedHighlight = null;
      }
    },
    
    setSelectedHighlight: (state, action: PayloadAction<string | null>) => {
      state.selectedHighlight = action.payload;
    },
    
    setActiveColor: (state, action: PayloadAction<string>) => {
      state.activeColor = action.payload;
    },
    
    showCommentModal: (state, action: PayloadAction<string>) => {
      state.showCommentModal = true;
      state.commentModalHighlightId = action.payload;
    },
    
    hideCommentModal: (state) => {
      state.showCommentModal = false;
      state.commentModalHighlightId = null;
    },
    
    clearHighlightsForSubmission: (state, action: PayloadAction<string>) => {
      delete state.highlights[action.payload];
    },
    
    clearAllHighlights: (state) => {
      state.highlights = {};
      state.selectedHighlight = null;
    },

    removeInvalidHighlights: (state, action: PayloadAction<string[]>) => {
      const invalidIds = action.payload;
      for (const submissionId in state.highlights) {
        state.highlights[submissionId] = state.highlights[submissionId].filter(
          h => !invalidIds.includes(h.id)
        );
      }
    },
  },
});

export const {
  addHighlight,
  updateHighlight,
  removeHighlight,
  setSelectedHighlight,
  setActiveColor,
  showCommentModal,
  hideCommentModal,
  clearHighlightsForSubmission,
  clearAllHighlights,
  removeInvalidHighlights,
} = highlightsSlice.actions;

export default highlightsSlice.reducer;

import { createSelector } from '@reduxjs/toolkit';

// Memoized selectors to prevent unnecessary re-renders
export const selectHighlightsForSubmission = createSelector(
  [(state: { highlights: HighlightsState }) => state.highlights.highlights, (_: any, submissionId: string) => submissionId],
  (highlights, submissionId) => highlights[submissionId] || []
);

export const selectHighlightsForQuestion = createSelector(
  [
    (state: { highlights: HighlightsState }) => state.highlights.highlights,
    (_: any, submissionId: string) => submissionId,
    (_: any, __: string, questionIndex: number) => questionIndex,
    (_: any, __: string, ___: number, section?: string) => section
  ],
  (highlights, submissionId, questionIndex, section) => {
    const submissionHighlights = highlights[submissionId] || [];
    return submissionHighlights.filter(h => {
      const matchesQuestion = h.questionIndex === questionIndex;
      const matchesSection = !section || h.section === section;
      return matchesQuestion && matchesSection;
    });
  }
);

export const selectHighlightById = createSelector(
  [(state: { highlights: HighlightsState }) => state.highlights.highlights, (_: any, highlightId: string) => highlightId],
  (highlights, highlightId) => {
    for (const submissionId in highlights) {
      const highlight = highlights[submissionId].find(h => h.id === highlightId);
      if (highlight) return highlight;
    }
    return null;
  }
);