export const highlightText = (text: string, highlightedWords: string[]): string => {
  let highlightedText = text;
  
  // Sort words by length (longest first) to avoid partial matches
  const sortedWords = [...highlightedWords].sort((a, b) => b.length - a.length);
  
  sortedWords.forEach(word => {
    // Escape special regex characters and create a word boundary pattern
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundaries to match whole words only
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<mark class="bg-yellow-200 px-1 rounded font-medium">${word}</mark>`);
  });
  
  return highlightedText;
};

export const extractHighlightedWords = (text: string): string[] => {
  const words = text.split(/\s+/);
  const highlightedWords: string[] = [];
  
  // This is a simple heuristic - in practice, the GPT response will provide the highlighted words
  // For now, we'll return an empty array and let the GPT response handle it
  return highlightedWords;
}; 