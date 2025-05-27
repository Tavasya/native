import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchSubmissionById } from '@/features/submissions/submissionThunks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const SubmissionFeedback: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const dispatch = useAppDispatch();
  const { selectedSubmission, loading, error } = useAppSelector(state => state.submissions);

  useEffect(() => {
    if (submissionId) {
      console.log('Fetching submission:', submissionId);
      dispatch(fetchSubmissionById(submissionId));
    }
  }, [submissionId, dispatch]);

  useEffect(() => {
    console.log('Selected submission:', selectedSubmission);
  }, [selectedSubmission]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!selectedSubmission) {
    return <div>Submission not found</div>;
  }

  const renderFeedbackSection = (title: string, data: any) => {
    console.log(`Rendering ${title}:`, data);
    if (!data) return null;
    
    const grade = data.grade ?? 0;
    const issues = data.issues || [];

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            <span className="text-2xl font-bold">{grade}%</span>
          </div>
          <Progress value={grade} className="h-2" />
        </CardHeader>
        <CardContent>
          {issues.length > 0 ? (
            <ul className="space-y-2">
              {issues.map((issue: any, index: number) => {
                if (typeof issue === 'string') {
                  return (
                    <li key={index} className="text-sm text-gray-600">
                      {issue}
                    </li>
                  );
                } else if (issue.type === 'word_scores') {
                  return (
                    <div key={index} className="mt-2">
                      <h4 className="text-sm font-medium mb-2">Word-by-Word Analysis</h4>
                      <div className="flex flex-wrap gap-2">
                        {issue.words.map((word: any, wordIndex: number) => (
                          <div
                            key={wordIndex}
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                            title={`Score: ${word.score}%`}
                          >
                            {word.word}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } else if (issue.type === 'suggestion' || issue.type === 'prosody' || issue.type === 'fluency') {
                  return (
                    <li key={index} className="text-sm text-gray-600">
                      {issue.message}
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          ) : (
            <p className="text-sm text-green-600">No issues found. Great job!</p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Check if we have the feedback data in the expected format
  const feedbackData = selectedSubmission.section_feedback;
  console.log('Feedback data:', feedbackData);

  if (!feedbackData || !Array.isArray(feedbackData) || feedbackData.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Submission Feedback</h1>
        <p>No feedback data available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Submission Feedback</h1>
      
      {feedbackData.map((feedback, index) => (
        <div key={index} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Question {feedback.question_id}</h2>
          <div>
            {renderFeedbackSection('Fluency', feedback.section_feedback.fluency)}
            {renderFeedbackSection('Grammar', feedback.section_feedback.grammar)}
            {renderFeedbackSection('Vocabulary', feedback.section_feedback.lexical)}
            {renderFeedbackSection('Pronunciation', feedback.section_feedback.pronunciation)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubmissionFeedback; 