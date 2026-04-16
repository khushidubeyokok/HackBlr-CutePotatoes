import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVoice } from '../contexts/VoiceContext';
import { useUser } from '../contexts/UserContext';
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
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Mock textbook content - in real app, this would come from curriculum API
  const mockContent: { [key: string]: { [key: string]: TextbookContent } } = {
    'Science': {
      'Chapter-1': {
        title: 'MATTER IN OUR SURROUNDINGS',
        pageNumber: 1,
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop&crop=center',
        sections: [
          {
            id: 'intro',
            title: 'Introduction to Matter',
            content: 'Everything around us is made up of matter. Matter is anything that has mass and occupies space. The three states of matter are solid, liquid, and gas.',
            type: 'text',
            completed: false,
          },
          {
            id: 'states',
            title: 'States of Matter',
            content: 'Matter exists in three states: solid, liquid, and gas. Solids have fixed shape and volume, liquids have fixed volume but no fixed shape, and gases have neither fixed shape nor volume.',
            type: 'text',
            completed: false,
          },
          {
            id: 'particles',
            title: 'Particle Nature of Matter',
            content: 'All matter is made up of tiny particles called atoms and molecules. These particles are constantly moving and have spaces between them.',
            type: 'text',
            completed: false,
          },
        ],
      },
      'Chapter-4': {
        title: '10.2.3 Photosynthesis: in a nutshell',
        pageNumber: 146,
        imageUrl: '/demo-photosynthesis.png',
        sections: [
          {
            id: 'nutshell',
            title: 'Photosynthesis in a nutshell',
            content: 'We know that water, sunlight, carbon dioxide from the air, and chlorophyll are necessary to carry out the process of photosynthesis that produces carbohydrates. During photosynthesis, food is actually produced in the form of glucose, a simple carbohydrate. This glucose not only serves as an instant source of energy but also later gets converted into starch for storage.',
            type: 'text',
            completed: false,
          },
          {
            id: 'equation',
            title: 'Word equation of photosynthesis',
            content: 'Sunlight and chlorophyll help plants combine carbon dioxide and water to form glucose and oxygen.',
            type: 'diagram',
            description: 'Carbon dioxide + Water —[Sunlight, Chlorophyll]→ Glucose + Oxygen',
            completed: false,
          },
          {
            id: 'know-a-scientist',
            title: 'Know a Scientist: Rustom Hormusji Dastur (1896–1961)',
            content: 'Many scientists contributed to our understanding of photosynthesis. In India, Rustom Hormusji Dastur studied photosynthesis and led the Botany Department at the Royal Institute of Science, Bombay. He studied the effects of the amount of water and temperature on photosynthesis and examined the importance of water, temperature, and the colour of light in the process of photosynthesis.',
            type: 'text',
            completed: false,
          },
          {
            id: 'gas-exchange',
            title: '10.2.4 How do leaves exchange gases during photosynthesis?',
            content: 'Photosynthesis requires carbon dioxide, and oxygen is released in the process. Which part of the plant helps in the exchange of carbon dioxide and oxygen? Let us conduct an activity to understand where the exchange of gases takes place.',
            type: 'text',
            completed: false,
          },
        ],
      },
    },
    'Mathematics': {
      'Chapter-1': {
        title: 'INTEGERS',
        pageNumber: 1,
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop&crop=center',
        sections: [
          {
            id: 'intro',
            title: 'Introduction to Integers',
            content: 'Integers are whole numbers that can be positive, negative, or zero. They include numbers like -3, -2, -1, 0, 1, 2, 3, and so on.',
            type: 'text',
            completed: false,
          },
          {
            id: 'number-line',
            title: 'Number Line',
            content: 'Integers can be represented on a number line. Positive integers are to the right of zero, and negative integers are to the left of zero.',
            type: 'text',
            completed: false,
          },
          {
            id: 'operations',
            title: 'Operations with Integers',
            content: 'We can perform addition, subtraction, multiplication, and division with integers. The rules for these operations help us work with positive and negative numbers.',
            type: 'text',
            completed: false,
          },
        ],
      },
    },
    'Social Studies': {
      'Chapter-1': {
        title: 'OUR ENVIRONMENT',
        pageNumber: 1,
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center',
        sections: [
          {
            id: 'intro',
            title: 'What is Environment?',
            content: 'Environment is everything that surrounds us. It includes both natural and human-made components that affect our daily lives.',
            type: 'text',
            completed: false,
          },
          {
            id: 'components',
            title: 'Components of Environment',
            content: 'The environment has three main components: natural environment (air, water, soil), human environment (buildings, roads), and human-made environment (technology, culture).',
            type: 'text',
            completed: false,
          },
        ],
      },
    },
    'English': {
      'Chapter-1': {
        title: 'THREE QUESTIONS',
        pageNumber: 1,
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
        sections: [
          {
            id: 'intro',
            title: 'Introduction to the Story',
            content: 'This is a story about a king who seeks answers to three important questions that will help him rule his kingdom wisely.',
            type: 'text',
            completed: false,
          },
          {
            id: 'questions',
            title: 'The Three Questions',
            content: 'The king asks: What is the right time to do something? Who are the right people to listen to? What is the most important thing to do?',
            type: 'text',
            completed: false,
          },
        ],
      },
    },
    'Hindi': {
      'Chapter-1': {
        title: 'हम पंछी उन्मुक्त गगन के',
        pageNumber: 1,
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
        sections: [
          {
            id: 'intro',
            title: 'कविता का परिचय',
            content: 'यह कविता स्वतंत्रता और आज़ादी के बारे में है। कवि पक्षियों के माध्यम से स्वतंत्रता की भावना को व्यक्त करते हैं।',
            type: 'text',
            completed: false,
          },
          {
            id: 'meaning',
            title: 'कविता का अर्थ',
            content: 'कविता में पक्षी आकाश में स्वतंत्र रूप से उड़ते हैं और यह स्वतंत्रता की भावना का प्रतीक है।',
            type: 'text',
            completed: false,
          },
        ],
      },
    },
  };

  useEffect(() => {
    if (subject && chapter) {
      // Clear any lingering dashboard transcript before starting session
      // (handled in Dashboard with clearTranscript, this is just defensive)
      setLastSession(subject, chapter);
      const content = mockContent[subject]?.[chapter];
      if (content) {
        setTextbookContent(content);
        // Start with welcome message (guard against duplicates)
        const welcomeMessage = `Welcome to ${subject}, ${chapter}! Let's start learning about ${content.title}. I'll guide you through each section.`;
        if ((window as any).__dv_last_welcome !== welcomeMessage) {
          (window as any).__dv_last_welcome = welcomeMessage;
          addToConversation('ai', welcomeMessage);
          speak(welcomeMessage);
        }
      } else {
        // Create default content if not found
        const defaultContent: TextbookContent = {
          title: `${subject} - ${chapter}`,
          pageNumber: 1,
          imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop&crop=center',
          sections: [
            {
              id: 'intro',
              title: 'Introduction',
              content: `Welcome to ${subject}, ${chapter}! This chapter covers important concepts that will help you understand the subject better. Let's start learning together.`,
              type: 'text',
              completed: false,
            },
            {
              id: 'content',
              title: 'Chapter Content',
              content: 'This chapter contains valuable information about the topic. I will guide you through each section and explain the concepts in detail.',
              type: 'text',
              completed: false,
            },
          ],
        };
        setTextbookContent(defaultContent);
        const welcomeMessage = `Welcome to ${subject}, ${chapter}! I'll help you learn this topic step by step.`;
        if ((window as any).__dv_last_welcome !== welcomeMessage) {
          (window as any).__dv_last_welcome = welcomeMessage;
          addToConversation('ai', welcomeMessage);
          speak(welcomeMessage);
        }
      }
    }
  }, [subject, chapter]); // Removed setLastSession and speak from dependencies

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
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const response = generateAIResponse(input);
      addToConversation('ai', response);
      speak(response);
      setIsProcessing(false);
    }, 1000);
  };

  const generateAIResponse = (input: string): string => {
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
      return "I understand. Let me know if you'd like me to explain something, move to the next section, or if you have any questions about this topic.";
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isListening 
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
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-primary-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isListening 
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
