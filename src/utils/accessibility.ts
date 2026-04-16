// Accessibility utilities for the Drishti-Vani platform

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  
  // Remove the announcer after a short delay
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
};

export const focusElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
  }
};

export const getAccessibleLabel = (text: string, context?: string) => {
  if (context) {
    return `${text}, ${context}`;
  }
  return text;
};

export const formatForScreenReader = (text: string) => {
  // Replace common abbreviations and symbols with screen reader friendly text
  return text
    .replace(/\bvs\.\b/g, 'versus')
    .replace(/\betc\.\b/g, 'etcetera')
    .replace(/\bDr\.\b/g, 'Doctor')
    .replace(/\bProf\.\b/g, 'Professor')
    .replace(/&/g, 'and')
    .replace(/@/g, 'at')
    .replace(/#/g, 'number')
    .replace(/\*/g, 'asterisk')
    .replace(/%/g, 'percent')
    .replace(/\$/g, 'dollar')
    .replace(/\+/g, 'plus')
    .replace(/-/g, 'minus')
    .replace(/=/g, 'equals')
    .replace(/</g, 'less than')
    .replace(/>/g, 'greater than');
};

export const createAccessibleDescription = (title: string, description: string) => {
  return `${title}. ${description}`;
};

export const getProgressDescription = (current: number, total: number, context: string) => {
  const percentage = Math.round((current / total) * 100);
  return `${context}: ${current} of ${total} completed, ${percentage} percent complete`;
};

export const getTimeDescription = (timeString: string) => {
  // Convert time strings to more descriptive format for screen readers
  return timeString
    .replace(/(\d+)h/g, '$1 hours')
    .replace(/(\d+)m/g, '$1 minutes')
    .replace(/(\d+)s/g, '$1 seconds');
};

export const getScoreDescription = (score: number, maxScore: number = 100) => {
  const percentage = Math.round((score / maxScore) * 100);
  let level = '';
  
  if (percentage >= 90) level = 'excellent';
  else if (percentage >= 80) level = 'very good';
  else if (percentage >= 70) level = 'good';
  else if (percentage >= 60) level = 'satisfactory';
  else level = 'needs improvement';
  
  return `Score: ${score} out of ${maxScore}, ${percentage} percent, ${level}`;
};

export const getChapterDescription = (subject: string, chapter: string, progress: number) => {
  const status = progress === 100 ? 'completed' : progress > 0 ? 'in progress' : 'not started';
  return `${subject}, ${chapter}, ${status}, ${progress} percent complete`;
};

export const getVoiceStatusDescription = (isListening: boolean, isSpeaking: boolean) => {
  if (isListening) return 'Voice recognition is active, listening for input';
  if (isSpeaking) return 'Voice synthesis is active, speaking';
  return 'Voice system is ready';
};

export const getNavigationDescription = (currentPage: string, totalPages: number, currentIndex: number) => {
  return `Page ${currentIndex + 1} of ${totalPages}, ${currentPage}`;
};

export const getButtonDescription = (buttonText: string, isActive: boolean, isDisabled: boolean) => {
  let description = buttonText;
  
  if (isDisabled) {
    description += ', disabled';
  } else if (isActive) {
    description += ', active';
  }
  
  return description;
};

export const getListDescription = (itemCount: number, listType: string) => {
  return `${listType} list with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
};

export const getFormFieldDescription = (label: string, isRequired: boolean, hasError: boolean, helpText?: string) => {
  let description = label;
  
  if (isRequired) {
    description += ', required';
  }
  
  if (hasError) {
    description += ', has error';
  }
  
  if (helpText) {
    description += `, ${helpText}`;
  }
  
  return description;
};

// Keyboard navigation utilities
export const handleKeyboardNavigation = (
  event: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onNavigate: (index: number) => void
) => {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % totalItems;
      onNavigate(nextIndex);
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault();
      const prevIndex = currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
      onNavigate(prevIndex);
      break;
    case 'Home':
      event.preventDefault();
      onNavigate(0);
      break;
    case 'End':
      event.preventDefault();
      onNavigate(totalItems - 1);
      break;
  }
};

// High contrast mode detection
export const isHighContrastMode = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for Windows High Contrast mode
  if (window.matchMedia) {
    return window.matchMedia('(-ms-high-contrast: active)').matches;
  }
  
  return false;
};

// Reduced motion detection
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  
  if (window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  return false;
};

// Color scheme detection
export const getColorScheme = () => {
  if (typeof window === 'undefined') return 'light';
  
  if (window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  return 'light';
};
