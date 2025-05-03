//what crud operations are needed
//Create: submissions
//Read: Fetch all submission and single submissions
//update: submissions can be updated with grading and feedback
//Delete : is deletion needed: maybe

import { supabase } from "@/integrations/supabase/client";
import { Submission, CreateSubmissionDto, UpdateSubmissionDto } from "./types";

export const submissionService = {

  // Create new Submission
  async createSubmission(data: CreateSubmissionDto): Promise<Submission> {
    // If attempt is not provided, calculate it based on existing submissions
    if (data.attempt === undefined) {
      const { data: existingSubmissions } = await supabase
        .from("submissions")
        .select("attempt")
        .eq("assignment_id", data.assignment_id)
        .eq("student_id", data.student_id)
        .order("attempt", { ascending: false })
        .limit(1);

      data.attempt = existingSubmissions && existingSubmissions.length > 0 
        ? existingSubmissions[0].attempt + 1 
        : 1;
    }

    const { data: submission, error } = await supabase
      .from("submissions")
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!submission) throw new Error("No submission returned from Supabase.");
    return submission;
  },

  //Fetch all submisions
  async getSubmissionsByAssignmentAndStudent(assignment_id: string, student_id: string): Promise<Submission[]> {
    const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("assignment_id", assignment_id)
        .eq("student_id", student_id)
        .order("attempt", { ascending: false});
    
    if (error) throw new Error(error.message);
    return data;
  },

  //Fetch single submission
  async getSubmissionById(id: string): Promise<Submission> {
    const { data, error } = await supabase
        .from("submissions")
        .select('*')
        .eq("id", id)
        .single();
    if (error) throw new Error(error.message);
    return data;
  },

  
  //Update Submission
  async updateSubmission(id: string, updates: UpdateSubmissionDto): Promise<Submission> {
    const { data, error } = await supabase
        .from("submissions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteSubmission(id: string): Promise<void> {
    const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("id", id);

        if (error) throw new Error(error.message);
  }
};