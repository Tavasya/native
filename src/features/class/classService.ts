import { Class, CreateClassDto, ClassStats } from './types';
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

  async getClassStatsByTeacher(teacherId: string): Promise<ClassStats[]> {
    const { data, error } = await supabase
      .from('class_stats')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) {
      throw new Error(error.message);
    };

    return data;
  },

  async deleteClass(classId: string): Promise<void> {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) {
      throw new Error(error.message);
    }
  },


  async joinClass(studentId: string, class_code: string): Promise<Class> {

    //find class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('class_code', class_code)
      .single();
    
    if (classError) {
      throw new Error('Invalid class Code');
    }

    //add student to class
    const { error: joinError } = await supabase
      .from('student_classes')
      .insert([{
        student_id: studentId,
        class_id: classData.id
      }]);
    
    if (joinError) {
      if (joinError.code === '23505') {
        throw new Error('Your are already enrolled in this class');
      }
      throw new Error(joinError.message);
    }

    return classData;

  }
  
}