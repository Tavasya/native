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
      .select('class_id, classes(*)')
      .eq('student_id', studentId);

    if (error) {
      throw new Error(error.message);
    }

    // The data comes in the format: [{ class_id: string, classes: Class }]
    const classes = data.map((row: any) => {
      return row.classes;
    });

    return classes;
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

    // Check if student is already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('students_classes')
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classData.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(checkError.message);
    }

    // If already enrolled, just return the class data
    if (existingEnrollment) {
      return classData;
    }

    // If not enrolled, add student to class
    const { error: joinError } = await supabase
      .from('students_classes')
      .insert([{
        student_id: studentId,
        class_id: classData.id
      }]);
    
    if (joinError) {
      throw new Error(joinError.message);
    }

    return classData;
  },

  async removeStudentFromClass(studentId: string, classId: string): Promise<void> {
    const { error } = await supabase
      .from('students_classes')
      .delete()
      .eq('student_id', studentId)
      .eq('class_id', classId);

    if (error) {
      throw new Error(error.message);
    }
  },
}