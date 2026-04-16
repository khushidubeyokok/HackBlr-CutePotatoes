import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '../contexts/VoiceContext';
import { useUser } from '../contexts/UserContext';
import { 
  ArrowLeft, BarChart3, TrendingUp, Calendar, Clock, 
  Star, Trophy, Target, BookOpen, Microscope, Calculator, 
  Globe, Book, Languages, Eye, Award, Zap, Volume2
} from 'lucide-react';

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak } = useVoice();
  const { user } = useUser();
  
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const subjectIcons = {
    'Science': Microscope,
    'Mathematics': Calculator,
    'Social Studies': Globe,
    'English': Book,
    'Hindi': Languages,
  };

  useEffect(() => {
    if (user) {
      const welcomeMessage = `Welcome to your progress dashboard, ${user.name}! Here you can see your learning achievements and track your improvement over time.`;
      speak(welcomeMessage);
    }
  }, [user, speak]);

  useEffect(() => {
    if (transcript && isListening) {
      processVoiceCommand(transcript.toLowerCase());
    }
  }, [transcript, isListening]);

  const processVoiceCommand = (command: string) => {
    if (command.includes('back') || command.includes('dashboard')) {
      navigate('/dashboard');
    } else if (command.includes('week')) {
      setSelectedTimeframe('week');
      speak("Showing progress for this week.");
    } else if (command.includes('month')) {
      setSelectedTimeframe('month');
      speak("Showing progress for this month.");
    } else if (command.includes('all time') || command.includes('all')) {
      setSelectedTimeframe('all');
      speak("Showing all-time progress.");
    } else if (command.includes('science')) {
      setSelectedSubject('Science');
      speak("Showing Science progress.");
    } else if (command.includes('math') || command.includes('mathematics')) {
      setSelectedSubject('Mathematics');
      speak("Showing Mathematics progress.");
    } else if (command.includes('social')) {
      setSelectedSubject('Social Studies');
      speak("Showing Social Studies progress.");
    } else if (command.includes('english')) {
      setSelectedSubject('English');
      speak("Showing English progress.");
    } else if (command.includes('hindi')) {
      setSelectedSubject('Hindi');
      speak("Showing Hindi progress.");
    } else if (command.includes('all subjects')) {
      setSelectedSubject('all');
      speak("Showing progress for all subjects.");
    }
  };

  const getOverallProgress = () => {
    if (!user?.progress) return 0;
    
    const subjects = Object.keys(user.progress);
    if (subjects.length === 0) return 0;
    
    const totalProgress = subjects.reduce((sum, subject) => {
      const chapters = Object.keys(user.progress[subject]);
      if (chapters.length === 0) return sum;
      
      const subjectProgress = chapters.reduce((chapterSum, chapter) => {
        return chapterSum + (user.progress[subject][chapter]?.progress || 0);
      }, 0);
      
      return sum + (subjectProgress / chapters.length);
    }, 0);
    
    return Math.round(totalProgress / subjects.length);
  };

  const getCompletedChapters = () => {
    if (!user?.progress) return 0;
    
    let completed = 0;
    Object.values(user.progress).forEach(subject => {
      Object.values(subject).forEach(chapter => {
        if (chapter.completed) completed++;
      });
    });
    
    return completed;
  };

  const getTotalChapters = () => {
    if (!user?.progress) return 0;
    
    let total = 0;
    Object.values(user.progress).forEach(subject => {
      total += Object.keys(subject).length;
    });
    
    return total;
  };

  const getAverageScore = () => {
    if (!user?.progress) return 0;
    
    const scores: number[] = [];
    Object.values(user.progress).forEach(subject => {
      Object.values(subject).forEach(chapter => {
        if (chapter.score) scores.push(chapter.score);
      });
    });
    
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
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

  const getRecentActivity = () => {
    if (!user?.progress) return [];
    
    const activities: Array<{
      subject: string;
      chapter: string;
      action: string;
      timestamp: string;
      score?: number;
    }> = [];
    
    Object.entries(user.progress).forEach(([subject, chapters]) => {
      Object.entries(chapters).forEach(([chapter, data]) => {
        activities.push({
          subject,
          chapter,
          action: data.completed ? 'Completed' : 'In Progress',
          timestamp: data.lastAccessed,
          score: data.score,
        });
      });
    });
    
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };

  const getStreakDays = () => {
    // Mock streak calculation - in real app, this would be calculated from actual usage data
    return 7;
  };

  const getStudyTime = () => {
    // Mock study time - in real app, this would be tracked from actual sessions
    return '2h 30m';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress...</p>
        </div>
      </div>
    );
  }

  const overallProgress = getOverallProgress();
  const completedChapters = getCompletedChapters();
  const totalChapters = getTotalChapters();
  const averageScore = getAverageScore();
  const recentActivity = getRecentActivity();
  const streakDays = getStreakDays();
  const studyTime = getStudyTime();

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
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Progress Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">{user.name}'s Learning Journey</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-primary-50 px-3 py-1 rounded-full">
                <span className="text-primary-700 font-medium">{user.name}</span>
                <span className="text-primary-600">•</span>
                <span className="text-primary-600">Class {user.class}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">{overallProgress}%</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chapters Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedChapters}/{totalChapters}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900">{streakDays} days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Subject Progress */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Subject Progress</h2>
                <div className="flex gap-2">
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-6">
                {user.subjects.map((subject) => {
                  const IconComponent = subjectIcons[subject as keyof typeof subjectIcons] || BookOpen;
                  const progress = getSubjectProgress(subject);
                  const subjectData = user.progress[subject];
                  const completedCount = subjectData ? Object.values(subjectData).filter(ch => ch.completed).length : 0;
                  const totalCount = subjectData ? Object.keys(subjectData).length : 0;
                  
                  return (
                    <div key={subject} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-gray-900">{subject}</h3>
                          <span className="text-sm text-gray-600">{progress}%</span>
                        </div>
                        
                        <div className="progress-bar mb-2">
                          <div 
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{completedCount}/{totalCount} chapters completed</span>
                          <span>{studyTime} studied</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity & Achievements */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const IconComponent = subjectIcons[activity.subject as keyof typeof subjectIcons] || BookOpen;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.subject} - {activity.chapter}
                          </p>
                          <p className="text-xs text-gray-600">
                            {activity.action} • {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        {activity.score && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="w-4 h-4" />
                            <span className="text-sm font-medium">{activity.score}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Achievements</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">First Chapter</p>
                    <p className="text-sm text-gray-600">Completed your first chapter</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Consistent Learner</p>
                    <p className="text-sm text-gray-600">7-day study streak</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">High Scorer</p>
                    <p className="text-sm text-gray-600">Scored above 80% in an assessment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default Progress;
