import { Assignment, CreateAssignmentDto } from "./types";
import { supabase } from "@/integrations/supabase/client";

export const assignmentService = {

    async createAssignment(assignmentData: CreateAssignmentDto): Promise<Assignment> {
        // Create assignment
        const { data: assignment, error: assignmentError } = await supabase
            .from('assignments')
            .insert([{
                title: assignmentData.title,
                due_date: assignmentData.due_date,
                class_id: assignmentData.class_id,
                questions: assignmentData.questions,
                topic: assignmentData.topic
            }])
            .select()
            .single();

        if (assignmentError) {
            throw new Error(assignmentError.message);
        }
        return assignment;
    },

    //Fetch Assignment by class
    async getAssignmentByClass(classId: string): Promise<Assignment[]> {
        const { data, error } = await supabase
            .from('assignments')
            .select('*')
            .eq('class_id', classId)
        
        if (error) {
            throw new Error(error.message)
        }
        
        return data;
    },


    //Delete
    async deleteAssignment(assignmentId: string): Promise<void> {
        const {error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', assignmentId);
        
        if (error) {
            throw new Error(error.message);
        }


    }
}