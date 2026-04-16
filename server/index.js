require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const contentApi = require('./contentApi');
const { performRagSearch } = require('./services/aiService');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api', contentApi);

/**
 * Responsibility 1: RAG Query Endpoint
 */
app.post('/api/ask', async (req, res) => {
    const { question, subject, chapter } = req.body;
    try {
        const answer = await performRagSearch(question, subject, chapter);
        res.json({ answer });
    } catch (error) {
        console.error('Error in /api/ask:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

/**
 * Responsibility 2: VAPI Webhook Handler
 */
app.post('/api/vapi/webhook', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.sendStatus(200);

    // Handle tool-calls for RAG
    if (message.type === 'tool-calls') {
        const toolCall = message.toolCalls.find(tc => tc.function.name === 'lookupCurriculum');
        if (toolCall) {
            const { question, subject, chapter } = toolCall.function.arguments;
            try {
                const answer = await performRagSearch(question, subject, chapter);
                return res.json({
                    results: [{ toolCallId: toolCall.id, result: answer }]
                });
            } catch (error) {
                console.error('Error in VAPI tool-call:', error);
                return res.status(500).json({ error: 'Failed' });
            }
        }
    }

    // Handle session events
    if (message.type === 'end-of-call-report') {
        console.log('VAPI Call ended');
    }

    res.sendStatus(200);
});

/**
 * Responsibility 3: VAPI Assistant Token Endpoint
 */
app.get('/api/vapi/token', async (req, res) => {
    try {
        const response = await fetch('https://api.vapi.ai/call/web-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching VAPI token:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
