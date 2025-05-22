interface FeedbackItemProps {
  title: string;
  content: string;
  score?: number;
}

const FeedbackItem = ({ title, content, score }: FeedbackItemProps) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-lg text-brand-dark">{title}</h3>
        {score !== undefined && (
          <span className="bg-brand-lightBlue text-brand-blue px-3 py-1 rounded-full text-sm font-medium">
            Score: {score}
          </span>
        )}
      </div>
      <p className="text-gray-600">{content}</p>
    </div>
  );
};

export default FeedbackItem;
