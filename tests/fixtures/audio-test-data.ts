/**
 * Test fixtures for audio pipeline testing
 * Creates real blob objects for consistent testing
 */

/**
 * Creates a valid WebM blob with proper header structure
 */
export const createValidWebMBlob = (): Blob => {
  // WebM EBML header signature
  const webmHeader = new Uint8Array([
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
    
    // Add some dummy audio data to make it a reasonable size
    ...new Array(300).fill(0x00) // Padding to reach minimum size
  ]);
  
  return new Blob([webmHeader], { type: 'audio/webm;codecs=opus' });
};

/**
 * Creates a valid MP4 blob
 */
export const createValidMP4Blob = (): Blob => {
  // Simple MP4 header (ftyp box)
  const mp4Header = new Uint8Array([
    0x00, 0x00, 0x00, 0x20, // Box size
    0x66, 0x74, 0x79, 0x70, // "ftyp"
    0x69, 0x73, 0x6F, 0x6D, // "isom"
    0x00, 0x00, 0x02, 0x00, // Minor version
    0x69, 0x73, 0x6F, 0x6D, // "isom"
    0x69, 0x73, 0x6F, 0x32, // "iso2"
    0x6D, 0x70, 0x34, 0x31, // "mp41"
    
    // Add padding to reach minimum size
    ...new Array(300).fill(0x00)
  ]);
  
  return new Blob([mp4Header], { type: 'audio/mp4' });
};

/**
 * Creates an empty blob (should fail validation)
 */
export const createEmptyBlob = (): Blob => {
  return new Blob([], { type: 'audio/webm' });
};

/**
 * Creates a blob with wrong MIME type (should fail validation)
 */
export const createInvalidMimeTypeBlob = (): Blob => {
  return new Blob(['fake audio data'], { type: 'application/pdf' });
};

/**
 * Creates a blob that's too small (should fail validation)
 */
export const createTooSmallBlob = (): Blob => {
  return new Blob(['tiny'], { type: 'audio/webm' });
};

/**
 * Creates a WebM blob with corrupted header (should fail validation)
 */
export const createCorruptedWebMBlob = (): Blob => {
  const corruptedHeader = new Uint8Array([
    0xFF, 0xFF, 0xFF, 0xFF, // Wrong header signature
    ...new Array(300).fill(0x00)
  ]);
  
  return new Blob([corruptedHeader], { type: 'audio/webm' });
};

/**
 * Creates a blob with borderline valid size (edge case)
 */
export const createBorderlineSizeBlob = (): Blob => {
  const webmHeader = new Uint8Array([
    0x1A, 0x45, 0xDF, 0xA3, // Valid WebM header
    ...new Array(196).fill(0x00) // Exactly 200 bytes (minimum threshold)
  ]);
  
  return new Blob([webmHeader], { type: 'audio/webm' });
}; 