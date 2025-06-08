import { SectionFeedback } from './types';

export function normalizeSectionFeedback(feedback: any): SectionFeedback {
  if (!feedback) {
    console.log('No feedback provided');
    return { grade: 0, feedback: '' };
  }

  // Log the feedback object to see its structure
  console.log('=== Feedback Version Detection ===');
  console.log('Raw feedback:', JSON.stringify(feedback, null, 2));
  console.log('Report version:', feedback.report_version);
  console.log('Has grammar_corrections:', !!feedback.grammar_corrections);
  console.log('Has vocabulary_suggestions:', !!feedback.vocabulary?.vocabulary_suggestions);
  console.log('Has lexical:', !!feedback.lexical);
  console.log('Has grammar:', !!feedback.grammar);
  console.log('Feedback keys:', Object.keys(feedback));
  console.log('================================');

  // Handle v2 format
  if (feedback.report_version === 'v2' || feedback.grammar_corrections || feedback.vocabulary?.vocabulary_suggestions) {
    console.log('Detected v2 format');
    return {
      grade: feedback.grade || 0,
      feedback: feedback.feedback || '',
      review_status: feedback.review_status,
      audio_url: feedback.audio_url,
      transcript: feedback.transcript,
      pronunciation: feedback.pronunciation,
      grammar_corrections: feedback.grammar_corrections,
      vocabulary: feedback.vocabulary,
      fluency: feedback.fluency
    };
  }

  // Handle v1 format
  console.log('Detected v1 format');
  return {
    grade: feedback.grade || 0,
    feedback: feedback.feedback || '',
    review_status: feedback.review_status,
    audio_url: feedback.audio_url,
    transcript: feedback.transcript,
    pronunciation: feedback.pronunciation,
    grammar: feedback.grammar,
    lexical: feedback.lexical,
    fluency: feedback.fluency
  };
} 