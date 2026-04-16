import React from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';

interface VoiceButtonProps {
  onStart?: () => void;
  onStop?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger';
  showSpeaking?: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  onStart,
  onStop,
  className = '',
  size = 'md',
  variant = 'primary',
  showSpeaking = true,
}) => {
  const { isListening, isSpeaking, startListening, stopListening } = useVoice();

  const handleClick = () => {
    if (isListening) {
      stopListening();
      onStop?.();
    } else {
      startListening();
      onStart?.();
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const variantClasses = {
    primary: isListening 
      ? 'bg-red-500 hover:bg-red-600 text-white' 
      : 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: isListening 
      ? 'bg-red-100 hover:bg-red-200 text-red-600' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-600',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        className={`
          ${sizeClasses[size]} 
          ${variantClasses[variant]} 
          rounded-full flex items-center justify-center 
          transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${className}
        `}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? (
          <MicOff className={iconSizes[size]} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>
      
      {showSpeaking && isSpeaking && (
        <div className="flex items-center gap-1 text-primary-600">
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">Speaking...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceButton;
