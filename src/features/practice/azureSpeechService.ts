const AZURE_SPEECH_KEY = 'CA4BV9f9rvEKQL22h6L383ucFVNHl9HvkS9bYsBR8xI6cdJm85fHJQQJ99BEACYeBjFXJ3w3AAAYACOGS9sl';
const AZURE_SPEECH_REGION = 'eastus';

export interface PronunciationAssessmentResult {
  overallScore: number;
  wordScores: Array<{
    word: string;
    score: number;
    phonemes: Array<{
      phoneme: string;
      score: number;
    }>;
  }>;
  weakWords: string[];
}

export class AzureSpeechService {
  async assessPronunciation(audioBlob: Blob, referenceText: string): Promise<PronunciationAssessmentResult> {
    try {
      console.log('Original audio blob:', { type: audioBlob.type, size: audioBlob.size });
      console.log('Reference text:', referenceText);
      
      // Convert WebM audio to WAV format for Azure compatibility
      const wavBlob = await this.convertToWav(audioBlob);
      const contentType = 'audio/wav; codecs=audio/pcm; samplerate=16000';
      
      console.log('Converted audio blob:', { type: wavBlob.type, size: wavBlob.size });
      console.log('Content-Type header:', contentType);
      
      const pronunciationAssessment = {
        ReferenceText: referenceText,
        GradingSystem: 'HundredMark',
        Granularity: 'Phoneme',
        Dimension: 'Comprehensive',
        EnableMiscue: true
      };
      
      const paHeader = btoa(JSON.stringify(pronunciationAssessment));
      console.log('Pronunciation-Assessment header (original):', pronunciationAssessment);
      console.log('Pronunciation-Assessment header (base64):', paHeader);
      
      const url = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
          'Content-Type': contentType,
          'Accept': 'application/json',
          'Pronunciation-Assessment': paHeader
        },
        body: wavBlob,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Azure Speech API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Azure Speech API Response:', data);
      return this.parsePronunciationResult(data, referenceText);
    } catch (error) {
      console.error('Pronunciation assessment error:', error);
      throw new Error('Failed to assess pronunciation');
    }
  }

  private async convertToWav(webmBlob: Blob): Promise<Blob> {
    try {
      console.log('Starting audio conversion...');
      const audioContext = new AudioContext();
      const arrayBuffer = await webmBlob.arrayBuffer();
      console.log('Audio buffer size:', arrayBuffer.byteLength);
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('Decoded audio:', {
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        length: audioBuffer.length,
        duration: audioBuffer.duration
      });
      
      // Check duration limit
      if (audioBuffer.duration > 30) {
        throw new Error('Audio duration exceeds 30 seconds limit for pronunciation assessment');
      }
      
      // Resample to 16kHz and convert to mono if needed
      const processedBuffer = await this.resampleAndConvertToMono(audioBuffer, 16000);
      const wavBuffer = this.audioBufferToWav(processedBuffer);
      console.log('WAV buffer size:', wavBuffer.byteLength);
      
      return new Blob([wavBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Audio conversion failed:', error);
      throw error; // Don't fallback for pronunciation assessment
    }
  }

  private async resampleAndConvertToMono(audioBuffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    const audioContext = new AudioContext();
    
    // Create offline context for resampling
    const offlineContext = new OfflineAudioContext(
      1, // mono
      Math.ceil(audioBuffer.length * targetSampleRate / audioBuffer.sampleRate),
      targetSampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // If stereo, create a channel merger to mix to mono
    if (audioBuffer.numberOfChannels > 1) {
      const merger = offlineContext.createChannelMerger(1);
      const splitter = offlineContext.createChannelSplitter(audioBuffer.numberOfChannels);
      const gainNodes = [];
      
      source.connect(splitter);
      
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const gain = offlineContext.createGain();
        gain.gain.value = 1 / audioBuffer.numberOfChannels;
        splitter.connect(gain, i);
        gain.connect(merger, 0, 0);
        gainNodes.push(gain);
      }
      
      merger.connect(offlineContext.destination);
    } else {
      source.connect(offlineContext.destination);
    }
    
    source.start(0);
    return await offlineContext.startRendering();
  }
  
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length;
    const numberOfChannels = 1; // Always mono for Azure
    const sampleRate = 16000; // Always 16kHz for Azure
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true); // 16-bit
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float32 to int16 (mono)
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return arrayBuffer;
  }

  private parsePronunciationResult(data: any, referenceText: string): PronunciationAssessmentResult {
    console.log('Parsing Azure response:', data);
    
    const wordScores: Array<{ word: string; score: number; phonemes: any[] }> = [];
    const weakWords: string[] = [];

    // Parse from NBest structure (this is the correct Azure response format)
    if (data.NBest && data.NBest[0] && data.NBest[0].Words) {
      const words = data.NBest[0].Words;
      console.log('Found words in NBest:', words);
      
      words.forEach((wordData: any) => {
        const score = wordData.AccuracyScore || 0;
        const word = wordData.Word;
        const errorType = wordData.ErrorType;
        
        // Skip words that weren't detected (omitted words)
        if (score === 0 && errorType === "Omission") {
          console.log(`Skipping omitted word: ${word}`);
          return;
        }
        
        // Extract phonemes if available
        const phonemes = wordData.Phonemes ? wordData.Phonemes.map((p: any) => ({
          phoneme: p.Phoneme,
          score: p.AccuracyScore || 0
        })) : [];
        
        wordScores.push({
          word,
          score,
          phonemes
        });

        // Only mark as weak word if it was detected and scored below 50
        if (score > 0 && score < 50) {
          weakWords.push(word);
        }
      });
    }

    // Calculate overall score from NBest
    const overallScore = data.NBest?.[0]?.PronScore || 0;

    const result = {
      overallScore,
      wordScores,
      weakWords
    };

    console.log('Parsed result:', result);
    return result;
  }
} 