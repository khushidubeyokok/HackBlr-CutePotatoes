// Voice command processing utilities for the Drishti-Vani platform

export interface VoiceCommand {
  action: string;
  parameters?: Record<string, any>;
  confidence?: number;
}

export const processVoiceCommand = (transcript: string): VoiceCommand | null => {
  const normalizedTranscript = transcript.toLowerCase().trim();
  
  // Navigation commands
  if (normalizedTranscript.includes('go back') || normalizedTranscript.includes('back')) {
    return { action: 'navigate', parameters: { direction: 'back' } };
  }
  
  if (normalizedTranscript.includes('go to dashboard') || normalizedTranscript.includes('dashboard')) {
    return { action: 'navigate', parameters: { page: 'dashboard' } };
  }
  
  if (normalizedTranscript.includes('go to progress') || normalizedTranscript.includes('progress')) {
    return { action: 'navigate', parameters: { page: 'progress' } };
  }
  
  // Learning commands
  if (normalizedTranscript.includes('start learning') || normalizedTranscript.includes('begin learning')) {
    return { action: 'start_learning' };
  }
  
  if (normalizedTranscript.includes('continue learning') || normalizedTranscript.includes('resume')) {
    return { action: 'continue_learning' };
  }
  
  if (normalizedTranscript.includes('next') || normalizedTranscript.includes('next section')) {
    return { action: 'next_section' };
  }
  
  if (normalizedTranscript.includes('previous') || normalizedTranscript.includes('back section')) {
    return { action: 'previous_section' };
  }
  
  if (normalizedTranscript.includes('repeat') || normalizedTranscript.includes('say again')) {
    return { action: 'repeat' };
  }
  
  if (normalizedTranscript.includes('explain') || normalizedTranscript.includes('what does this mean')) {
    return { action: 'explain' };
  }
  
  // Subject selection commands
  const subjects = ['science', 'mathematics', 'math', 'social studies', 'social', 'english', 'hindi'];
  for (const subject of subjects) {
    if (normalizedTranscript.includes(subject)) {
      return { action: 'select_subject', parameters: { subject } };
    }
  }
  
  // Question and help commands
  if (normalizedTranscript.includes('ask question') || normalizedTranscript.includes('have a doubt')) {
    return { action: 'ask_question' };
  }
  
  if (normalizedTranscript.includes('help') || normalizedTranscript.includes('what can i do')) {
    return { action: 'help' };
  }
  
  // Assessment commands
  if (normalizedTranscript.includes('start assessment') || normalizedTranscript.includes('begin test')) {
    return { action: 'start_assessment' };
  }
  
  if (normalizedTranscript.includes('next question')) {
    return { action: 'next_question' };
  }
  
  if (normalizedTranscript.includes('previous question')) {
    return { action: 'previous_question' };
  }
  
  // Answer processing for assessments
  if (normalizedTranscript.includes('option') || normalizedTranscript.includes('choice')) {
    const optionMatch = normalizedTranscript.match(/option\s+(\d+)|choice\s+(\d+)|(\d+)/);
    if (optionMatch) {
      const optionNumber = parseInt(optionMatch[1] || optionMatch[2] || optionMatch[3]);
      return { action: 'select_option', parameters: { option: optionNumber } };
    }
  }
  
  if (normalizedTranscript.includes('true') || normalizedTranscript.includes('false')) {
    const isTrue = normalizedTranscript.includes('true');
    return { action: 'select_option', parameters: { option: isTrue ? 'true' : 'false' } };
  }
  
  // Progress and stats commands
  if (normalizedTranscript.includes('show progress') || normalizedTranscript.includes('my progress')) {
    return { action: 'show_progress' };
  }
  
  if (normalizedTranscript.includes('show stats') || normalizedTranscript.includes('statistics')) {
    return { action: 'show_stats' };
  }
  
  // Voice control commands
  if (normalizedTranscript.includes('stop listening') || normalizedTranscript.includes('stop voice')) {
    return { action: 'stop_voice' };
  }
  
  if (normalizedTranscript.includes('start listening') || normalizedTranscript.includes('start voice')) {
    return { action: 'start_voice' };
  }
  
  if (normalizedTranscript.includes('stop speaking') || normalizedTranscript.includes('stop talking')) {
    return { action: 'stop_speaking' };
  }
  
  // Time-based commands
  if (normalizedTranscript.includes('this week') || normalizedTranscript.includes('weekly')) {
    return { action: 'set_timeframe', parameters: { timeframe: 'week' } };
  }
  
  if (normalizedTranscript.includes('this month') || normalizedTranscript.includes('monthly')) {
    return { action: 'set_timeframe', parameters: { timeframe: 'month' } };
  }
  
  if (normalizedTranscript.includes('all time') || normalizedTranscript.includes('overall')) {
    return { action: 'set_timeframe', parameters: { timeframe: 'all' } };
  }
  
  // Completion commands
  if (normalizedTranscript.includes('mark complete') || normalizedTranscript.includes('done')) {
    return { action: 'mark_complete' };
  }
  
  if (normalizedTranscript.includes('finish') || normalizedTranscript.includes('complete')) {
    return { action: 'finish' };
  }
  
  // Retry commands
  if (normalizedTranscript.includes('try again') || normalizedTranscript.includes('retry')) {
    return { action: 'retry' };
  }
  
  if (normalizedTranscript.includes('restart') || normalizedTranscript.includes('start over')) {
    return { action: 'restart' };
  }
  
  return null;
};

