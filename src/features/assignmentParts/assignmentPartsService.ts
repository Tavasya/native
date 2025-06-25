import { supabase } from '@/integrations/supabase/client';
import { 
  AssignmentPart, 
  PartCombination, 
  CreateAssignmentPartDto, 
  CreatePartCombinationDto,
  PartFilterOptions 
} from './types';

export const assignmentPartsService = {
  /* ------------------------------------------------------------------ *
   *  Assignment Parts CRUD
   * ------------------------------------------------------------------ */
  async createPart(dto: CreateAssignmentPartDto): Promise<AssignmentPart> {
    const { data, error } = await supabase
      .from('assignment_parts')
      .insert([dto])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as AssignmentPart;
  },

  async getParts(filters?: PartFilterOptions): Promise<AssignmentPart[]> {
    let query = supabase
      .from('assignment_parts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.topic) {
      query = query.eq('topic', filters.topic);
    }
    if (filters?.part_type) {
      query = query.eq('part_type', filters.part_type);
    }
    if (filters?.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level);
    }
    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as AssignmentPart[];
  },

  async getPartById(id: string): Promise<AssignmentPart> {
    const { data, error } = await supabase
      .from('assignment_parts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data as AssignmentPart;
  },

  async updatePart(id: string, updates: Partial<CreateAssignmentPartDto>): Promise<AssignmentPart> {
    const { data, error } = await supabase
      .from('assignment_parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as AssignmentPart;
  },

  async deletePart(id: string): Promise<void> {
    const { error } = await supabase
      .from('assignment_parts')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  async incrementUsageCount(id: string): Promise<void> {
    const { error } = await supabase
      .from('assignment_parts')
      .update({ usage_count: supabase.rpc('increment') })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  /* ------------------------------------------------------------------ *
   *  Part Combinations CRUD
   * ------------------------------------------------------------------ */
  async createCombination(dto: CreatePartCombinationDto): Promise<PartCombination> {
    const { data, error } = await supabase
      .from('part_combinations')
      .insert([dto])
      .select(`
        *,
        part2:assignment_parts!part_combinations_part2_id_fkey(*),
        part3:assignment_parts!part_combinations_part3_id_fkey(*)
      `)
      .single();
    
    if (error) throw new Error(error.message);
    return data as PartCombination;
  },

  async getCombinations(filters?: PartFilterOptions): Promise<PartCombination[]> {
    let query = supabase
      .from('part_combinations')
      .select(`
        *,
        part2:assignment_parts!part_combinations_part2_id_fkey(*),
        part3:assignment_parts!part_combinations_part3_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.topic) {
      query = query.eq('topic', filters.topic);
    }
    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as PartCombination[];
  },

  async getCombinationById(id: string): Promise<PartCombination> {
    const { data, error } = await supabase
      .from('part_combinations')
      .select(`
        *,
        part2:assignment_parts!part_combinations_part2_id_fkey(*),
        part3:assignment_parts!part_combinations_part3_id_fkey(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data as PartCombination;
  },

  async updateCombination(id: string, updates: Partial<CreatePartCombinationDto>): Promise<PartCombination> {
    const { data, error } = await supabase
      .from('part_combinations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        part2:assignment_parts!part_combinations_part2_id_fkey(*),
        part3:assignment_parts!part_combinations_part3_id_fkey(*)
      `)
      .single();
    
    if (error) throw new Error(error.message);
    return data as PartCombination;
  },

  async deleteCombination(id: string): Promise<void> {
    const { error } = await supabase
      .from('part_combinations')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  async incrementCombinationUsageCount(id: string): Promise<void> {
    const { error } = await supabase
      .from('part_combinations')
      .update({ usage_count: supabase.rpc('increment') })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  },

  /* ------------------------------------------------------------------ *
   *  Utility Functions
   * ------------------------------------------------------------------ */
  async getTopics(): Promise<string[]> {
    const { data, error } = await supabase
      .from('assignment_parts')
      .select('topic')
      .not('topic', 'is', null)
      .order('topic');
    
    if (error) throw new Error(error.message);
    
    // Extract unique topics
    const topics = [...new Set(data.map(item => item.topic))];
    return topics;
  },

  async getPublicParts(): Promise<AssignmentPart[]> {
    return this.getParts({ is_public: true });
  },

  async getUserParts(userId: string): Promise<AssignmentPart[]> {
    return this.getParts({ created_by: userId });
  },

  async getPublicCombinations(): Promise<PartCombination[]> {
    return this.getCombinations({ is_public: true });
  },

  async getUserCombinations(userId: string): Promise<PartCombination[]> {
    return this.getCombinations({ created_by: userId });
  }
}; 