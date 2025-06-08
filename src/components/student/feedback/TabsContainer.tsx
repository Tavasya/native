import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import FluencyAnalysis from '@/components/student/feedback/analysis/FluencyAnalysis';
import PronunciationAnalysis from '@/components/student/feedback/analysis/PronounciationAnalysis';
import GrammarAnalysis from '@/components/student/feedback/analysis/GrammarAnalysis';
import VocabularyAnalysis from '@/components/student/feedback/analysis/VocabularyAnalysis';
import { EditingState, AverageScores, SectionFeedback, QuestionFeedback } from '@/types/feedback';

interface TabsContainerProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  canEdit: boolean;
  isEditing: EditingState;
  onEditSection: (section: keyof EditingState) => void;
  onSaveSection: (section: keyof EditingState) => void;
  onCancelSection: (section: keyof EditingState) => void;
  currentFeedback: SectionFeedback | null;
  tempFeedback: SectionFeedback | null;
  currentQuestion: QuestionFeedback | null;
  averageScores: AverageScores;
  audioRef: React.RefObject<HTMLAudioElement>;
  ttsAudioCache: any;
  ttsLoading: any;
  dispatch: any;
  grammarOpen: { [key: string]: boolean };
  vocabularyOpen: { [key: string]: boolean };
  onToggleGrammar: (key: string) => void;
  onToggleVocabulary: (key: string) => void;
  onDeleteIssue: (section: 'pronunciation' | 'grammar' | 'lexical', index: number) => void;
}

const TabsContainer: React.FC<TabsContainerProps> = ({
  activeTab,
  onTabChange,
  canEdit,
  isEditing,
  onEditSection,
  onSaveSection,
  onCancelSection,
  currentFeedback,
  tempFeedback,
  averageScores,
  audioRef,
  ttsAudioCache,
  ttsLoading,
  dispatch,
  grammarOpen,
  vocabularyOpen,
  onToggleGrammar,
  onToggleVocabulary,
  onDeleteIssue,
}) => {
  const renderEditButtons = (section: keyof EditingState) => {
    if (!canEdit) return null;
    
    return (
      <div className="flex gap-2">
        {isEditing[section] ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSaveSection(section)}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancelSection(section)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditSection(section)}
          >
            Edit
          </Button>
        )}
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-primary/10">
        <TabsTrigger value="fluency" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Fluency
        </TabsTrigger>
        <TabsTrigger value="pronunciation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Pronunciation
        </TabsTrigger>
        <TabsTrigger value="grammar" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Grammar
        </TabsTrigger>
        <TabsTrigger value="vocabulary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Vocabulary
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="fluency" className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium text-gray-900">Fluency Analysis</h4>
            {isEditing.fluency && (
              <span className="text-sm text-primary font-medium">(Editing)</span>
            )}
          </div>
          {renderEditButtons('fluency')}
        </div>
        <FluencyAnalysis
          currentFeedback={currentFeedback}
          averageScores={averageScores}
          isEditing={isEditing.fluency}
        />
      </TabsContent>

      <TabsContent value="pronunciation" className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium text-gray-900">Pronunciation Analysis</h4>
            {isEditing.pronunciation && (
              <span className="text-sm text-primary font-medium">(Editing)</span>
            )}
          </div>
          {renderEditButtons('pronunciation')}
        </div>
        <PronunciationAnalysis
          currentFeedback={currentFeedback}
          tempFeedback={tempFeedback}
          isEditing={isEditing.pronunciation}
          audioRef={audioRef}
          ttsAudioCache={ttsAudioCache}
          ttsLoading={ttsLoading}
          dispatch={dispatch}
          onDeleteIssue={onDeleteIssue}
        />
      </TabsContent>

      <TabsContent value="grammar" className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium text-gray-900">Grammar Analysis</h4>
            {isEditing.grammar && (
              <span className="text-sm text-primary font-medium">(Editing)</span>
            )}
          </div>
          {renderEditButtons('grammar')}
        </div>
        <GrammarAnalysis
          currentFeedback={currentFeedback}
          tempFeedback={tempFeedback}
          isEditing={isEditing.grammar}
          grammarOpen={grammarOpen}
          onToggleGrammar={onToggleGrammar}
          onDeleteIssue={onDeleteIssue}
        />
      </TabsContent>

      <TabsContent value="vocabulary" className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium text-gray-900">Vocabulary Analysis</h4>
            {isEditing.vocabulary && (
              <span className="text-sm text-primary font-medium">(Editing)</span>
            )}
          </div>
          {renderEditButtons('vocabulary')}
        </div>
        <VocabularyAnalysis
          currentFeedback={currentFeedback}
          tempFeedback={tempFeedback}
          isEditing={isEditing.vocabulary}
          vocabularyOpen={vocabularyOpen}
          onToggleVocabulary={onToggleVocabulary}
          onDeleteIssue={onDeleteIssue}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TabsContainer;