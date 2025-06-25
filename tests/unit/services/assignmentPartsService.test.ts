import { assignmentPartsService } from '../../../src/features/assignmentParts/assignmentPartsService';

// Simple mock that just tests the interface
jest.mock('@/integrations/supabase/client', () => {
  const createMockQuery = () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
    single: jest.fn().mockResolvedValue({ data: { id: '1', title: 'Test' }, error: null })
  });

  return {
    supabase: {
      from: jest.fn(() => createMockQuery()),
      rpc: jest.fn(() => 'increment')
    }
  };
});

describe('assignmentPartsService', () => {
  describe('Basic Service Functions', () => {
    it('should create a part', async () => {
      const createDto = {
        title: 'Test Part',
        part_type: 'part1' as const,
        questions: [],
        metadata: { autoGrade: false }
      };

      const result = await assignmentPartsService.createPart(createDto);
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should get parts', async () => {
      const result = await assignmentPartsService.getParts();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get part by id', async () => {
      const result = await assignmentPartsService.getPartById('1');
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should update a part', async () => {
      const result = await assignmentPartsService.updatePart('1', { title: 'Updated' });
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should delete a part', async () => {
      await expect(assignmentPartsService.deletePart('1')).resolves.not.toThrow();
    });

    it('should increment usage count', async () => {
      await expect(assignmentPartsService.incrementUsageCount('1')).resolves.not.toThrow();
    });

    it('should create a combination', async () => {
      const createDto = {
        title: 'Test Combo',
        part2_id: '2',
        part3_id: '3'
      };

      const result = await assignmentPartsService.createCombination(createDto);
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should get combinations', async () => {
      const result = await assignmentPartsService.getCombinations();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get combination by id', async () => {
      const result = await assignmentPartsService.getCombinationById('1');
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });

    it('should get topics', async () => {
      const result = await assignmentPartsService.getTopics();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should have utility functions', () => {
      expect(typeof assignmentPartsService.getPublicParts).toBe('function');
      expect(typeof assignmentPartsService.getUserParts).toBe('function');
      expect(typeof assignmentPartsService.getPublicCombinations).toBe('function');
      expect(typeof assignmentPartsService.getUserCombinations).toBe('function');
    });
  });
});