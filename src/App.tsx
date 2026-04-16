import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { VoiceProvider, useVoice } from './contexts/VoiceContext';
import { UserProvider, useUser } from './contexts/UserContext';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Learning from './pages/Learning';
import Assessment from './pages/Assessment';
import Progress from './pages/Progress';

// Global buttonless navigation handler
const ButtonlessNavigation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isListening, startListening, stopListening, speak } = useVoice();
  const { user, isOnboarded } = useUser();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Space bar or Enter to toggle voice listening
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
          speak("I'm listening. You can navigate by voice or use keyboard shortcuts.");
        }
      }
      
      // Escape to stop listening
      if (event.code === 'Escape') {
        if (isListening) {
          stopListening();
        }
      }
      
      // Number keys for quick navigation (when not in learning mode)
      if (location.pathname === '/dashboard' && !isListening) {
        switch (event.code) {
          case 'Digit1':
            navigate('/learning/Science/Chapter-4');
            break;
          case 'Digit2':
            navigate('/learning/Mathematics/Chapter-1');
            break;
          case 'Digit3':
            navigate('/learning/English/Chapter-1');
            break;
          case 'Digit4':
            navigate('/progress');
            break;
        }
      }
    };

    const handleClick = (event: MouseEvent) => {
      // Left click to toggle voice (only if not clicking on interactive elements)
      const target = event.target as HTMLElement;
      if (target.tagName !== 'BUTTON' && target.tagName !== 'A' && !target.closest('button') && !target.closest('a')) {
        event.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
          speak("I'm listening. You can navigate by voice or use keyboard shortcuts.");
        }
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('click', handleClick);
    };
  }, [isListening, startListening, stopListening, speak, navigate, location.pathname]);

  return <>{children}</>;
};

function App() {
  return (
    <VoiceProvider>
      <UserProvider>
        <Router>
          <ButtonlessNavigation>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/learning/:subject/:chapter" element={<Learning />} />
                <Route path="/assessment/:subject/:chapter" element={<Assessment />} />
                <Route path="/progress" element={<Progress />} />
              </Routes>
            </div>
          </ButtonlessNavigation>
        </Router>
      </UserProvider>
    </VoiceProvider>
  );
}

export default App;
