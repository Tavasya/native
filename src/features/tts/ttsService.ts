const API_KEY = 'AIzaSyALIxZwSCmTagW6-yuzn-miLbLCVwE-J_Q';

export const generateTTSAudio = async (word: string) => {
  try {
    console.log(`[TTS Service] Generating audio for word: "${word}"`);
    
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: word },
          voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
          audioConfig: { audioEncoding: 'MP3' }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[TTS Service] API Error:`, errorData);
      throw new Error(errorData.error?.message || 'Failed to generate TTS audio');
    }

    const data = await response.json();
    console.log(`[TTS Service] Successfully received audio data for: "${word}"`);
    
    // Convert base64 to blob
    const audioContent = data.audioContent;
    const byteCharacters = atob(audioContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    console.log(`[TTS Service] Created audio URL for: "${word}"`);
    return audioUrl;
  } catch (error) {
    console.error('[TTS Service] Error generating TTS audio:', error);
    throw error;
  }
}; 