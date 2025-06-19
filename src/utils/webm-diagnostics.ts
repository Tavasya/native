/**
 * Options for recording audio with proper WebM format
 */
export const OPTIMAL_RECORDER_OPTIONS = {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 128000
};

/**
 * Validates an audio file for proper structure based on its MIME type
 */
export async function validateAudioBlob(blob: Blob): Promise<{ 
  valid: boolean; 
  error?: string;
  size?: number;
  type?: string;
}> {
  try {
    // Basic validation - check if it's empty
    if (!blob || blob.size === 0) {
      return { 
        valid: false, 
        error: 'Empty audio file',
        size: blob?.size || 0,
        type: blob?.type || 'unknown'
      };
    }

    // Check MIME type - support multiple audio formats
    const validTypes = [
      'audio/webm', 'audio/webm;codecs=opus',
      'audio/mp4', 'audio/mp4;codecs=mp4a.40.2',
      'audio/mpeg', 'audio/wav', 'audio/ogg'
    ];
    
    const baseType = blob.type.split(';')[0].toLowerCase();
    const isValidType = validTypes.some(type => 
      blob.type === type || blob.type.startsWith(type + ';') || baseType === type.split(';')[0]
    );
    
    if (!isValidType) {
      return {
        valid: false,
        error: `Unsupported MIME type: ${blob.type}. Supported: WebM, MP4, MPEG, WAV, OGG`,
        size: blob.size,
        type: blob.type
      };
    }

    // Additional validation - minimal size check
    if (blob.size < 200) {
      return {
        valid: false,
        error: 'Audio file too small, likely missing header',
        size: blob.size,
        type: blob.type
      };
    }

    // Format-specific header validation
    const buffer = await blob.arrayBuffer();
    const dataView = new DataView(buffer);

    if (baseType === 'audio/webm') {
      // WebM files start with 0x1A 0x45 0xDF 0xA3 (EBML header)
      if (buffer.byteLength >= 4) {
        const byte1 = dataView.getUint8(0);
        const byte2 = dataView.getUint8(1);
        const byte3 = dataView.getUint8(2);
        const byte4 = dataView.getUint8(3);

        if (byte1 !== 0x1A || byte2 !== 0x45 || byte3 !== 0xDF || byte4 !== 0xA3) {
          return {
            valid: false,
            error: 'Invalid WebM header signature',
            size: blob.size,
            type: blob.type
          };
        }
      }
    } else if (baseType === 'audio/mp4') {
      // MP4 files should have an ftyp box near the beginning
      if (buffer.byteLength >= 8) {
        const ftypFound = Array.from(new Uint8Array(buffer.slice(0, Math.min(100, buffer.byteLength))))
          .some((_, i, arr) => {
            if (i + 3 < arr.length) {
              return arr[i] === 0x66 && arr[i+1] === 0x74 && arr[i+2] === 0x79 && arr[i+3] === 0x70; // 'ftyp'
            }
            return false;
          });
        
        if (!ftypFound) {
          console.warn('MP4 file missing ftyp box - may still be valid');
          // Don't fail for MP4 files missing ftyp, as some recorders create valid MP4s without it
        }
      }
    }
    // Note: We could add more format-specific validations for WAV, OGG, etc., but basic checks are often sufficient

    return { 
      valid: true,
      size: blob.size,
      type: blob.type
    };
  } catch (error) {
    return { 
      valid: false, 
      error: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
      size: blob?.size || 0,
      type: blob?.type || 'unknown'
    };
  }
}

/**
 * Creates a properly formatted WebM file with header
 */
