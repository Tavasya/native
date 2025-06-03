import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Score {
  avg_fluency_score: number;
  avg_grammar_score: number;
  avg_lexical_score: number;
  avg_pronunciation_score: number;
}

interface OverallScoringProps {
  scores: Score;
  tempScores: Score;
  isEditing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onScoreChange: (field: keyof Score, value: number) => void;
}

const getScoreColor = (score: number) => {
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
}: OverallScoringProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Overall Assignment Scoring</h3>
        {canEdit && (
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
        )}
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          {isEditing ? (
            <Input
              type="number"
              min="0"
              max="100"
              value={tempScores.avg_fluency_score}
              onChange={(e) => onScoreChange('avg_fluency_score', parseInt(e.target.value) || 0)}
              className={`text-2xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${getScoreColor(tempScores.avg_fluency_score)}`}
            />
          ) : (
            <div className={`text-2xl font-bold mb-1 ${getScoreColor(scores.avg_fluency_score)}`}>
              {scores.avg_fluency_score}
            </div>
          )}
          <div className="text-xs text-gray-500">Fluency</div>
        </div>
        <div className="text-center">
          {isEditing ? (
            <Input
              type="number"
              min="0"
              max="100"
              value={tempScores.avg_pronunciation_score}
              onChange={(e) => onScoreChange('avg_pronunciation_score', parseInt(e.target.value) || 0)}
              className={`text-2xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${getScoreColor(tempScores.avg_pronunciation_score)}`}
            />
          ) : (
            <div className={`text-2xl font-bold mb-1 ${getScoreColor(scores.avg_pronunciation_score)}`}>
              {scores.avg_pronunciation_score}
            </div>
          )}
          <div className="text-xs text-gray-500">Pronunciation</div>
        </div>
        <div className="text-center">
          {isEditing ? (
            <Input
              type="number"
              min="0"
              max="100"
              value={tempScores.avg_grammar_score}
              onChange={(e) => onScoreChange('avg_grammar_score', parseInt(e.target.value) || 0)}
              className={`text-2xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${getScoreColor(tempScores.avg_grammar_score)}`}
            />
          ) : (
            <div className={`text-2xl font-bold mb-1 ${getScoreColor(scores.avg_grammar_score)}`}>
              {scores.avg_grammar_score}
            </div>
          )}
          <div className="text-xs text-gray-500">Grammar</div>
        </div>
        <div className="text-center">
          {isEditing ? (
            <Input
              type="number"
              min="0"
              max="100"
              value={tempScores.avg_lexical_score}
              onChange={(e) => onScoreChange('avg_lexical_score', parseInt(e.target.value) || 0)}
              className={`text-2xl font-bold text-center border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${getScoreColor(tempScores.avg_lexical_score)}`}
            />
          ) : (
            <div className={`text-2xl font-bold mb-1 ${getScoreColor(scores.avg_lexical_score)}`}>
              {scores.avg_lexical_score}
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