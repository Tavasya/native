import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TTSState {
  audioCache: {
    [key: string]: {
      url: string;
      timestamp: number;
    };
  };
  loading: {
    [key: string]: boolean;
  };
}

const initialState: TTSState = {
  audioCache: {},
  loading: {},
};

const ttsSlice = createSlice({
  name: 'tts',
  initialState,
  reducers: {
    setTTSAudio: (state, action: PayloadAction<{ key: string; url: string }>) => {
      // Revoke old URL if it exists to prevent memory leaks
      const oldUrl = state.audioCache[action.payload.key]?.url;
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }
      
      state.audioCache[action.payload.key] = {
        url: action.payload.url,
        timestamp: Date.now(),
      };
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    clearTTSAudio: (state) => {
      // Revoke all URLs to prevent memory leaks
      Object.values(state.audioCache).forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });
      state.audioCache = {};
      state.loading = {};
    },
  },
});

export const { setTTSAudio, setLoading, clearTTSAudio } = ttsSlice.actions;

export const selectTTSAudio = (state: { tts: TTSState }) => state.tts.audioCache;
export const selectTTSLoading = (state: { tts: TTSState }) => state.tts.loading;

export default ttsSlice.reducer; 