import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '../contexts/VoiceContext';
import { useUser } from '../contexts/UserContext';
import { 
  Mic, MicOff, Volume2, BookOpen, MessageCircle, BarChart3, 
  Eye, Microscope, Calculator, Globe, Book, Languages,
  Play, ArrowRight, Clock, Star
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak, clearTranscript } = useVoice();
  const { user, getLastSession, logout, updateUser } = useUser();
  
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [currentAction, setCurrentAction] = useState<'none' | 'continue' | 'question' | 'subject'>('none');

  const subjectIcons = {
    'Science': Microscope,
    'Mathematics': Calculator,
    'Social Studies': Globe,
    'English': Book,
    'Hindi': Languages,
    'Physics': Microscope,
    'Chemistry': Microscope,
    'Biology': Microscope,
    'History': Globe,
    'Geography': Globe,
    'Civics': Globe,
    'Economics': Globe,
    'Computer Science': Calculator,
    'Sanskrit': Languages,
  };

  const lastSession = getLastSession();

  useEffect(() => {
    if (user) {
      const welcomeMessage = `Welcome back, ${user.name}! Ready to continue your learning journey?`;
      // Prevent duplicate dashboard welcomes in one session
      if ((window as any).__dv_dashboard_welcome !== welcomeMessage) {
        (window as any).__dv_dashboard_welcome = welcomeMessage;
        speak(welcomeMessage);
      }
    }
  }, [user, speak]);

  // Seed some hardcoded progress if none exists yet
  useEffect(() => {
    if (user && Object.keys(user.progress || {}).length === 0) {
      const now = new Date().toISOString();
      updateUser({
        progress: {
          'Science': {
            'Chapter-4': { completed: false, progress: 65, lastAccessed: now, score: 82 },
            'Chapter-1': { completed: true, progress: 100, lastAccessed: now, score: 90 },
          },
          'Mathematics': {
            'Chapter-1': { completed: false, progress: 40, lastAccessed: now },
          },
          'English': {
            'Chapter-1': { completed: false, progress: 25, lastAccessed: now },
          },
        }
      });
    }
  }, [user, updateUser]);

  useEffect(() => {
    if (transcript && isVoiceMode) {
      processVoiceCommand(transcript.toLowerCase());
    }
  }, [transcript, isVoiceMode]);

  const processVoiceCommand = (command: string) => {
    // Normalize common intents like "I want to read science"
    const wantsToRead = /\b(i\s+want\s+to\s+read|open|start|learn|study)\b/;
    const goTo = /\b(go\s+to|navigate\s+to)\b/;
    const subjectIntent = wantsToRead.test(command) || goTo.test(command);

    if (command.includes('continue') || command.includes('resume')) {
      stopListening();
      clearTranscript();
      if (lastSession) {
        navigate(`/learning/${lastSession.subject}/${lastSession.chapter}`);
      } else {
        speak("You don't have a previous session. Please choose a subject to start learning.");
      }
    } else if (command.includes('question') || command.includes('doubt') || command.includes('ask')) {
      setCurrentAction('question');
      speak("What would you like to know? I'm here to help with any doubts you have.");
    } else if (command.includes('science')) {
      stopListening();
      clearTranscript();
      navigate('/learning/Science/Chapter-4');
    } else if (command.includes('math') || command.includes('mathematics')) {
      stopListening();
      clearTranscript();
      navigate('/learning/Mathematics/Chapter-1');
    } else if (command.includes('social') || command.includes('social studies')) {
      stopListening();
      clearTranscript();
      navigate('/learning/Social Studies/Chapter-1');
    } else if (command.includes('english')) {
      stopListening();
      clearTranscript();
      navigate('/learning/English/Chapter-1');
    } else if (command.includes('hindi')) {
      stopListening();
      clearTranscript();
      navigate('/learning/Hindi/Chapter-1');
    } else if (subjectIntent && command.includes('science')) {
      stopListening();
      clearTranscript();
      navigate('/learning/Science/Chapter-4');
    } else if (subjectIntent && (command.includes('math') || command.includes('mathematics'))) {
      stopListening();
      clearTranscript();
      navigate('/learning/Mathematics/Chapter-1');
    } else if (subjectIntent && (command.includes('social') || command.includes('social studies'))) {
      stopListening();
      clearTranscript();
      navigate('/learning/Social Studies/Chapter-1');
    } else if (subjectIntent && command.includes('english')) {
      stopListening();
      clearTranscript();
      navigate('/learning/English/Chapter-1');
    } else if (subjectIntent && command.includes('hindi')) {
      stopListening();
      clearTranscript();
      navigate('/learning/Hindi/Chapter-1');
    } else if (command.includes('help')) {
      speak("You can say 'continue learning' to resume your last session, 'ask a question' for doubts, or mention a subject name to start learning.");
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setIsVoiceMode(false);
    } else {
      startListening();
      setIsVoiceMode(true);
      speak("I'm listening. You can say 'continue learning', 'ask a question', or mention a subject name.");
    }
  };

  const getSubjectProgress = (subject: string) => {
    if (!user?.progress[subject]) return 0;
    
    const chapters = Object.keys(user.progress[subject]);
    if (chapters.length === 0) return 0;
    
    const totalProgress = chapters.reduce((sum, chapter) => {
      return sum + (user.progress[subject][chapter]?.progress || 0);
    }, 0);
    
    return Math.round(totalProgress / chapters.length);
  };

  const getSubjectChapters = (subject: string) => {
    // Mock chapter data - in real app, this would come from curriculum API
    const chapterMap: { [key: string]: string[] } = {
      'Science': ['Chapter-1', 'Chapter-2', 'Chapter-3', 'Chapter-4', 'Chapter-5'],
      'Mathematics': ['Chapter-1', 'Chapter-2', 'Chapter-3', 'Chapter-4', 'Chapter-5'],
      'Social Studies': ['Chapter-1', 'Chapter-2', 'Chapter-3', 'Chapter-4', 'Chapter-5'],
      'English': ['Chapter-1', 'Chapter-2', 'Chapter-3', 'Chapter-4', 'Chapter-5'],
      'Hindi': ['Chapter-1', 'Chapter-2', 'Chapter-3', 'Chapter-4', 'Chapter-5'],
    };
    
    return chapterMap[subject] || [];
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DRISHTI-VANI</h1>
                  <p className="text-xs text-gray-500">AI LEARNING PLATFORM</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-primary-50 px-3 py-1 rounded-full">
                <span className="text-primary-700 font-medium">{user.name}</span>
                <span className="text-primary-600">•</span>
                <span className="text-primary-600">Class {user.class}</span>
              </div>
              
              <button
                onClick={() => navigate('/progress')}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden sm:inline">Progress</span>
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
              
              <button
                onClick={handleVoiceToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span className="hidden sm:inline">
                  {isListening ? 'Stop' : 'Voice'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Ready to continue your learning journey?
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-blue-800 font-medium mb-2">🎤 Buttonless Navigation</p>
            <p className="text-blue-700 text-sm">
              Press <kbd className="bg-blue-100 px-2 py-1 rounded">Space</kbd> or <kbd className="bg-blue-100 px-2 py-1 rounded">Enter</kbd> to start voice navigation, 
              or click anywhere on the page. Use <kbd className="bg-blue-100 px-2 py-1 rounded">1-4</kbd> for quick subject access.
            </p>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Continue Learning Card */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Continue Learning</h3>
                {lastSession ? (
                  <p className="text-gray-600">
                    Last time you were learning <strong>{lastSession.subject}, {lastSession.chapter}</strong>
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Start your learning journey with any subject
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => {
                if (lastSession) {
                  navigate(`/learning/${lastSession.subject}/${lastSession.chapter}`);
                } else {
                  speak("You don't have a previous session. Please choose a subject below to start learning.");
                }
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Continue with Voice Learning
            </button>
          </div>

          {/* Ask Question Card */}
          <div className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ask Any Question</h3>
                <p className="text-gray-600">
                  Have a doubt? Ask me anything about your subjects and I'll explain it in simple terms.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setCurrentAction('question');
                speak("What would you like to know? I'm here to help with any doubts you have.");
              }}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Mic className="w-5 h-5" />
              Start Voice Chat
            </button>
          </div>
        </div>

        {/* Subject Selection */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Choose a Subject to Explore
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {user.subjects.map((subject) => {
              const IconComponent = subjectIcons[subject as keyof typeof subjectIcons] || BookOpen;
              const progress = getSubjectProgress(subject);
              const chapters = getSubjectChapters(subject);
              
              return (
                <div
                  key={subject}
                  className="card hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => {
                    const chapterToOpen = subject === 'Science' ? 'Chapter-4' : (chapters[0] || 'Chapter-1');
                    navigate(`/learning/${subject}/${chapterToOpen}`);
                  }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                      <IconComponent className="w-8 h-8 text-primary-600" />
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">{subject}</h4>
                    
                    <div className="mb-4">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{progress}% Complete</p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-1 text-primary-600 group-hover:text-primary-700">
                      <span className="text-sm font-medium">Start Learning</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {Object.keys(user.progress).length > 0 && (
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {Object.entries(user.progress).slice(0, 3).map(([subject, chapters]) => {
                const recentChapter = Object.entries(chapters)
                  .sort(([,a], [,b]) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())[0];
                
                if (!recentChapter) return null;
                
                const [chapterName, chapterData] = recentChapter;
                const IconComponent = subjectIcons[subject as keyof typeof subjectIcons] || BookOpen;
                
                return (
                  <div key={`${subject}-${chapterName}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{subject} - {chapterName}</h4>
                      <p className="text-sm text-gray-600">
                        {chapterData.completed ? 'Completed' : `${chapterData.progress}% Complete`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(chapterData.lastAccessed).toLocaleDateString()}
                      </span>
                    </div>
                    {chapterData.score && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Star className="w-4 h-4" />
                        <span className="text-sm font-medium">{chapterData.score}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
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

      {isSpeaking && (
        <div className="fixed bottom-4 right-4 bg-primary-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Volume2 className="w-5 h-5 speaking-animation" />
          <span>Speaking...</span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
