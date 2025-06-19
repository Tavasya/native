/**
 * Unit tests for validateAudioBlob function
 * Tests the actual business logic without mocks
 */

import { validateAudioBlob } from '../../../src/utils/webm-diagnostics';
import {
  createValidWebMBlob,
  createValidMP4Blob,
  createEmptyBlob,
  createInvalidMimeTypeBlob,
  createTooSmallBlob,
  createCorruptedWebMBlob,
  createBorderlineSizeBlob
} from '../../fixtures/audio-test-data';

describe('validateAudioBlob', () => {
  describe('Valid Audio Blobs', () => {
    it('should accept valid WebM blob with proper header', async () => {
      const validBlob = createValidWebMBlob();
      
      const result = await validateAudioBlob(validBlob);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.size).toBeGreaterThan(200);
      expect(result.type).toBe('audio/webm;codecs=opus');
    });

    it('should accept valid MP4 blob', async () => {
      const validBlob = createValidMP4Blob();
      
      const result = await validateAudioBlob(validBlob);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.size).toBeGreaterThan(200);
      expect(result.type).toBe('audio/mp4');
    });

    it('should accept WebM blob with different codec specification', async () => {
      const webmData = new Uint8Array([
        0x1A, 0x45, 0xDF, 0xA3, // WebM header
        ...new Array(300).fill(0x00)
      ]);
      const blob = new Blob([webmData], { type: 'audio/webm' });
      
      const result = await validateAudioBlob(blob);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('audio/webm');
    });

    it('should accept borderline valid size blob', async () => {
      const borderlineBlob = createBorderlineSizeBlob();
      
      const result = await validateAudioBlob(borderlineBlob);
      
      expect(result.valid).toBe(true);
      expect(result.size).toBe(200);
    });
  });

  describe('Invalid Audio Blobs', () => {
    it('should reject empty blob', async () => {
      const emptyBlob = createEmptyBlob();
      
      const result = await validateAudioBlob(emptyBlob);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Empty audio file');
      expect(result.size).toBe(0);
    });

    it('should reject blob with invalid MIME type', async () => {
      const invalidBlob = createInvalidMimeTypeBlob();
      
      const result = await validateAudioBlob(invalidBlob);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unsupported MIME type: application/pdf. Supported: WebM, MP4, MPEG, WAV, OGG');
      expect(result.type).toBe('application/pdf');
    });

    it('should reject blob that is too small', async () => {
      const tooSmallBlob = createTooSmallBlob();
      
      const result = await validateAudioBlob(tooSmallBlob);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Audio file too small, likely missing header');
      expect(result.size).toBeLessThan(200);
    });

    it('should reject WebM blob with corrupted header', async () => {
      const corruptedBlob = createCorruptedWebMBlob();
      
      const result = await validateAudioBlob(corruptedBlob);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid WebM header signature');
      expect(result.type).toBe('audio/webm');
    });

    it('should reject null or undefined blob', async () => {
      const result = await validateAudioBlob(null as unknown as Blob);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Empty audio file');
      expect(result.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle WebM blob with insufficient header size', async () => {
      const tinyHeader = new Uint8Array([0x1A, 0x45]); // Only 2 bytes
      const blob = new Blob([tinyHeader], { type: 'audio/webm' });
      
      const result = await validateAudioBlob(blob);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Audio file too small, likely missing header');
    });

    it('should handle WebM blob with partial header', async () => {
      const partialHeader = new Uint8Array([
        0x1A, 0x45, 0xDF, // Only 3 bytes of header
        ...new Array(250).fill(0x00)
      ]);
      const blob = new Blob([partialHeader], { type: 'audio/webm' });
      
      const result = await validateAudioBlob(blob);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid WebM header signature');
    });

    it('should handle MIME type variations correctly', async () => {
      const validData = new Uint8Array([
        0x1A, 0x45, 0xDF, 0xA3,
        ...new Array(300).fill(0x00)
      ]);
      const blob = new Blob([validData], { type: 'audio/webm;codecs=vorbis' });
      
      const result = await validateAudioBlob(blob);
      
      expect(result.valid).toBe(true);
      expect(result.type).toBe('audio/webm;codecs=vorbis');
    });

    it('should handle validation errors gracefully', async () => {
      // Create a blob that will cause an error during processing
      const blob = {
        size: 1000,
        type: 'audio/webm',
        arrayBuffer: () => Promise.reject(new Error('Test error'))
      } as Blob;
      
      const result = await validateAudioBlob(blob);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Validation error: Test error');
    });
  });

  describe('Return Value Structure', () => {
    it('should return complete metadata for valid blob', async () => {
      const validBlob = createValidWebMBlob();
      
      const result = await validateAudioBlob(validBlob);
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('type');
      expect(result.error).toBeUndefined();
      expect(typeof result.valid).toBe('boolean');
      expect(typeof result.size).toBe('number');
      expect(typeof result.type).toBe('string');
    });

    it('should return complete metadata for invalid blob', async () => {
      const invalidBlob = createEmptyBlob();
      
      const result = await validateAudioBlob(invalidBlob);
      
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('type');
      expect(typeof result.valid).toBe('boolean');
      expect(typeof result.error).toBe('string');
      expect(typeof result.size).toBe('number');
    });
  });
}); 