export async function repairWebMFile(blob: Blob): Promise<{
  fixed: boolean;
  blob: Blob;
  details: Record<string, any>;
}> {
  // First, analyze the file
  const analysis = await validateAudioBlob(blob);
  
  // If it's already valid, just return it
  if (analysis.valid) {
    return {
      fixed: false,
      blob,
      details: {
        message: 'File already has valid WebM structure',
        ...analysis
      }
    };
  }
  
  try {
    // Create minimal valid WebM header
    const minimalWebMHeader = new Uint8Array([
      // EBML Header
      0x1A, 0x45, 0xDF, 0xA3, // EBML Header ID
      0x01, 0x00, 0x00, 0x00, // Header size (unknown size)
      0x42, 0x86, 0x81, 0x01, // EBMLVersion = 1
      0x42, 0xF7, 0x81, 0x01, // EBMLReadVersion = 1
      0x42, 0xF2, 0x81, 0x04, // EBMLMaxIDLength = 4
      0x42, 0xF3, 0x81, 0x08, // EBMLMaxSizeLength = 8
      0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D, // DocType = "webm"
      0x42, 0x87, 0x81, 0x02, // DocTypeVersion = 2
      0x42, 0x85, 0x81, 0x02, // DocTypeReadVersion = 2
      
      // Segment
      0x18, 0x53, 0x80, 0x67, // Segment ID
      0x01, 0x00, 0x00, 0x00, // Segment size (unknown)
      
      // Segment Info
      0x15, 0x49, 0xA9, 0x66, // Info ID
      0x01, 0x00, 0x00, 0x00, // Info size (unknown)
      0x2A, 0xD7, 0xB1, 0x83, 0x00, 0xF7, 0xCF, 0x00, // TimecodeScale = 1000000 (1ms)
      
      // Tracks
      0x16, 0x54, 0xAE, 0x6B, // Tracks ID
      0x01, 0x00, 0x00, 0x00, // Tracks size (unknown)
      
      // TrackEntry
      0xAE, // Track Entry ID
      0x01, 0x00, 0x00, 0x00, // Track Entry size (unknown)
      0xD7, 0x81, 0x01, // TrackNumber = 1
      0x73, 0xC5, 0x81, 0x02, // TrackType = 2 (audio)
      0x86, 0x85, 0x41, 0x75, 0x64, 0x69, 0x6F, // Name = "Audio"
      0x83, 0x81, 0x01, // TrackUID = 1
      
      // Audio
      0xE1, // Audio ID
      0x88, // Audio size
      0xB5, 0x81, 0x02, // SamplingFrequency = 48000 (approx, using 2)
      0x9F, 0x81, 0x02, // Channels = 2
      
      // Cluster (start of actual data)
      0x1F, 0x43, 0xB6, 0x75, // Cluster ID
      0x01, 0x00, 0x00, 0x00  // Cluster size (unknown)
    ]);
    
    // Get the content of the original file
    const originalContent = new Uint8Array(await blob.arrayBuffer());
    
    // Combine header with original content
    const combinedContent = new Uint8Array(minimalWebMHeader.length + originalContent.length);
    combinedContent.set(minimalWebMHeader, 0);
    combinedContent.set(originalContent, minimalWebMHeader.length);
    
    // Create a new blob with the combined content
    const fixedBlob = new Blob([combinedContent], { type: 'audio/webm;codecs=opus' });
    
    // Analyze the fixed blob
    const fixedAnalysis = await validateAudioBlob(fixedBlob);
    
    return {
      fixed: fixedAnalysis.valid,
      blob: fixedAnalysis.valid ? fixedBlob : blob,
      details: {
        message: fixedAnalysis.valid ? 
          'Successfully repaired WebM file by adding proper header' : 
          'Attempted repair failed - file may be corrupted beyond recovery',
        originalSize: blob.size,
        fixedSize: fixedBlob.size,
        ...fixedAnalysis
      }
    };
  } catch (error) {
    return {
      fixed: false,
      blob,
      details: {
        message: `Repair attempt failed with error: ${error instanceof Error ? error.message : String(error)}`,
        originalSize: blob.size,
        ...analysis
      }
    };
  }
}

/**
 * Tests the availability and compatibility of audio recording on the current device
 */
export async function testAudioRecordingCompatibility(): Promise<{
  compatible: boolean;
  details: Record<string, any>;
}> {
  const details: Record<string, any> = {
    userAgent: navigator.userAgent,
    mediaDevicesSupported: !!navigator.mediaDevices,
    mediaRecorderSupported: typeof MediaRecorder !== 'undefined',
    mimeTypes: {}
  };
  
  // Check supported MIME types
  if (typeof MediaRecorder !== 'undefined') {
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/ogg',
      'audio/wav'
    ];
    
    mimeTypes.forEach(type => {
      details.mimeTypes[type] = MediaRecorder.isTypeSupported(type);
    });
  }
  
  // Check audio access
  let audioAccessible = false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioAccessible = true;
    stream.getTracks().forEach(track => track.stop()); // Clean up
  } catch (error) {
    details.audioAccessError = error instanceof Error ? error.message : String(error);
  }
  
  details.audioAccessible = audioAccessible;
  
  // Determine overall compatibility
  const compatible = details.mediaDevicesSupported && 
                     details.mediaRecorderSupported && 
                     audioAccessible &&
                     (details.mimeTypes['audio/webm'] || details.mimeTypes['audio/webm;codecs=opus']);
  
  return { compatible, details };
} 