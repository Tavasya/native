import { supabase } from '@/integrations/supabase/client';
import { AssignmentTemplate, CreateAssignmentTemplateDto } from './types';

export const assignmentTemplateService = {
  async createTemplate(dto: CreateAssignmentTemplateDto): Promise<AssignmentTemplate> {
    const { data, error } = await supabase
      .from('assignment_templates')
      .insert([dto])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as AssignmentTemplate;
  },

  async getTemplatesByTeacher(teacher_id: string): Promise<AssignmentTemplate[]> {
    const { data, error } = await supabase
      .from('assignment_templates')
      .select('*')
      .eq('teacher_id', teacher_id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as AssignmentTemplate[];
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('assignment_templates')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}; 