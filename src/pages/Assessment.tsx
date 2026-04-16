import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVoice } from '../contexts/VoiceContext';
import { useUser } from '../contexts/UserContext';
import { 
  Mic, MicOff, Volume2, ArrowLeft, CheckCircle, XCircle, 
  Star, Trophy, RotateCcw, Play, Pause, BookOpen
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'open-ended' | 'true-false';
  options?: string[];
  correctAnswer?: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

const Assessment: React.FC = () => {
  const { subject, chapter } = useParams<{ subject: string; chapter: string }>();
  const navigate = useNavigate();
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak } = useVoice();
  const { user, updateProgress } = useUser();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAssessmentStarted, setIsAssessmentStarted] = useState(false);
  const [isAssessmentCompleted, setIsAssessmentCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<{
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    timeSpent: string;
  } | null>(null);

  // Mock assessment questions - in real app, this would come from curriculum API
  const mockQuestions: { [key: string]: { [key: string]: Question[] } } = {
    'Science': {
      'Chapter-4': [
        {
          id: 'q1',
          question: 'What is the main purpose of photosynthesis in plants?',
          type: 'multiple-choice',
          options: [
            'To produce oxygen for animals',
            'To make food using sunlight, water, and carbon dioxide',
            'To absorb nutrients from soil',
            'To grow taller'
          ],
          correctAnswer: 'To make food using sunlight, water, and carbon dioxide',
          explanation: 'Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose (food) and oxygen.',
        },
        {
          id: 'q2',
          question: 'Who conducted the famous bell jar experiment with a candle, mouse, and mint plant?',
          type: 'multiple-choice',
          options: ['Jan Ingenhousz', 'Joseph Priestley', 'Antoine Lavoisier', 'Robert Hooke'],
          correctAnswer: 'Joseph Priestley',
          explanation: 'Joseph Priestley conducted this experiment in 1770 to demonstrate that plants can restore air that has been "damaged" by burning candles or breathing animals.',
        },
        {
          id: 'q3',
          question: 'True or False: Plants only produce oxygen during the day when there is sunlight.',
          type: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'Plants only produce oxygen during photosynthesis, which requires sunlight. At night, plants consume oxygen for respiration.',
        },
        {
          id: 'q4',
          question: 'Explain what happened in Priestley\'s experiment when he added a mint plant to the bell jar with a candle and mouse.',
          type: 'open-ended',
          explanation: 'When Priestley added a mint plant to the bell jar containing a candle and mouse, the plant was able to restore the air by producing oxygen through photosynthesis. This allowed the candle to continue burning and the mouse to survive, demonstrating that plants can purify air.',
        },
        {
          id: 'q5',
          question: 'What did Jan Ingenhousz discover about the relationship between sunlight and plant oxygen production?',
          type: 'open-ended',
          explanation: 'Jan Ingenhousz discovered that sunlight is essential for plants to produce oxygen. He showed that green parts of plants release oxygen bubbles in bright sunlight but not in darkness, proving that light is necessary for photosynthesis.',
        },
      ],
    },
  };

  useEffect(() => {
    if (subject && chapter) {
      const chapterQuestions = mockQuestions[subject]?.[chapter];
      if (chapterQuestions) {
        setQuestions(chapterQuestions);
        const welcomeMessage = `Welcome to the ${subject} assessment for ${chapter}! This assessment will test your understanding of the concepts we've learned. Are you ready to begin?`;
        speak(welcomeMessage);
      }
    }
  }, [subject, chapter, speak]);

  const lastProcessedTranscriptRef = React.useRef<string>('');
  const debounceTimerRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (!isAssessmentStarted) return;
    if (!isListening) return;
    if (!transcript) return;
    if (isSpeaking) return; // ignore while TTS is speaking

    const cleaned = transcript.trim();
    if (!cleaned) return;
    if (cleaned === lastProcessedTranscriptRef.current) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      lastProcessedTranscriptRef.current = cleaned;
      processAnswer(cleaned);
    }, 200);
  }, [transcript, isListening, isAssessmentStarted, isSpeaking]);

  const startAssessment = () => {
    setIsAssessmentStarted(true);
    const firstQuestion = questions[0];
    const message = `Let's begin! Question 1: ${firstQuestion.question}`;
    if (firstQuestion.options) {
      const optionsText = firstQuestion.options.map((option, index) => 
        `Option ${index + 1}: ${option}`
      ).join('. ');
      speak(`${message} ${optionsText}`);
    } else {
      speak(`${message} Please provide a detailed explanation.`);
    }
  };

  const processAnswer = async (answer: string) => {
    setIsProcessing(true);
    
    const currentQ = questions[currentQuestion];
    const updatedQuestions = [...questions];
    
    // Simple answer processing - in real app, this would use AI/NLP
    let isCorrect = false;
    
    if (currentQ.type === 'multiple-choice') {
      const answerIndex = parseInt(answer.match(/\d+/)?.[0] || '0') - 1;
      const selectedOption = currentQ.options?.[answerIndex];
      isCorrect = selectedOption === currentQ.correctAnswer;
      updatedQuestions[currentQuestion].userAnswer = selectedOption;
    } else if (currentQ.type === 'true-false') {
      const isTrue = answer.toLowerCase().includes('true');
      const correctAnswer = currentQ.correctAnswer === 'True';
      isCorrect = isTrue === correctAnswer;
      updatedQuestions[currentQuestion].userAnswer = isTrue ? 'True' : 'False';
    } else {
      // Open-ended questions - simplified evaluation
      const keywords = currentQ.correctAnswer?.toLowerCase().split(' ') || [];
      const answerWords = answer.toLowerCase();
      const keywordMatches = keywords.filter(keyword => 
        answerWords.includes(keyword)
      ).length;
      isCorrect = keywordMatches >= keywords.length * 0.5; // 50% keyword match
      updatedQuestions[currentQuestion].userAnswer = answer;
    }
    
    updatedQuestions[currentQuestion].isCorrect = isCorrect;
    setQuestions(updatedQuestions);
    
    // Provide feedback
    const feedback = isCorrect 
      ? `Correct! ${currentQ.explanation}`
      : `Not quite right. ${currentQ.explanation}`;
    
    setTimeout(() => {
      speak(feedback);
      setIsProcessing(false);
      
      // Move to next question or complete assessment
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          nextQuestion();
        } else {
          completeAssessment();
        }
      }, 3000);
    }, 1000);
  };

  const nextQuestion = () => {
    const nextIndex = currentQuestion + 1;
    setCurrentQuestion(nextIndex);
    
    const nextQ = questions[nextIndex];
    const questionNum = nextIndex + 1;
    const message = `Question ${questionNum}: ${nextQ.question}`;
    
    if (nextQ.options) {
      const optionsText = nextQ.options.map((option, index) => 
        `Option ${index + 1}: ${option}`
      ).join('. ');
      speak(`${message} ${optionsText}`);
    } else {
      speak(`${message} Please provide a detailed explanation.`);
    }
  };

  const completeAssessment = () => {
    setIsAssessmentCompleted(true);
    
    const correctAnswers = questions.filter(q => q.isCorrect).length;
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(finalScore);
    
    const results = {
      totalQuestions: questions.length,
      correctAnswers,
      score: finalScore,
      timeSpent: '5 minutes', // Mock time
    };
    setAssessmentResults(results);
    
    // Update user progress
    if (subject && chapter) {
      updateProgress(subject, chapter, 100, true, finalScore);
    }
    
    const completionMessage = `Assessment completed! You scored ${finalScore}% with ${correctAnswers} out of ${questions.length} questions correct. ${finalScore >= 70 ? 'Excellent work!' : 'Good effort! Keep practicing.'}`;
    speak(completionMessage);
  };

  const retakeAssessment = () => {
    setCurrentQuestion(0);
    setIsAssessmentStarted(false);
    setIsAssessmentCompleted(false);
    setScore(0);
    setAssessmentResults(null);
    
    // Reset questions
    const resetQuestions = questions.map(q => ({
      ...q,
      userAnswer: undefined,
      isCorrect: undefined,
    }));
    setQuestions(resetQuestions);
    
    speak("Assessment reset. Are you ready to try again?");
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {subject} Assessment
                  </h1>
                  <p className="text-sm text-gray-500">{chapter}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isAssessmentStarted && !isAssessmentCompleted && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <div className="w-32 progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{progress}%</span>
                </div>
              )}
              
              <button
                onClick={handleVoiceToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isListening ? 'Stop' : 'Voice'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAssessmentStarted ? (
          /* Pre-Assessment */
          <div className="text-center">
            <div className="card max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-primary-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Chapter Assessment
              </h2>
              
              <p className="text-lg text-gray-600 mb-6">
                Test your understanding of {subject} - {chapter}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Assessment Details:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-medium ml-2">{questions.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Question Types:</span>
                    <span className="font-medium ml-2">Multiple Choice, Open-ended</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time Limit:</span>
                    <span className="font-medium ml-2">No limit</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Passing Score:</span>
                    <span className="font-medium ml-2">70%</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={startAssessment}
                className="btn-primary text-lg px-8 py-4"
              >
                Start Assessment
              </button>
            </div>
          </div>
        ) : !isAssessmentCompleted ? (
          /* During Assessment */
          <div className="card">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Question {currentQuestion + 1} of {questions.length}
                </h2>
                <div className="flex items-center gap-2">
                  {currentQ.type === 'multiple-choice' && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      Multiple Choice
                    </span>
                  )}
                  {currentQ.type === 'true-false' && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      True/False
                    </span>
                  )}
                  {currentQ.type === 'open-ended' && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      Open-ended
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {currentQ.question}
                </h3>
                
                {currentQ.options && (
                  <div className="space-y-3">
                    {currentQ.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-medium text-gray-600 border border-gray-300">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVoiceToggle}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-500 text-white' 
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {isListening ? 'Stop Recording' : 'Record Answer'}
                </button>
                
                {isSpeaking && (
                  <div className="voice-indicator">
                    <Volume2 className="w-5 h-5 speaking-animation" />
                    <span>Speaking...</span>
                  </div>
                )}
              </div>
              
              {isProcessing && (
                <div className="mt-4 flex items-center gap-2 text-gray-600">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>Processing your answer...</span>
                </div>
              )}
              
              <div className="mt-6 text-sm text-gray-500">
                <p>💡 For multiple choice questions, say the option number (1, 2, 3, or 4)</p>
                <p>💡 For true/false questions, say "true" or "false"</p>
                <p>💡 For open-ended questions, provide a detailed explanation</p>
              </div>
            </div>
          </div>
        ) : (
          /* Assessment Results */
          <div className="text-center">
            <div className="card max-w-2xl mx-auto">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                score >= 70 ? 'bg-secondary-100' : 'bg-yellow-100'
              }`}>
                {score >= 70 ? (
                  <Trophy className="w-10 h-10 text-secondary-600" />
                ) : (
                  <Star className="w-10 h-10 text-yellow-600" />
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Assessment Complete!
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      {assessmentResults?.score}%
                    </div>
                    <div className="text-gray-600">Final Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary-600 mb-2">
                      {assessmentResults?.correctAnswers}/{assessmentResults?.totalQuestions}
                    </div>
                    <div className="text-gray-600">Correct Answers</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-center">
                    {score >= 70 ? (
                      <div className="flex items-center gap-2 text-secondary-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Congratulations! You passed!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">Good effort! Keep practicing.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary w-full"
                >
                  Back to Dashboard
                </button>
                
                <button
                  onClick={retakeAssessment}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Retake Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Voice Status Indicator */}
      {isListening && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-white rounded voice-wave"></div>
            <div className="w-1 h-4 bg-white rounded voice-wave"></div>
            <div className="w-1 h-4 bg-white rounded voice-wave"></div>
            <div className="w-1 h-4 bg-white rounded voice-wave"></div>
          </div>
          <span>Listening...</span>
        </div>
      )}
    </div>
  );
};

export default Assessment;
