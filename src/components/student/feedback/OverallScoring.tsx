import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getScoreColor } from "@/utils/feedback/scoreUtils";
import IELTSScoreDisplay from './IELTSScoreDisplay';

interface Score {
  avg_fluency_score: number | null;
  avg_grammar_score: number | null;
  avg_lexical_score: number | null;
  avg_pronunciation_score: number | null;
  overall_grade?: number | null;
}

interface OverallScoringProps {
  scores: Score;
  tempScores: Score;
  isEditing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onScoreChange: (field: keyof Score, value: number | null) => void;
  isAutoGradeEnabled?: boolean;
  isTest?: boolean;
}

const OverallScoring = ({
  scores,
  tempScores,
  isEditing,
  canEdit,
  onEdit,
  onSave,
  onCancel,
  onScoreChange,
  isAutoGradeEnabled = true,
  isTest = false,
}: OverallScoringProps) => {
  // Check if there's a grade available
  const hasGrade = scores.overall_grade !== null && scores.overall_grade !== undefined;
  
  // Control flags for display logic - easy to toggle features
  const showIELTSScore = false; // Set to true to re-enable IELTS display
  const alwaysShowOverallScoring = true; // Set to false to hide when there's a grade

  return (
    <div className="mb-6">
      {/* IELTS Score Display - controlled by showIELTSScore flag */}
      {showIELTSScore && hasGrade && (
        <IELTSScoreDisplay grade={scores.overall_grade} />
      )}

      {/* Individual Scoring Sections - show based on flags */}
      {(alwaysShowOverallScoring || !hasGrade || isEditing) && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Overall Assignment Scoring</h3>
            {canEdit && (
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSave}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onEdit}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              {isEditing ? (
                <div className={cn(
                  "bg-gray-50 px-2 py-1 rounded-md transition-all duration-200 w-16 mx-auto",
                  isTest && "ring-2 ring-orange-500"
                )}>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={tempScores.avg_fluency_score === null ? 0 : tempScores.avg_fluency_score}
                    onChange={(e) => onScoreChange('avg_fluency_score', e.target.value ? parseInt(e.target.value) : null)}
                    className={`text-base font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(tempScores.avg_fluency_score, isTest)}`}
                  />
                </div>
              ) : (
                <div className={cn(
                  "text-base font-bold w-16 mx-auto",
                  isTest && "ring-2 ring-orange-500 rounded-md p-1"
                )}>
                  <div className={getScoreColor(scores.avg_fluency_score, isTest)}>
                    {scores.avg_fluency_score ?? 0}
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-500">Fluency</div>
            </div>
            <div className="text-center">
              {isEditing ? (
                <div className={cn(
                  "bg-gray-50 px-2 py-1 rounded-md transition-all duration-200 w-16 mx-auto",
                  isTest && "ring-2 ring-orange-500"
                )}>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={tempScores.avg_pronunciation_score === null ? 0 : tempScores.avg_pronunciation_score}
                    onChange={(e) => onScoreChange('avg_pronunciation_score', e.target.value ? parseInt(e.target.value) : null)}
                    className={`text-base font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(tempScores.avg_pronunciation_score, isTest)}`}
                  />
                </div>
              ) : (
                <div className={cn(
                  "text-base font-bold w-16 mx-auto",
                  isTest && "ring-2 ring-orange-500 rounded-md p-1"
                )}>
                  <div className={getScoreColor(scores.avg_pronunciation_score, isTest)}>
                    {scores.avg_pronunciation_score ?? 0}
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-500">Pronunciation</div>
            </div>
            <div className="text-center">
              {isEditing ? (
                <div className={cn(
                  "bg-gray-50 px-2 py-1 rounded-md transition-all duration-200 w-16 mx-auto",
                  isTest && "ring-2 ring-orange-500"
                )}>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={tempScores.avg_grammar_score === null ? 0 : tempScores.avg_grammar_score}
                    onChange={(e) => onScoreChange('avg_grammar_score', e.target.value ? parseInt(e.target.value) : null)}
                    className={`text-base font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(tempScores.avg_grammar_score, isTest)}`}
                  />
                </div>
              ) : (
                <div className={cn(
                  "text-base font-bold w-16 mx-auto",
                  isTest && "ring-2 ring-orange-500 rounded-md p-1"
                )}>
                  <div className={getScoreColor(scores.avg_grammar_score, isTest)}>
                    {scores.avg_grammar_score ?? 0}
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-500">Grammar</div>
            </div>
            <div className="text-center">
              {isEditing ? (
                <div className={cn(
                  "bg-gray-50 px-2 py-1 rounded-md transition-all duration-200 w-16 mx-auto",
                  isTest && "ring-2 ring-orange-500"
                )}>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={tempScores.avg_lexical_score === null ? 0 : tempScores.avg_lexical_score}
                    onChange={(e) => onScoreChange('avg_lexical_score', e.target.value ? parseInt(e.target.value) : null)}
                    className={`text-base font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(tempScores.avg_lexical_score, isTest)}`}
                  />
                </div>
              ) : (
                <div className={cn(
                  "text-base font-bold w-16 mx-auto",
                  isTest && "ring-2 ring-orange-500 rounded-md p-1"
                )}>
                  <div className={getScoreColor(scores.avg_lexical_score, isTest)}>
                    {scores.avg_lexical_score ?? 0}
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-500">Vocabulary</div>
            </div>
          </div>
        </>
      )}
      <Separator className="my-4" />
    </div>
  );
};

export default OverallScoring; 