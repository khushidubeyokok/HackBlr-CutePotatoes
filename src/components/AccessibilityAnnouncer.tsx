import React, { useEffect, useState } from 'react';

interface AccessibilityAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  delay?: number;
}

const AccessibilityAnnouncer: React.FC<AccessibilityAnnouncerProps> = ({
  message,
  priority = 'polite',
  delay = 0,
}) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setAnnouncement(message);
        
        // Clear the announcement after a short delay
        setTimeout(() => {
          setAnnouncement('');
        }, 1000);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [message, delay]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
};

export default AccessibilityAnnouncer;
