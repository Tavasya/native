import React from 'react';
import { SectionFeedback } from '../types';
import { Tooltip } from '@mui/material';

interface SubmissionFeedbackProps {
  feedback: SectionFeedback;
}

export const SubmissionFeedback: React.FC<SubmissionFeedbackProps> = ({ feedback }) => {
  const renderGrammarCorrections = () => {
    if (!feedback.grammar_corrections) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold">Grammar Corrections</h4>
        <div className="space-y-2">
          {Object.entries(feedback.grammar_corrections.grammar_corrections).map(([key, correction]) => (
            <Tooltip
              key={key}
              title={
                <div>
                  <p><strong>Original:</strong> {correction.original}</p>
                  {correction.corrections.map((c, idx) => (
                    <div key={idx}>
                      <p><strong>Type:</strong> {c.type}</p>
                      <p><strong>Explanation:</strong> {c.explanation}</p>
                      <p><strong>Suggested:</strong> {c.suggested_correction}</p>
                    </div>
                  ))}
                </div>
              }
            >
              <div className="p-2 bg-gray-100 rounded cursor-help">
                <p className="font-medium">{correction.original}</p>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  };

  const renderLexical = () => {
    if (!feedback.lexical || feedback.grammar_corrections) return null;

    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold">Lexical Feedback</h4>
        <div className="space-y-2">
          {feedback.lexical.issues.map((issue, idx) => (
            <Tooltip
              key={idx}
              title={
                <div>
                  <p><strong>Type:</strong> {issue.type}</p>
                  <p><strong>Sentence:</strong> {issue.sentence}</p>
                  <p><strong>Explanation:</strong> {issue.suggestion.explanation}</p>
                  <p><strong>Suggested:</strong> {issue.suggestion.suggested_phrase}</p>
                </div>
              }
            >
              <div className="p-2 bg-gray-100 rounded cursor-help">
                <p className="font-medium">{issue.sentence}</p>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  };

  const renderVocabulary = () => {
    if (!feedback.vocabulary) return null;

    return (
      <div className="mt-4">
        <h4 className="text-lg font-semibold">Vocabulary Suggestions</h4>
        <div className="space-y-2">
          {Object.entries(feedback.vocabulary.vocabulary_suggestions).map(([key, suggestion]) => (
            <Tooltip
              key={key}
              title={
                <div>
                  <p><strong>Original Word:</strong> {suggestion.original_word}</p>
                  <p><strong>Suggested Word:</strong> {suggestion.suggested_word}</p>
                  <p><strong>Word Type:</strong> {suggestion.word_type}</p>
                  <p><strong>Explanation:</strong> {suggestion.explanation}</p>
                  <p><strong>Examples:</strong> {suggestion.examples.join(', ')}</p>
                  <p><strong>Level Change:</strong> {suggestion.original_level} → {suggestion.suggested_level}</p>
                </div>
              }
            >
              <div className="p-2 bg-gray-100 rounded cursor-help">
                <p className="font-medium">{suggestion.original_word} → {suggestion.suggested_word}</p>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-xl font-bold">Overall Grade: {feedback.grade}</h3>
        <p className="mt-2">{feedback.feedback}</p>
      </div>

      {renderGrammarCorrections()}
      {renderLexical()}
      {renderVocabulary()}

      {feedback.fluency && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold">Fluency</h4>
          <p>Grade: {feedback.fluency.grade}</p>
          {feedback.fluency.wpm && <p>Words per minute: {feedback.fluency.wpm}</p>}
          {feedback.fluency.issues && (
            <ul className="list-disc pl-5">
              {feedback.fluency.issues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {feedback.pronunciation && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold">Pronunciation</h4>
          <p>Grade: {feedback.pronunciation.grade}</p>
          {feedback.pronunciation.issues && (
            <ul className="list-disc pl-5">
              {feedback.pronunciation.issues.map((issue, idx) => (
                <li key={idx}>
                  {issue.type && <span className="font-medium">{issue.type}: </span>}
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}; 