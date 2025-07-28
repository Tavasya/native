import { cn } from '../../src/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-200');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-200');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('should handle conflicting Tailwind classes', () => {
    // twMerge should resolve conflicts, keeping the last one
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle undefined and null values', () => {
    const result = cn('valid-class', undefined, null, 'another-class');
    expect(result).toContain('valid-class');
    expect(result).toContain('another-class');
  });
}); 