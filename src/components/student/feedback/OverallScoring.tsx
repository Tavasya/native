import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
}

const getScoreColor = (score: number | null) => {
  if (score === null) return "text-gray-400";
  if (score >= 90) return "text-green-500";
  if (score >= 80) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 60) return "text-orange-400";
  if (score >= 50) return "text-orange-500";
  return "text-red-400";
};

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
}: OverallScoringProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Overall Assignment Scoring</h3>
        {canEdit ? (
          <div className="flex items-center gap-4">
            {/* Overall Grade Input - Only shown when autograde is disabled */}
            {!isAutoGradeEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Overall Grade:</span>
                {isEditing ? (
                  <div className={cn(
                    "bg-gray-50 px-3 py-1 rounded-md transition-all duration-200 w-20"
                  )}>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={tempScores.overall_grade ?? ''}
                      onChange={(e) => onScoreChange('overall_grade', e.target.value ? parseInt(e.target.value) : null)}
                      className={`text-base font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(tempScores.overall_grade ?? null)}`}
                      placeholder="Grade"
                    />
                  </div>
                ) : (
                  <div className={`text-base font-bold ${getScoreColor(scores.overall_grade ?? null)}`}>
                    {scores.overall_grade ?? 'Not graded'}
                  </div>
                )}
              </div>
            )}
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
        ) : (
          // Student view - only show overall grade if it exists
          scores.overall_grade !== undefined && scores.overall_grade !== null && (
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Overall Grade</span>
              <div className="flex items-center gap-1">
                <div className={`text-lg font-bold ${getScoreColor(scores.overall_grade)}`}>
                  {scores.overall_grade}
                </div>
                <span className="text-sm font-medium text-gray-500">%</span>
              </div>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          {isEditing ? (
            <div className={cn(
              "bg-gray-50 px-2 py-1 rounded-md transition-all duration-200 w-16 mx-auto"
            )}>
              <Input
                type="number"
                min="0"
                max="100"
                value={tempScores.avg_fluency_score === null ? 0 : tempScores.avg_fluency_score}
                onChange={(e) => onScoreChange('avg_fluency_score', e.target.value ? parseInt(e.target.value) : null)}
                className={`text-base font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(tempScores.avg_fluency_score)}`}
              />
            </div>
          ) : (
            <div className={`text-base font-bold w-16 mx-auto ${getScoreColor(scores.avg_fluency_score)}`}>
              {scores.avg_fluency_score ?? 0}
            </div>
          )}
          <div className="text-xs text-gray-500">Fluency</div>
        </div>
        <div className="text-center">
          {isEditing ? (
            <div className={cn(
              "bg-gray-50 px-2 py-1 rounded-md transition-all duration-200 w-16 mx-auto"
            )}>
              <Input
                type="number"
                min="0"
                max="100"
                value={tempScores.avg_pronunciation_score === null ? 0 : tempScores.avg_pronunciation_score}
                onChange={(e) => onScoreChange('avg_pronunciation_score', e.target.value ? parseInt(e.target.value) : null)}
                className={`text-base font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(tempScores.avg_pronunciation_score)}`}
              />
            </div>
          ) : (
            <div className={`text-base font-bold w-16 mx-auto ${getScoreColor(scores.avg_pronunciation_score)}`}>
              {scores.avg_pronunciation_score ?? 0}
            </div>
          )}
          <div className="text-xs text-gray-500">Pronunciation</div>
        </div>
        <div className="text-center">
          {isEditing ? (
            <div className={cn(
              "bg-gray-50 px-2 py-1 rounded-md transition-all duration-200 w-16 mx-auto"
            )}>
              <Input
                type="number"
                min="0"
                max="100"
                value={tempScores.avg_grammar_score === null ? 0 : tempScores.avg_grammar_score}
                onChange={(e) => onScoreChange('avg_grammar_score', e.target.value ? parseInt(e.target.value) : null)}
                className={`text-base font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(tempScores.avg_grammar_score)}`}
              />
            </div>
          ) : (
            <div className={`text-base font-bold w-16 mx-auto ${getScoreColor(scores.avg_grammar_score)}`}>
              {scores.avg_grammar_score ?? 0}
            </div>
          )}
          <div className="text-xs text-gray-500">Grammar</div>
        </div>
        <div className="text-center">
          {isEditing ? (
            <div className={cn(
              "bg-gray-50 px-2 py-1 rounded-md transition-all duration-200 w-16 mx-auto"
            )}>
              <Input
                type="number"
                min="0"
                max="100"
                value={tempScores.avg_lexical_score === null ? 0 : tempScores.avg_lexical_score}
                onChange={(e) => onScoreChange('avg_lexical_score', e.target.value ? parseInt(e.target.value) : null)}
                className={`text-base font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${getScoreColor(tempScores.avg_lexical_score)}`}
              />
            </div>
          ) : (
            <div className={`text-base font-bold w-16 mx-auto ${getScoreColor(scores.avg_lexical_score)}`}>
              {scores.avg_lexical_score ?? 0}
            </div>
          )}
          <div className="text-xs text-gray-500">Vocabulary</div>
        </div>
      </div>
      <Separator className="my-6" />
    </div>
  );
};

export default OverallScoring; 