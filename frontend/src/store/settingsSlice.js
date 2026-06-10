import { createSlice } from '@reduxjs/toolkit';

const elderlyMode = localStorage.getItem('elderlyMode') === 'true';
const largeFont = localStorage.getItem('largeFont') === 'true' || elderlyMode;

const initialState = {
  elderlyMode,
  largeFont,
  isPlayingSpeech: false,
  speechText: '',

  // Interface
  darkMode: localStorage.getItem('darkMode') !== 'false', // default ON

  // Privacy & Safety
  saveHistory: localStorage.getItem('saveHistory') !== 'false', // default ON
  analyticsOptOut: localStorage.getItem('analyticsOptOut') === 'true', // default OFF

  // Notifications
  soundAlerts: elderlyMode ? (localStorage.getItem('soundAlerts') !== 'false') : false,
  pushNotifications: localStorage.getItem('pushNotifications') === 'true', // default OFF
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleElderlyMode: (state) => {
      state.elderlyMode = !state.elderlyMode;
      state.largeFont = state.elderlyMode;
      localStorage.setItem('elderlyMode', state.elderlyMode);
      localStorage.setItem('largeFont', state.largeFont);
      
      // Sync soundAlerts with elderlyMode: if turned OFF, force sound alerts off.
      if (!state.elderlyMode) {
        state.soundAlerts = false;
        localStorage.setItem('soundAlerts', 'false');
      } else {
        state.soundAlerts = true;
        localStorage.setItem('soundAlerts', 'true');
      }
    },
    toggleLargeFont: (state) => {
      state.largeFont = !state.largeFont;
      localStorage.setItem('largeFont', state.largeFont);
    },
    setSpeechState: (state, action) => {
      state.isPlayingSpeech = action.payload.isPlaying;
      if (action.payload.text !== undefined) {
        state.speechText = action.payload.text;
      }
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
    },
    toggleSaveHistory: (state) => {
      state.saveHistory = !state.saveHistory;
      localStorage.setItem('saveHistory', state.saveHistory);
    },
    toggleAnalyticsOptOut: (state) => {
      state.analyticsOptOut = !state.analyticsOptOut;
      localStorage.setItem('analyticsOptOut', state.analyticsOptOut);
    },
    toggleSoundAlerts: (state) => {
      // Only allow toggling sound alerts manually if elderlyMode is active
      if (state.elderlyMode) {
        state.soundAlerts = !state.soundAlerts;
        localStorage.setItem('soundAlerts', state.soundAlerts);
      }
    },
    togglePushNotifications: (state) => {
      state.pushNotifications = !state.pushNotifications;
      localStorage.setItem('pushNotifications', state.pushNotifications);
    },
  },
});

export const {
  toggleElderlyMode,
  toggleLargeFont,
  setSpeechState,
  toggleDarkMode,
  toggleSaveHistory,
  toggleAnalyticsOptOut,
  toggleSoundAlerts,
  togglePushNotifications,
} = settingsSlice.actions;

export default settingsSlice.reducer;
