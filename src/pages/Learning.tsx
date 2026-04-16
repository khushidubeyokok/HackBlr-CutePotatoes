import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVoice } from '../contexts/VoiceContext';
import { useUser } from '../contexts/UserContext';
import { useRagChat } from '../hooks/useRagChat';
import {
  Mic, MicOff, Volume2, VolumeX, ArrowLeft, ArrowRight,
  BookOpen, MessageCircle, CheckCircle, Play, Pause,
  Eye, Microscope, Calculator, Globe, Book, Languages
} from 'lucide-react';

interface TextbookContent {
  title: string;
  pageNumber: number;
  imageUrl?: string;
  sections: {
    id: string;
    title: string;
    content: string;
    type: 'text' | 'image' | 'activity' | 'diagram';
    description?: string;
    completed?: boolean;
  }[];
}

const Learning: React.FC = () => {
  const { subject, chapter } = useParams<{ subject: string; chapter: string }>();
  const navigate = useNavigate();
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak, stopSpeaking } = useVoice();
  const { user, updateProgress, setLastSession, logout } = useUser();

  const [currentSection, setCurrentSection] = useState(0);
  const [isLearning, setIsLearning] = useState(false);
  const [conversation, setConversation] = useState<Array<{
    id: string;
    type: 'ai' | 'user';
    message: string;
    timestamp: Date;
  }>>([]);
  const { ask, isLoading } = useRagChat(subject || '', chapter || '');
  const [textbookContent, setTextbookContent] = useState<TextbookContent | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentQuestions, setAssessmentQuestions] = useState<Array<{
    id: string;
    question: string;
    correctAnswer: string;
    userAnswer?: string;
    isCorrect?: boolean;
  }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const subjectIcons = {
    'Science': Microscope,
    'Mathematics': Calculator,
    'Social Studies': Globe,
    'English': Book,
    'Hindi': Languages,
  };

  // Replaced mockContent with API call below

  useEffect(() => {
    if (subject && chapter) {
      setLastSession(subject, chapter);

      // Fetch textbook structure
      fetch(`http://localhost:3001/api/content?subject=${subject}&chapter=${chapter}`)
        .then(res => res.json())
        .then(data => setTextbookContent(data))
        .catch(err => console.error('Failed to fetch textbook content:', err));

      // Fetch initial summary/overview from RAG
      ask("Summarize the key sections of this chapter for a student")
        .then(answer => {
          const welcomeMessage = `Welcome to ${subject}, ${chapter}! ${answer}`;
          if ((window as any).__dv_last_welcome !== welcomeMessage) {
            (window as any).__dv_last_welcome = welcomeMessage;
            addToConversation('ai', welcomeMessage);
            speak(welcomeMessage);
          }
        });
    }
  }, [subject, chapter]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const lastProcessedTranscriptRef = useRef<string>('');
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isListening) return;
    if (!transcript) return;
    if (isSpeaking) return; // avoid reacting while TTS is speaking

    const cleaned = transcript.trim();
    if (!cleaned) return;

    // De-duplicate identical final transcripts
    if (cleaned === lastProcessedTranscriptRef.current) return;

    // Small debounce to coalesce closely timed finals
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      lastProcessedTranscriptRef.current = cleaned;
      addToConversation('user', cleaned);

      // Route to assessment if in assessment mode
      if (showAssessment && !assessmentCompleted) {
        processAssessmentAnswer(cleaned);
      } else {
        processUserInput(cleaned);
      }
    }, 200);
  }, [transcript, isListening, isSpeaking, showAssessment, assessmentCompleted]);

  const addToConversation = (type: 'ai' | 'user', message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, newMessage]);
  };

  const processUserInput = async (input: string) => {
    const response = await generateAIResponse(input);
    addToConversation('ai', response);
    speak(response);
  };

  const generateAIResponse = async (input: string): Promise<string> => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('next') || lowerInput.includes('continue')) {
      return handleNextSection();
    } else if (lowerInput.includes('previous') || lowerInput.includes('back')) {
      return handlePreviousSection();
    } else if (lowerInput.includes('repeat') || lowerInput.includes('again')) {
      return repeatCurrentSection();
    } else if (lowerInput.includes('explain') || lowerInput.includes('what')) {
      return explainCurrentSection();
    } else if (lowerInput.includes('question') || lowerInput.includes('doubt')) {
      return "I'm here to help! What specific part would you like me to explain in more detail?";
    } else if (lowerInput.includes('complete') || lowerInput.includes('done')) {
      return markSectionComplete();
    } else {
      // Recognized voice inputs go to RAG backend
      return await ask(input);
    }
  };

  const handleNextSection = (): string => {
    if (!textbookContent) return "No content available.";

    if (currentSection < textbookContent.sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      const nextSection = textbookContent.sections[currentSection + 1];
      return `Moving to the next section: ${nextSection.title}. ${nextSection.content}`;
    } else {
      return "You've completed all sections of this chapter! Would you like to take an assessment to test your understanding?";
    }
  };

  const handlePreviousSection = (): string => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      const prevSection = textbookContent?.sections[currentSection - 1];
      return `Going back to: ${prevSection?.title}. ${prevSection?.content}`;
    } else {
      return "This is the first section. You can say 'next' to continue to the next part.";
    }
  };

  const repeatCurrentSection = (): string => {
    const current = textbookContent?.sections[currentSection];
    if (current) {
      return `Let me repeat: ${current.title}. ${current.content}`;
    }
    return "No current section to repeat.";
  };

  const explainCurrentSection = (): string => {
    const current = textbookContent?.sections[currentSection];
    if (current) {
      if (current.type === 'diagram' && current.description) {
        return `Let me explain this diagram in detail: ${current.description}. This visual representation helps us understand ${current.title}.`;
      } else {
        return `Let me explain this in more detail: ${current.content}. This concept is important because it forms the foundation for understanding photosynthesis.`;
      }
    }
    return "No current section to explain.";
  };

  const markSectionComplete = (): string => {
    if (textbookContent) {
      const updatedSections = textbookContent.sections.map((section, index) =>
        index === currentSection ? { ...section, completed: true } : section
      );
      setTextbookContent({ ...textbookContent, sections: updatedSections });

      // Update progress
      const progress = Math.round(((currentSection + 1) / textbookContent.sections.length) * 100);
      if (subject && chapter) {
        updateProgress(subject, chapter, progress);
      }

      // Check if all sections are completed to trigger assessment
      const allCompleted = updatedSections.every(section => section.completed);
      if (allCompleted && !showAssessment) {
        startAssessment();
        return "Excellent! You've completed all sections. Let's test your understanding with a quick assessment.";
      }

      return "Great! I've marked this section as completed. You're making excellent progress!";
    }
    return "Unable to mark section as complete.";
  };

  const startAssessment = () => {
    const questions = [
      {
        id: 'q1',
        question: 'Who performs photosynthesis?',
        correctAnswer: 'green plants'
      },
      {
        id: 'q2',
        question: 'Where is photosynthesis done?',
        correctAnswer: 'leaves'
      },
      {
        id: 'q3',
        question: 'Which gas is produced after photosynthesis?',
        correctAnswer: 'oxygen'
      },
      {
        id: 'q4',
        question: 'Photosynthesis occurs in presence of what?',
        correctAnswer: 'sunlight'
      }
    ];

    setAssessmentQuestions(questions);
    setCurrentQuestionIndex(0);
    setShowAssessment(true);
    setAssessmentCompleted(false);
    setAssessmentScore(0);

    const firstQuestion = questions[0];
    const message = `Assessment time! Question 1: ${firstQuestion.question}`;
    addToConversation('ai', message);
    speak(message);
  };

  const processAssessmentAnswer = (answer: string) => {
    if (!showAssessment || assessmentCompleted) return;

    const currentQuestion = assessmentQuestions[currentQuestionIndex];
    const normalizedAnswer = answer.toLowerCase().trim();
    const normalizedCorrect = currentQuestion.correctAnswer.toLowerCase();

    // Check if answer contains the correct keyword
    const isCorrect = normalizedAnswer.includes(normalizedCorrect) ||
      normalizedCorrect.includes(normalizedAnswer);

    const updatedQuestions = [...assessmentQuestions];
    updatedQuestions[currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect
    };
    setAssessmentQuestions(updatedQuestions);

    // Provide feedback
    const feedback = isCorrect
      ? `Correct! ${currentQuestion.correctAnswer} is the right answer.`
      : `Not quite right. The correct answer is ${currentQuestion.correctAnswer}.`;

    addToConversation('ai', feedback);
    speak(feedback);

    // Move to next question or complete assessment
    setTimeout(() => {
      if (currentQuestionIndex < assessmentQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        const nextQuestion = assessmentQuestions[nextIndex];
        const nextMessage = `Question ${nextIndex + 1}: ${nextQuestion.question}`;
        addToConversation('ai', nextMessage);
        speak(nextMessage);
      } else {
        completeAssessment();
      }
    }, 2000);
  };

  const completeAssessment = () => {
    const correctAnswers = assessmentQuestions.filter(q => q.isCorrect).length;
    const score = Math.round((correctAnswers / assessmentQuestions.length) * 100);
    setAssessmentScore(score);
    setAssessmentCompleted(true);

    const completionMessage = `Assessment completed! You scored ${score}% (${correctAnswers} out of ${assessmentQuestions.length} correct). ${score >= 75 ? 'Excellent work!' : 'Good effort! Keep practicing.'}`;
    addToConversation('ai', completionMessage);
    speak(completionMessage);

    // Update progress with assessment score
    if (subject && chapter) {
      updateProgress(subject, chapter, 100, true, score);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startLearning = () => {
    setIsLearning(true);
    const current = textbookContent?.sections[currentSection];
    if (current) {
      const message = `Let's start with ${current.title}. ${current.content}`;
      addToConversation('ai', message);
      speak(message);
    }
  };

  const pauseLearning = () => {
    setIsLearning(false);
    stopSpeaking();
  };

  if (!textbookContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  const currentSectionData = textbookContent.sections[currentSection];
  const progress = Math.round(((currentSection + 1) / textbookContent.sections.length) * 100);
  const IconComponent = subjectIcons[subject as keyof typeof subjectIcons] || BookOpen;

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
                  <IconComponent className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {subject} - {chapter}
                  </h1>
                  <p className="text-sm text-gray-500">{textbookContent.title}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
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

              <button
                onClick={handleVoiceToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isListening
                    ? 'bg-red-500 text-white'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isListening ? 'Stop' : 'Voice'}
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <MicOff className="w-5 h-5 rotate-90" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Panel - Static Full Image */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="bg-primary-600 text-white px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-semibold">NCERT {subject} Textbook</h2>
              <p className="text-primary-100">{chapter}: {textbookContent.title}</p>
            </div>
            <div className="h-[calc(100%-4rem)] p-4 sticky top-0">
              {textbookContent.imageUrl && (
                <div className="w-full h-full">
                  <img
                    src={textbookContent.imageUrl}
                    alt={`${textbookContent.title} textbook page`}
                    className="w-full h-full object-contain rounded-lg border border-gray-200"
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    NCERT {subject} Textbook - Page {textbookContent.pageNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - AI Tutor Conversation (scrollable) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="bg-primary-600 text-white px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-semibold">AI Tutor Conversation</h2>
              <p className="text-primary-100">Voice-based learning assistant</p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {conversation.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${message.type === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVoiceToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isListening
                      ? 'bg-red-500 text-white'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {isListening ? 'Stop Listening' : 'Start Voice Chat'}
                </button>

                {isSpeaking && (
                  <div className="voice-indicator">
                    <Volume2 className="w-5 h-5 speaking-animation" />
                    <span>Speaking...</span>
                  </div>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-500">
                <p>💡 Try saying: "explain this", "next section", "repeat", or "I have a question"</p>
                <p className="mt-1">🎤 Or press <kbd className="bg-gray-100 px-1 py-0.5 rounded">Space</kbd> to toggle voice anywhere on the page</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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

export default Learning;
