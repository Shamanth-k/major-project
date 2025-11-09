// The audio feature has been removed from the application to resolve playback errors and streamline the user experience.
// This file is intentionally left blank.

export type SoundType = string;

export const playSound = (type: SoundType) => {
    // This function is a no-op as the audio feature is disabled.
    // It is kept to prevent potential runtime errors if called by older cached components,
    // although all direct calls have been removed from the current codebase.
    console.warn(`playSound('${type}') called, but audio is disabled.`);
};
