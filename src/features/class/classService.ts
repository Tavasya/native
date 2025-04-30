import { Class, CreateClassDto } from './types';
import { supabase } from '@/integrations/supabase/client';

export const classService = {

  async createClass(classData: CreateClassDto): Promise<Class> {
    const { data, error } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async getClassesByTeacher(teacherId: string): Promise<Class[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async getClassesByStudent(studentId: string): Promise<Class[]> {
    const { data, error } = await supabase
      .from('students_classes')
      .select('class_id, classes(*)') //joins class statble and student table
      .eq('student_id', studentId);

    if (error) {
      throw new Error(error.message);
    }

    return data.map((row: any) => row.classes);
  },

  async getClassById(id: string): Promise<Class> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id) //filters result to show only rows where id matches the provided id
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};