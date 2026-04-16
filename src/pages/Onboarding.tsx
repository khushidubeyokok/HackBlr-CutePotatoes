import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '../contexts/VoiceContext';
import { useUser } from '../contexts/UserContext';
import { Mic, MicOff, Volume2, VolumeX, Eye, BookOpen, Users, Globe } from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak, isVoiceSupported } = useVoice();
  const { updateUser, isOnboarded } = useUser();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    class: '',
    board: 'CBSE' as 'CBSE' | 'NCERT' | 'ICSE' | 'State Board',
    subjects: [] as string[],
  });
  const [voiceProfile, setVoiceProfile] = useState({
    pitch: 1,
    accent: 'neutral',
    sampleText: '',
  });

  const steps = [
    {
      title: 'Welcome to Drishti-Vani',
      description: 'Your AI-powered learning companion',
      icon: Eye,
      color: 'text-primary-500',
    },
    {
      title: 'Voice Profile Setup',
      description: 'Let me learn your voice for better interaction',
      icon: Mic,
      color: 'text-secondary-500',
    },
    {
      title: 'Personal Information',
      description: 'Tell me about yourself',
      icon: Users,
      color: 'text-primary-500',
    },
    {
      title: 'Academic Details',
      description: 'Your class and curriculum',
      icon: BookOpen,
      color: 'text-secondary-500',
    },
    {
      title: 'Subject Selection',
      description: 'Choose your subjects',
      icon: Globe,
      color: 'text-primary-500',
    },
  ];

  const availableSubjects = [
    'Science', 'Mathematics', 'Social Studies', 'English', 'Hindi',
    'Physics', 'Chemistry', 'Biology', 'History', 'Geography',
    'Civics', 'Economics', 'Computer Science', 'Sanskrit'
  ];

  const boards = ['CBSE', 'NCERT', 'ICSE', 'State Board'];

  useEffect(() => {
    if (isOnboarded) {
      navigate('/dashboard');
    }
  }, [isOnboarded, navigate]);

  useEffect(() => {
    // Auto-speak step descriptions
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      speak(`${step.title}. ${step.description}`);
    }
  }, [currentStep, speak]);

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const processTranscript = () => {
    if (!transcript) return;

    const text = transcript.toLowerCase().trim();
    
    switch (currentStep) {
      case 1: // Voice profile
        setVoiceProfile(prev => ({ ...prev, sampleText: transcript }));
        break;
        
      case 2: // Personal info
        if (text.includes('name is') || text.includes('i am') || text.includes('my name')) {
          // Capture words after the phrase, stopping at punctuation or end
          const nameMatch = transcript.match(/(?:my\s+name\s+is|name\s+is|i\s+am|i'm)\s+([a-zA-Z][a-zA-Z\s'-]{0,60})/i);
          if (nameMatch) {
            let extracted = nameMatch[1].trim();
            // Remove trailing punctuation and filler words
            extracted = extracted.replace(/[.,!?].*$/, '').trim();
            // Title-case the name
            const proper = extracted.split(/\s+/).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
            setUserData(prev => ({ ...prev, name: proper }));
          }
        }
        break;
        
      case 3: // Academic details
        // Extract class
        const classMatch = text.match(/class\s+(\d+)/i);
        if (classMatch) {
          setUserData(prev => ({ ...prev, class: classMatch[1] }));
        }
        
        // Extract board
        const boardMatch = boards.find(board => text.includes(board.toLowerCase()));
        if (boardMatch) {
          setUserData(prev => ({ ...prev, board: boardMatch as any }));
        }
        break;
        
      case 4: // Subject selection
        const selectedSubjects = availableSubjects.filter(subject => 
          text.includes(subject.toLowerCase())
        );
        if (selectedSubjects.length > 0) {
          setUserData(prev => ({
            ...prev,
            subjects: [...new Set([...prev.subjects, ...selectedSubjects])]
          }));
        }
        break;
    }
  };

  useEffect(() => {
    if (transcript) {
      processTranscript();
    }
  }, [transcript]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete onboarding
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        voiceProfile,
        progress: {},
        lastSession: undefined,
      };
      updateUser(newUser);
      navigate('/dashboard');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return voiceProfile.sampleText.length > 0;
      case 2: return userData.name.length > 0;
      case 3: return userData.class.length > 0 && userData.board;
      case 4: return userData.subjects.length > 0;
      default: return true;
    }
  };

  if (!isVoiceSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🎤</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Voice Not Supported</h1>
          <p className="text-gray-600 mb-4">
            Your browser doesn't support voice recognition. Please use Chrome or Edge for the best experience.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Continue Without Voice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="card">
          {/* Step Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 ${steps[currentStep].color}`}>
              {React.createElement(steps[currentStep].icon, { className: "w-8 h-8" })}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 0 && (
              <div className="text-center">
                <div className="text-6xl mb-4">👁️</div>
                <p className="text-lg text-gray-700 mb-6">
                  Drishti-Vani is designed to make learning accessible through voice interaction. 
                  I'll guide you through a quick setup process.
                </p>
                <div className="bg-primary-50 rounded-lg p-4 mb-6">
                  <p className="text-primary-800 font-medium">
                    💡 Tip: You can speak naturally - I'll understand your voice and respond accordingly.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <p className="text-gray-700 text-center">
                  Please read this sentence clearly so I can learn your voice:
                </p>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-lg font-medium text-gray-800 mb-4">
                    "Hello, I am ready to start my learning journey with Drishti-Vani."
                  </p>
                  <button
                    onClick={handleVoiceInput}
                    className={`btn-primary flex items-center gap-2 mx-auto ${
                      isListening ? 'bg-red-500 hover:bg-red-600' : ''
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {isListening ? 'Stop Recording' : 'Start Recording'}
                  </button>
                </div>
                {voiceProfile.sampleText && (
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <p className="text-secondary-800 font-medium">Recorded:</p>
                    <p className="text-secondary-700">"{voiceProfile.sampleText}"</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-gray-700 text-center">
                  Tell me your name. You can say: "My name is [Your Name]"
                </p>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={handleVoiceInput}
                      className={`btn-primary flex items-center gap-2 ${
                        isListening ? 'bg-red-500 hover:bg-red-600' : ''
                      }`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      {isListening ? 'Listening...' : 'Speak'}
                    </button>
                    {isSpeaking && (
                      <div className="voice-indicator">
                        <Volume2 className="w-5 h-5 speaking-animation" />
                        <span>Speaking...</span>
                      </div>
                    )}
                  </div>
                  {userData.name && (
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <p className="text-secondary-800 font-medium">Name:</p>
                      <p className="text-secondary-700">{userData.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <p className="text-gray-700 text-center">
                  Tell me your class and board. You can say: "I am in class 7, CBSE board"
                </p>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={handleVoiceInput}
                      className={`btn-primary flex items-center gap-2 ${
                        isListening ? 'bg-red-500 hover:bg-red-600' : ''
                      }`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      {isListening ? 'Listening...' : 'Speak'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {userData.class && (
                      <div className="bg-secondary-50 rounded-lg p-4">
                        <p className="text-secondary-800 font-medium">Class:</p>
                        <p className="text-secondary-700">Class {userData.class}</p>
                      </div>
                    )}
                    {userData.board && (
                      <div className="bg-secondary-50 rounded-lg p-4">
                        <p className="text-secondary-800 font-medium">Board:</p>
                        <p className="text-secondary-700">{userData.board}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <p className="text-gray-700 text-center">
                  Tell me your subjects. You can say: "I study Science, Mathematics, and English"
                </p>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={handleVoiceInput}
                      className={`btn-primary flex items-center gap-2 ${
                        isListening ? 'bg-red-500 hover:bg-red-600' : ''
                      }`}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      {isListening ? 'Listening...' : 'Speak'}
                    </button>
                  </div>
                  {userData.subjects.length > 0 && (
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <p className="text-secondary-800 font-medium mb-2">Selected Subjects:</p>
                      <div className="flex flex-wrap gap-2">
                        {userData.subjects.map((subject, index) => (
                          <span
                            key={index}
                            className="bg-secondary-200 text-secondary-800 px-3 py-1 rounded-full text-sm"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </button>
          </div>
        </div>

        {/* Voice Status */}
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
    </div>
  );
};

export default Onboarding;
