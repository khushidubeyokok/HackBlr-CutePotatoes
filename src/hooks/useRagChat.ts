import { useState } from 'react';

export const useRagChat = (subject: string, chapter: string) => {
    const [isLoading, setIsLoading] = useState(false);

    const ask = async (question: string): Promise<string> => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question, subject, chapter }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data.answer;
        } catch (error) {
            console.error('Error in useRagChat:', error);
            return "I'm sorry, I couldn't find an answer right now. Please try again.";
        } finally {
            setIsLoading(false);
        }
    };

    return { ask, isLoading };
};
