
export const transcriptData = {
    Q1: {
      text: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
      scores: {
        overall: 75,
        fluency: 75,
        pronunciation: 80,
        grammar: 85,
        vocabulary: 75
      },
      comment: "Try to vary your tone and pace a bit more to keep your audience fully engaged.",
      mistakes: {
        grammar: [
          { text: "web sites", explanation: "Should be written as one word: 'websites'" },
          { text: "injected humour", explanation: "Consider using 'humor' in American English" }
        ],
        vocabulary: [
          { text: "more-or-less", explanation: "Consider using 'approximately' or 'roughly' for more formal writing" },
          { text: "infancy", explanation: "Great word choice! This means 'early stage of development'" }
        ]
      },
      fluencyAnalysis: {
        speechLengthSeconds: 45,
        wordsPerMinute: 120,
        fillerWords: 3,
        pauseAnalysis: "Good pacing with natural pauses between sentences."
      },
      pronunciationData: [
        { word: "Ipsum", ipa: "/ˈɪpsəm/", correctAudio: 85, studentAudio: 78 },
        { word: "lorem", ipa: "/ˈlɔːrəm/", correctAudio: 92, studentAudio: 85 },
        { word: "readable", ipa: "/ˈriːdəbəl/", correctAudio: 88, studentAudio: 82 },
        { word: "distribution", ipa: "/ˌdɪstrɪˈbjuːʃən/", correctAudio: 78, studentAudio: 70 }
      ]
    },
    Q2: {
      text: "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
      scores: {
        overall: 82,
        fluency: 85,
        pronunciation: 78,
        grammar: 88,
        vocabulary: 80
      },
      comment: "Great improvement in fluency! Continue working on pronunciation clarity.",
      mistakes: {
        grammar: [
          { text: "randomised", explanation: "In American English, use 'randomized' with a 'z'" },
          { text: "middle of text", explanation: "Should be 'middle of the text' - missing article 'the'" }
        ],
        vocabulary: [
          { text: "believable", explanation: "Good choice! Means 'able to be believed; convincing'" },
          { text: "embarrassing", explanation: "Perfect usage - means 'causing shame or awkwardness'" }
        ]
      },
      fluencyAnalysis: {
        speechLengthSeconds: 38,
        wordsPerMinute: 135,
        fillerWords: 1,
        pauseAnalysis: "Excellent flow with minimal hesitation."
      },
      pronunciationData: [
        { word: "variations", ipa: "/ˌveəriˈeɪʃənz/", correctAudio: 80, studentAudio: 75 },
        { word: "available", ipa: "/əˈveɪləbəl/", correctAudio: 85, studentAudio: 82 },
        { word: "embarrassing", ipa: "/ɪmˈbærəsɪŋ/", correctAudio: 75, studentAudio: 68 },
        { word: "believable", ipa: "/bɪˈliːvəbəl/", correctAudio: 88, studentAudio: 85 }
      ]
    },
    Q3: {
      text: "All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable.",
      scores: {
        overall: 88,
        fluency: 90,
        pronunciation: 85,
        grammar: 92,
        vocabulary: 86
      },
      comment: "Excellent progress! Your grammar and vocabulary usage have significantly improved.",
      mistakes: {
        grammar: [
          { text: "a handful of", explanation: "While correct, consider 'several' for more formal writing" }
        ],
        vocabulary: [
          { text: "predefined", explanation: "Excellent word choice! Means 'determined in advance'" },
          { text: "chunks", explanation: "Good informal word, but consider 'segments' or 'portions' for formal writing" }
        ]
      },
      fluencyAnalysis: {
        speechLengthSeconds: 42,
        wordsPerMinute: 145,
        fillerWords: 0,
        pauseAnalysis: "Perfect rhythm and natural speech flow."
      },
      pronunciationData: [
        { word: "generators", ipa: "/ˈdʒenəreɪtərz/", correctAudio: 90, studentAudio: 88 },
        { word: "predefined", ipa: "/ˌpriːdɪˈfaɪnd/", correctAudio: 85, studentAudio: 82 },
        { word: "dictionary", ipa: "/ˈdɪkʃənəri/", correctAudio: 92, studentAudio: 90 },
        { word: "structures", ipa: "/ˈstrʌktʃərz/", correctAudio: 88, studentAudio: 85 }
      ]
    },
    Q4: {
      text: "The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc. This makes it a perfect candidate for demonstrating the visual elements of a document or a typeface without relying on meaningful content.",
      scores: {
        overall: 91,
        fluency: 93,
        pronunciation: 89,
        grammar: 94,
        vocabulary: 88
      },
      comment: "Outstanding performance! You've mastered the key elements of effective communication.",
      mistakes: {
        grammar: [
          { text: "words etc", explanation: "Add a period after 'etc.' or use 'and so on' instead" }
        ],
        vocabulary: [
          { text: "non-characteristic", explanation: "Excellent compound word usage!" },
          { text: "typeface", explanation: "Perfect technical term for font design" }
        ]
      },
      fluencyAnalysis: {
        speechLengthSeconds: 35,
        wordsPerMinute: 155,
        fillerWords: 0,
        pauseAnalysis: "Exceptional fluency with confident delivery."
      },
      pronunciationData: [
        { word: "repetition", ipa: "/ˌrepɪˈtɪʃən/", correctAudio: 95, studentAudio: 92 },
        { word: "characteristic", ipa: "/ˌkærɪktəˈrɪstɪk/", correctAudio: 82, studentAudio: 88 },
        { word: "demonstrating", ipa: "/ˈdemənstreɪtɪŋ/", correctAudio: 90, studentAudio: 87 },
        { word: "typeface", ipa: "/ˈtaɪpfeɪs/", correctAudio: 93, studentAudio: 90 }
      ]
    }
  };
  