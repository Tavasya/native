import PronunciationMistake from '@/components/PronunciationMistake';
import FeedbackItem from '@/components/FeedbackItem';
import { Badge } from '@/components/ui/badge';

const PronunciationPage = () => {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-center mb-2">Pronunciation</h2>
        <p className="text-gray-500 text-center">Analysis of your pronunciation accuracy and clarity</p>
      </div>
      
      <div className="space-y-6">
        <FeedbackItem 
          title="Overall Assessment" 
          content="Your pronunciation is generally clear, with an excellent command of English vowel sounds. Focus on the specific sound patterns highlighted below to further enhance your clarity."
          score={95}
        />
        
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-medium text-lg text-brand-dark mb-4">Common Mistakes</h3>
          
          <div className="space-y-4">
            <PronunciationMistake 
              word="comfortable" 
              pronunciation="/ˈkʌmf.tə.bəl/" 
              mistake="Often pronounced as /ˈkʌm.fɔːr.tə.bəl/"
              tip="The 'or' sound is actually reduced - try saying 'kumf-tuh-bul'"
              audioSample="comfortable-correct.mp3"
            />
            
            <PronunciationMistake 
              word="vegetable" 
              pronunciation="/ˈvedʒ.tə.bəl/" 
              mistake="Often pronounced as /ˈvedʒ.ə.tə.bəl/"
              tip="The middle syllable is often dropped in native speech - try saying 'vej-tuh-bul'"
              audioSample="vegetable-correct.mp3"
            />
            
            <PronunciationMistake 
              word="probably" 
              pronunciation="/ˈprɒb.ə.bli/" 
              mistake="Often pronounced as /ˈprɒb.ə.bə.li/"
              tip="The word has three syllables, not four - try saying 'prob-uh-blee'"
              audioSample="probably-correct.mp3"
            />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="font-medium text-lg text-brand-dark mb-4">Sound Pattern Analysis</h3>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge className="bg-brand-lightBlue text-brand-blue">TH Sounds</Badge>
              <Badge className="bg-amber-100 text-amber-700">R vs L</Badge>
              <Badge className="bg-emerald-100 text-emerald-700">Word Stress</Badge>
            </div>
            
            <p className="text-gray-600 mb-4">Your primary challenge appears to be with the "TH" sound distinction between voiced (/ð/ as in "this") and voiceless (/θ/ as in "think").</p>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-sm mb-2">Recommended Practice:</h4>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                <li>Practice minimal pairs: "think/sink", "thing/sing", "thick/sick"</li>
                <li>Place your tongue between your teeth for true "TH" sounds</li>
                <li>Record yourself reading passages with many "TH" sounds</li>
              </ul>
            </div>
          </div>
        </div>
        
        <FeedbackItem 
          title="Improvement Tips" 
          content="1. Listen to native speakers and imitate their rhythm and intonation patterns\n2. Record yourself speaking and compare with native pronunciation\n3. Practice word stress patterns in multi-syllable words\n4. Use pronunciation apps that provide visual feedback"
        />
      </div>
    </div>
  );
};

export default PronunciationPage;
