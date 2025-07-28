const AZURE_SPEECH_KEY = 'CA4BV9f9rvEKQL22h6L383ucFVNHl9HvkS9bYsBR8xI6cdJm85fHJQQJ99BEACYeBjFXJ3w3AAAYACOGS9sl';
const AZURE_SPEECH_REGION = 'eastus';

// Azure Speech API response types
interface AzurePhonemeData {
  Phoneme: string;
  AccuracyScore: number;
}

interface AzureWordData {
  Word: string;
  AccuracyScore: number;
  ErrorType?: string;
  Phonemes?: AzurePhonemeData[];
}

interface AzureNBestResult {
  PronScore: number;
  Words: AzureWordData[];
}

interface AzureSpeechResponse {
  NBest?: AzureNBestResult[];
  DisplayText?: string;
  RecognitionStatus?: string;
  Offset?: number;
  Duration?: number;
}

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
    console.log('=== AZURE SPEECH SERVICE: Starting pronunciation assessment ===');
    console.log('Input parameters:', {
      audioBlobType: audioBlob.type,
      audioBlobSize: audioBlob.size,
      referenceText: referenceText,
      referenceTextLength: referenceText.length
    });

    try {
      // Step 1: Log audio conversion start
      console.log('Step 1: Converting audio to WAV format...');
      const wavBlob = await this.convertToWav(audioBlob);
      const contentType = 'audio/wav; codecs=audio/pcm; samplerate=16000';
      
      console.log('Audio conversion completed:', {
        originalType: audioBlob.type,
        originalSize: audioBlob.size,
        convertedType: wavBlob.type,
        convertedSize: wavBlob.size,
        contentType: contentType
      });
      
      // Step 2: Prepare pronunciation assessment configuration
      console.log('Step 2: Preparing pronunciation assessment configuration...');
      const pronunciationAssessment = {
        ReferenceText: referenceText,
        GradingSystem: 'HundredMark',
        Granularity: 'Phoneme',
        Dimension: 'Comprehensive',
        EnableMiscue: true
      };
      
      const paHeader = btoa(JSON.stringify(pronunciationAssessment));
      console.log('Pronunciation assessment config:', {
        config: pronunciationAssessment,
        base64Header: paHeader,
        headerLength: paHeader.length
      });
      
      // Step 3: Prepare API request
      console.log('Step 3: Preparing Azure Speech API request...');
      const url = `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;
      const headers = {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': contentType,
        'Accept': 'application/json',
        'Pronunciation-Assessment': paHeader
      };
      
      console.log('API request details:', {
        url: url,
        method: 'POST',
        headers: {
          ...headers,
          'Ocp-Apim-Subscription-Key': `${AZURE_SPEECH_KEY.substring(0, 8)}...` // Mask key for security
        },
        bodySize: wavBlob.size
      });
      
      // Step 4: Make API request
      console.log('Step 4: Sending request to Azure Speech API...');
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: wavBlob,
      });

      const endTime = Date.now();
      const requestDuration = endTime - startTime;
      
      console.log('API request completed:', {
        status: response.status,
        statusText: response.statusText,
        duration: `${requestDuration}ms`,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        console.error('=== AZURE SPEECH API ERROR ===');
        const errorText = await response.text();
        console.error('Error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          requestDuration: `${requestDuration}ms`
        });
        
        // Log additional debug info for common errors
        if (response.status === 401) {
          console.error('Authentication error - check API key and region');
        } else if (response.status === 400) {
          console.error('Bad request - check audio format and parameters');
        } else if (response.status === 429) {
          console.error('Rate limit exceeded - too many requests');
        } else if (response.status >= 500) {
          console.error('Server error - Azure service issue');
        }
        
        throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
      }

      // Step 5: Parse response
      console.log('Step 5: Parsing Azure Speech API response...');
      const data = await response.json();
      console.log('Raw Azure Speech API response:', {
        fullResponse: data,
        recognitionStatus: data.RecognitionStatus,
        displayText: data.DisplayText,
        hasNBest: !!data.NBest,
        nbestLength: data.NBest?.length || 0
      });
      
      // Step 6: Process results
      console.log('Step 6: Processing pronunciation assessment results...');
      const result = this.parsePronunciationResult(data);
      
      console.log('=== AZURE SPEECH SERVICE: Assessment completed successfully ===');
      console.log('Final result summary:', {
        overallScore: result.overallScore,
        wordCount: result.wordScores.length,
        weakWordCount: result.weakWords.length,
        totalDuration: `${Date.now() - startTime}ms`
      });
      
      return result;
    } catch (error) {
      console.error('=== AZURE SPEECH SERVICE: Assessment failed ===');
      console.error('Error details:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        audioBlob: {
          type: audioBlob.type,
          size: audioBlob.size
        },
        referenceText: referenceText
      });
      throw new Error(`Failed to assess pronunciation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async convertToWav(webmBlob: Blob): Promise<Blob> {
    console.log('--- Audio Conversion Process ---');
    console.log('Starting audio conversion with input:', {
      type: webmBlob.type,
      size: webmBlob.size
    });

    try {
      // Step 1: Create audio context
      console.log('Creating AudioContext...');
      const audioContext = new AudioContext();
      console.log('AudioContext created:', {
        sampleRate: audioContext.sampleRate,
        state: audioContext.state
      });

      // Step 2: Convert blob to array buffer
      console.log('Converting blob to ArrayBuffer...');
      const arrayBuffer = await webmBlob.arrayBuffer();
      console.log('ArrayBuffer created:', {
        byteLength: arrayBuffer.byteLength
      });
      
      // Step 3: Decode audio data
      console.log('Decoding audio data...');
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('Audio decoded successfully:', {
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        length: audioBuffer.length,
        duration: audioBuffer.duration
      });
      
      // Step 4: Resample and convert to mono
      console.log('Resampling to 16kHz and converting to mono...');
      const processedBuffer = await this.resampleAndConvertToMono(audioBuffer, 16000);
      console.log('Audio processing completed:', {
        sampleRate: processedBuffer.sampleRate,
        numberOfChannels: processedBuffer.numberOfChannels,
        length: processedBuffer.length,
        duration: processedBuffer.duration
      });
      
      // Step 5: Convert to WAV
      console.log('Converting to WAV format...');
      const wavBuffer = this.audioBufferToWav(processedBuffer);
      console.log('WAV conversion completed:', {
        bufferSize: wavBuffer.byteLength
      });
      
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      console.log('--- Audio Conversion Complete ---');
      console.log('Final WAV blob:', {
        type: wavBlob.type,
        size: wavBlob.size
      });
      
      return wavBlob;
    } catch (error) {
      console.error('--- Audio Conversion Failed ---');
      console.error('Conversion error:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async resampleAndConvertToMono(audioBuffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    console.log('Resampling audio:', {
      fromSampleRate: audioBuffer.sampleRate,
      toSampleRate: targetSampleRate,
      fromChannels: audioBuffer.numberOfChannels,
      toChannels: 1
    });

    // Create offline context for resampling
    const offlineContext = new OfflineAudioContext(
      1, // mono
      Math.ceil(audioBuffer.length * targetSampleRate / audioBuffer.sampleRate),
      targetSampleRate
    );
    
    console.log('OfflineAudioContext created:', {
      numberOfChannels: offlineContext.destination.channelCount,
      length: offlineContext.length,
      sampleRate: offlineContext.sampleRate
    });
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // If stereo, create a channel merger to mix to mono
    if (audioBuffer.numberOfChannels > 1) {
      console.log('Converting stereo to mono...');
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
      console.log('Stereo to mono conversion setup complete');
    } else {
      console.log('Audio is already mono, direct connection');
      source.connect(offlineContext.destination);
    }
    
    source.start(0);
    console.log('Starting audio rendering...');
    const result = await offlineContext.startRendering();
    console.log('Audio rendering completed:', {
      sampleRate: result.sampleRate,
      numberOfChannels: result.numberOfChannels,
      length: result.length,
      duration: result.duration
    });
    
    return result;
  }
  
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    console.log('Converting AudioBuffer to WAV format...');
    const length = buffer.length;
    const numberOfChannels = 1; // Always mono for Azure
    const sampleRate = 16000; // Always 16kHz for Azure
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    console.log('WAV conversion parameters:', {
      length: length,
      numberOfChannels: numberOfChannels,
      sampleRate: sampleRate,
      totalSize: arrayBuffer.byteLength
    });
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    console.log('Writing WAV header...');
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
    console.log('Converting audio samples...');
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    let clippedSamples = 0;
    
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      if (sample === 1 || sample === -1) clippedSamples++;
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    console.log('Audio conversion completed:', {
      totalSamples: length,
      clippedSamples: clippedSamples,
      clippingPercentage: ((clippedSamples / length) * 100).toFixed(2) + '%'
    });
    
    return arrayBuffer;
  }

  private parsePronunciationResult(data: AzureSpeechResponse): PronunciationAssessmentResult {
    console.log('--- Parsing Azure Speech Response ---');
    console.log('Raw response data:', data);
    
    const wordScores: Array<{ word: string; score: number; phonemes: Array<{ phoneme: string; score: number }> }> = [];
    const weakWords: string[] = [];

    // Parse from NBest structure (this is the correct Azure response format)
    if (data.NBest && data.NBest[0] && data.NBest[0].Words) {
      const words = data.NBest[0].Words;
      console.log('Processing words from NBest:', {
        wordCount: words.length,
        words: words.map(w => ({ word: w.Word, score: w.AccuracyScore, errorType: w.ErrorType }))
      });
      
      words.forEach((wordData: AzureWordData, index: number) => {
        console.log(`Processing word ${index + 1}/${words.length}:`, {
          word: wordData.Word,
          accuracyScore: wordData.AccuracyScore,
          errorType: wordData.ErrorType,
          hasPhonemes: !!wordData.Phonemes,
          phonemeCount: wordData.Phonemes?.length || 0
        });

        const score = wordData.AccuracyScore || 0;
        const word = wordData.Word;
        const errorType = wordData.ErrorType;
        
        // Skip words that weren't detected (omitted words)
        if (score === 0 && errorType === "Omission") {
          console.log(`Skipping omitted word: ${word}`);
          return;
        }
        
        // Extract phonemes if available
        const phonemes = wordData.Phonemes ? wordData.Phonemes.map((p: AzurePhonemeData) => {
          console.log(`  Phoneme: ${p.Phoneme}, Score: ${p.AccuracyScore}`);
          return {
            phoneme: p.Phoneme,
            score: p.AccuracyScore || 0
          };
        }) : [];
        
        wordScores.push({
          word,
          score,
          phonemes
        });

        // Only mark as weak word if it was detected and scored below 50
        if (score > 0 && score < 50) {
          console.log(`Marking as weak word: ${word} (score: ${score})`);
          weakWords.push(word);
        }
      });
    } else {
      console.warn('No NBest data found in response or NBest structure is invalid');
      console.log('Response structure check:', {
        hasNBest: !!data.NBest,
        nbestLength: data.NBest?.length || 0,
        hasFirstResult: !!(data.NBest && data.NBest[0]),
        hasWords: !!(data.NBest && data.NBest[0] && data.NBest[0].Words)
      });
    }

    // Calculate overall score from NBest
    const overallScore = data.NBest?.[0]?.PronScore || 0;
    console.log('Overall pronunciation score:', overallScore);

    const result = {
      overallScore,
      wordScores,
      weakWords
    };

    console.log('--- Parsing Complete ---');
    console.log('Final parsed result:', {
      overallScore: result.overallScore,
      wordScoreCount: result.wordScores.length,
      weakWordCount: result.weakWords.length,
      wordScores: result.wordScores,
      weakWords: result.weakWords
    });
    
    return result;
  }
} 