import { supabase } from '@/integrations/supabase/client';

export interface SavedWord {
  id: string;
  user_id: string;
  word: string;
  definition: string | null;
  example_sentence: string | null;
  pronunciation: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  word_type: string | null;
  source_context: any;
  is_mastered: boolean;
  review_count: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WordReviewSession {
  id: string;
  user_id: string;
  saved_word_id: string;
  review_type: 'recognition' | 'recall' | 'pronunciation' | 'usage';
  success_rate: number;
  next_review_date: string | null;
  review_interval_days: number;
  created_at: string;
}

export const wordService = {
  // Save a new word
  async saveWord(
    userId: string,
    word: string,
    definition?: string,
    exampleSentence?: string,
    pronunciation?: string,
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced',
    wordType?: string,
    sourceContext?: any
  ): Promise<{ success: boolean; error?: string; word?: SavedWord }> {
    try {
      const { data, error } = await supabase
        .from('saved_words')
        .insert({
          user_id: userId,
          word: word.toLowerCase().trim(),
          definition,
          example_sentence: exampleSentence,
          pronunciation,
          difficulty_level: difficultyLevel,
          word_type: wordType,
          source_context: sourceContext || {}
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate word error
        if (error.code === '23505') {
          return { success: false, error: 'Word already saved' };
        }
        throw error;
      }

      return { success: true, word: data };
    } catch (error) {
      console.error('Error saving word:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save word' 
      };
    }
  },

  // Get user's saved words
  async getUserWords(
    userId: string,
    limit?: number,
    offset?: number,
    masteredOnly?: boolean
  ): Promise<SavedWord[]> {
    try {
      let query = supabase
        .from('saved_words')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (masteredOnly !== undefined) {
        query = query.eq('is_mastered', masteredOnly);
      }

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user words:', error);
      return [];
    }
  },

  // Mark word as mastered/unmastered
  async toggleWordMastery(wordId: string, ismastered: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_words')
        .update({ 
          is_mastered: ismastered,
          updated_at: new Date().toISOString()
        })
        .eq('id', wordId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating word mastery:', error);
      return false;
    }
  },

  // Delete a saved word
  async deleteWord(wordId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_words')
        .delete()
        .eq('id', wordId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting word:', error);
      return false;
    }
  },

  // Get word count for user
  async getUserWordCount(userId: string, masteredOnly?: boolean): Promise<number> {
    try {
      let query = supabase
        .from('saved_words')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (masteredOnly !== undefined) {
        query = query.eq('is_mastered', masteredOnly);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting word count:', error);
      return 0;
    }
  },

  // Record a word review session
  async recordReview(
    userId: string,
    wordId: string,
    reviewType: 'recognition' | 'recall' | 'pronunciation' | 'usage',
    successRate: number
  ): Promise<boolean> {
    try {
      // Calculate next review date based on success rate
      const intervalDays = successRate >= 0.8 ? 7 : successRate >= 0.6 ? 3 : 1;
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

      const { error } = await supabase
        .from('word_review_sessions')
        .insert({
          user_id: userId,
          saved_word_id: wordId,
          review_type: reviewType,
          success_rate: successRate,
          next_review_date: nextReviewDate.toISOString().split('T')[0],
          review_interval_days: intervalDays
        });

      if (error) throw error;

      // Update word review count
      await supabase
        .rpc('increment_review_count', { word_id: wordId });

      return true;
    } catch (error) {
      console.error('Error recording review:', error);
      return false;
    }
  },

  // Get words due for review
  async getWordsForReview(userId: string, limit: number = 10): Promise<SavedWord[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('saved_words')
        .select(`
          *,
          word_review_sessions!inner(next_review_date)
        `)
        .eq('user_id', userId)
        .eq('is_mastered', false)
        .lte('word_review_sessions.next_review_date', today)
        .limit(limit)
        .order('word_review_sessions.next_review_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting words for review:', error);
      return [];
    }
  },

  // Search saved words
  async searchWords(userId: string, searchTerm: string): Promise<SavedWord[]> {
    try {
      const { data, error } = await supabase
        .from('saved_words')
        .select('*')
        .eq('user_id', userId)
        .or(`word.ilike.%${searchTerm}%,definition.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching words:', error);
      return [];
    }
  }
};