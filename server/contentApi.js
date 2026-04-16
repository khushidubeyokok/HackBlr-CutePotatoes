const express = require('express');
const router = express.Router();

// Mock content structure (titles only for MVP)
const mockStructures = {
    'Science': {
        'Chapter-4': {
            title: 'Photosynthesis: in a nutshell',
            pageNumber: 146,
            imageUrl: '/ncert_science_sample_page.png',
            sections: [
                { id: 'nutshell', title: 'Photosynthesis in a nutshell', type: 'text' },
                { id: 'equation', title: 'Word equation of photosynthesis', type: 'diagram' },
                { id: 'scientist', title: 'Know a Scientist: Rustom Hormusji Dastur', type: 'text' },
                { id: 'gas-exchange', title: 'How do leaves exchange gases?', type: 'text' },
            ],
        },
        'Chapter-1': {
            title: 'MATTER IN OUR SURROUNDINGS',
            pageNumber: 1,
            imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
            sections: [
                { id: 'intro', title: 'Introduction to Matter', type: 'text' },
                { id: 'states', title: 'States of Matter', type: 'text' },
                { id: 'particles', title: 'Particle Nature of Matter', type: 'text' },
            ],
        }
    },
    'Mathematics': {
        'Chapter-1': {
            title: 'INTEGERS',
            pageNumber: 1,
            imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
            sections: [
                { id: 'intro', title: 'Introduction to Integers', type: 'text' },
                { id: 'number-line', title: 'Number Line', type: 'text' },
                { id: 'operations', title: 'Operations with Integers', type: 'text' },
            ],
        }
    }
};

router.get('/content', (req, res) => {
    const { subject, chapter } = req.query;
    const content = mockStructures[subject]?.[chapter];

    if (content) {
        res.json(content);
    } else {
        // Default fallback
        res.json({
            title: `${subject} - ${chapter}`,
            pageNumber: 1,
            imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
            sections: [
                { id: 'intro', title: 'Introduction', type: 'text' },
                { id: 'content', title: 'Chapter Content', type: 'text' },
            ],
        });
    }
});

module.exports = router;
