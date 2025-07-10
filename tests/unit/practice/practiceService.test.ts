import { practiceService } from '@/features/practice/practiceService';

global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('practiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('testApiKey', () => {
    it('should return true when health check succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ status: 'healthy' }),
      } as any);

      const result = await practiceService.testApiKey();
      expect(result).toBe(true);
    });

    it('should return false when health check fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Server error'),
      } as any);

      const result = await practiceService.testApiKey();
      expect(result).toBe(false);
    });
  });

  describe('startPractice', () => {
    it('should start practice session successfully', async () => {
      const mockResponse = { success: true, message: 'Practice started' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await practiceService.startPractice('session-123');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when start practice fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad request'),
      } as any);

      await expect(practiceService.startPractice('session-123')).rejects.toThrow('Failed to start practice');
    });
  });

  describe('getSessionStatus', () => {
    it('should get session status successfully', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'transcript_ready',
        user_id: 'user-123'
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: mockSession }),
      } as any);

      const result = await practiceService.getSessionStatus('session-123');
      expect(result).toEqual(mockSession);
    });

    it('should throw error when get status fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not found'),
      } as any);

      await expect(practiceService.getSessionStatus('session-123')).rejects.toThrow('Failed to get session status');
    });
  });
});