export const getCommandHelp = (): string[] => {
  return [
    'Navigation: "go back", "dashboard", "progress"',
    'Learning: "start learning", "continue", "next", "previous", "repeat", "explain"',
    'Subjects: "science", "mathematics", "social studies", "english", "hindi"',
    'Questions: "ask question", "have a doubt", "help"',
    'Assessment: "start assessment", "option 1", "true", "false"',
    'Voice: "stop listening", "start voice", "stop speaking"',
    'Progress: "show progress", "this week", "this month"',
    'Actions: "mark complete", "try again", "restart"'
  ];
};

export const getContextualHelp = (currentPage: string): string[] => {
  switch (currentPage) {
    case 'dashboard':
      return [
        'Say a subject name to start learning',
        'Say "continue learning" to resume your last session',
        'Say "ask question" to get help with doubts',
        'Say "progress" to view your learning statistics'
      ];
    
    case 'learning':
      return [
        'Say "next" or "previous" to navigate sections',
        'Say "repeat" to hear the current section again',
        'Say "explain" for more detailed explanation',
        'Say "mark complete" when you finish a section'
      ];
    
    case 'assessment':
      return [
        'Say "option 1", "option 2", etc. for multiple choice',
        'Say "true" or "false" for true/false questions',
        'Provide detailed explanations for open-ended questions',
        'Say "next question" to move forward'
      ];
    
    case 'progress':
      return [
        'Say "this week", "this month", or "all time" to filter',
        'Say a subject name to focus on that subject',
        'Say "dashboard" to return to the main page'
      ];
    
    default:
      return getCommandHelp();
  }
};

export const validateCommand = (command: VoiceCommand, currentContext: string): boolean => {
  // Check if the command is valid for the current context
  const validActions = {
    dashboard: ['navigate', 'select_subject', 'ask_question', 'continue_learning', 'help'],
    learning: ['navigate', 'next_section', 'previous_section', 'repeat', 'explain', 'mark_complete', 'help'],
    assessment: ['navigate', 'start_assessment', 'select_option', 'next_question', 'previous_question', 'help'],
    progress: ['navigate', 'set_timeframe', 'show_progress', 'help'],
  };
  
  const contextActions = validActions[currentContext as keyof typeof validActions] || [];
  return contextActions.includes(command.action);
};

export const getCommandFeedback = (command: VoiceCommand): string => {
  switch (command.action) {
    case 'navigate':
      return `Navigating to ${command.parameters?.page || 'previous page'}`;
    case 'start_learning':
      return 'Starting your learning session';
    case 'continue_learning':
      return 'Continuing from where you left off';
    case 'next_section':
      return 'Moving to the next section';
    case 'previous_section':
      return 'Going back to the previous section';
    case 'repeat':
      return 'Repeating the current content';
    case 'explain':
      return 'Providing a detailed explanation';
    case 'select_subject':
      return `Opening ${command.parameters?.subject} lessons`;
    case 'ask_question':
      return 'I\'m ready to help with your questions';
    case 'start_assessment':
      return 'Starting the assessment';
    case 'select_option':
      return `Selected option ${command.parameters?.option}`;
    case 'mark_complete':
      return 'Marking this section as complete';
    case 'help':
      return 'Here are the available commands';
    default:
      return 'Command processed';
  }
};
