import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  class: string;
  board: 'CBSE' | 'NCERT' | 'ICSE' | 'State Board';
  subjects: string[];
  voiceProfile?: {
    pitch: number;
    accent: string;
    sampleText: string;
  };
  progress: {
    [subject: string]: {
      [chapter: string]: {
        completed: boolean;
        score?: number;
        lastAccessed: string;
        progress: number;
      };
    };
  };
  lastSession?: {
    subject: string;
    chapter: string;
    timestamp: string;
  };
}

interface UserContextType {
  user: User | null;
  isOnboarded: boolean;
  updateUser: (userData: Partial<User>) => void;
  updateProgress: (subject: string, chapter: string, progress: number, completed?: boolean, score?: number) => void;
  getLastSession: () => { subject: string; chapter: string } | null;
  setLastSession: (subject: string, chapter: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const savedUser = localStorage.getItem('drishti-vani-user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsOnboarded(true);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  }, []);

  const updateUser = (userData: Partial<User>) => {
    const updatedUser = user ? { ...user, ...userData } : userData as User;
    setUser(updatedUser);
    localStorage.setItem('drishti-vani-user', JSON.stringify(updatedUser));
    
    if (!isOnboarded && userData.name && userData.class) {
      setIsOnboarded(true);
    }
  };

  const updateProgress = (subject: string, chapter: string, progress: number, completed = false, score?: number) => {
    if (!user) return;

    const updatedUser = { ...user };
    if (!updatedUser.progress[subject]) {
      updatedUser.progress[subject] = {};
    }
    
    updatedUser.progress[subject][chapter] = {
      ...updatedUser.progress[subject][chapter],
      progress,
      completed,
      score,
      lastAccessed: new Date().toISOString(),
    };

    setUser(updatedUser);
    localStorage.setItem('drishti-vani-user', JSON.stringify(updatedUser));
  };

  const getLastSession = () => {
    if (!user?.lastSession) return null;
    return {
      subject: user.lastSession.subject,
      chapter: user.lastSession.chapter,
    };
  };

  const setLastSession = (subject: string, chapter: string) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      lastSession: {
        subject,
        chapter,
        timestamp: new Date().toISOString(),
      },
    };

    setUser(updatedUser);
    localStorage.setItem('drishti-vani-user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    try {
      localStorage.removeItem('drishti-vani-user');
    } catch (e) {
      // noop
    }
    setUser(null);
    setIsOnboarded(false);
  };

  const value: UserContextType = {
    user,
    isOnboarded,
    updateUser,
    updateProgress,
    getLastSession,
    setLastSession,
    logout,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
