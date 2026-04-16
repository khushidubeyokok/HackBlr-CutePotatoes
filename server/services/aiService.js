const fetch = require('node-fetch');
const Groq = require('groq-sdk');
const { QdrantClient } = require('@qdrant/js-client-rest');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

const SYSTEM_PROMPT = "You are Drishti-Vani, an NCERT curriculum tutor. Answer only from the provided context. Be concise and plain-spoken for voice delivery — no markdown, no bullet points.";

/**
 * Get embeddings for a text using Hugging Face Inference API
 */
async function getEmbedding(text) {
    try {
        const response = await fetch(
            'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: [text] })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Hugging Face API error (${response.status}): ${errorText.substring(0, 100)}`);
        }

        const embeddings = await response.json();

        // Handle case where model is still loading
        if (embeddings.error && embeddings.estimated_time) {
            console.warn(`HF Model loading... retrying in ${embeddings.estimated_time}s`);
            return null;
        }

        return embeddings[0];
    } catch (error) {
        console.error('Embedding service error:', error.message);
        return null;
    }
}

/**
 * Perform full RAG search
 */
async function performRagSearch(question, subject, chapter) {
    const embedding = await getEmbedding(question);

    let context = "No specific textbook context available (Qdrant offline or AI error).";

    if (embedding) {
        try {
            const searchResult = await qdrant.search('curriculum_chunks', {
                vector: embedding,
                limit: 5,
                filter: {
                    must: [
                        { key: 'subject', match: { value: subject } },
                        { key: 'chapter', match: { value: chapter } }
                    ]
                }
            });
            if (searchResult && searchResult.length > 0) {
                context = searchResult.map(hit => hit.payload.text).join('\n\n');
            }
        } catch (qdrantError) {
            console.warn('Qdrant search failed, using basic fallback.');
        }
    }

    return await getChatCompletion(context, question);
}

/**
 * Get chat completion using Groq
 */
async function getChatCompletion(context, question) {
    try {
        const completion = await groq.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }
            ],
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Chat completion service error:', error.message);
        throw error;
    }
}

module.exports = {
    getEmbedding,
    performRagSearch,
    getChatCompletion
};
