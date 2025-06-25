import { PracticeRequest, PracticeResponse } from './practiceTypes';

const OPENAI_API_KEY = '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'
export const practiceService = {
  async testApiKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Key Test Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        return false;
      }

      const data = await response.json();
      console.log('Available models:', data.data.map((model: any) => model.id));
      return true;
    } catch (error) {
      console.error('API Key test failed:', error);
      return false;
    }
  },

  async improveTranscript(request: PracticeRequest): Promise<PracticeResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert English language tutor. Your task is to improve a transcript by +${request.targetBandIncrease}.0 band level. 

Instructions:
1. Improve the transcript to be more sophisticated, fluent, and natural
2. Use more advanced vocabulary and grammar structures
3. Maintain the same meaning and context
4. Keep the character count similar to the original (within 10% difference)
5. Highlight ONLY the most essential and useful vocabulary words/phrases that students should actively learn and remember
6. Be selective - only highlight 5-10 key words/phrases that are truly valuable for future use
7. Format your response exactly as specified

Response format:
This is an improved version band +${request.targetBandIncrease}.0

Highlight any words/phrases that you would want to remember in the future.

[IMPROVED_SCRIPT]
[improved transcript here]

[HIGHLIGHTED_WORDS]
[comma-separated list of ONLY the most essential 5-10 words/phrases]`
            },
            {
              role: 'user',
              content: `Please improve this transcript by +${request.targetBandIncrease}.0 band level:

${request.transcript}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse the response to extract improved transcript and highlighted words
      const improvedScriptMatch = content.match(/\[IMPROVED_SCRIPT\]\n([\s\S]*?)(?=\n\[HIGHLIGHTED_WORDS\]|$)/);
      const highlightedWordsMatch = content.match(/\[HIGHLIGHTED_WORDS\]\n([\s\S]*?)$/);

      const improvedTranscript = improvedScriptMatch ? improvedScriptMatch[1].trim() : content;
      const highlightedWordsText = highlightedWordsMatch ? highlightedWordsMatch[1].trim() : '';
      const highlightedWords = highlightedWordsText.split(',').map((word: string) => word.trim()).filter((word: string) => word.length > 0);

      return {
        improvedTranscript,
        highlightedWords,
        originalTranscript: request.transcript,
        bandIncrease: request.targetBandIncrease,
      };
    } catch (error) {
      console.error('Error improving transcript:', error);
      throw new Error('Failed to improve transcript');
    }
  },
}; 