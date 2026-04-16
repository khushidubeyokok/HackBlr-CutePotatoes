require('dotenv').config();
const { QdrantClient } = require('@qdrant/js-client-rest');
const fetch = require('node-fetch');

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function getEmbedding(text) {
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
    const result = await response.json();
    return result[0];
}

const sampleData = [
    {
        subject: 'Science',
        chapter: 'Chapter-4',
        text: 'Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the aid of chlorophyll pigments. In plants, photosynthesis generally takes place in leaves, which contain chloroplasts.',
        metadata: { page: 146 }
    },
    {
        subject: 'Science',
        chapter: 'Chapter-4',
        text: 'Joseph Priestley (1733-1804) in 1770 performed a series of experiments that revealed the essential role of air in the growth of green plants. He discovered oxygen in 1774.',
        metadata: { page: 147 }
    },
    {
        subject: 'Mathematics',
        chapter: 'Chapter-1',
        text: 'Integers are a set of numbers that include whole numbers and their negative counterparts. They can be represented on a number line where positive integers are to the right of zero and negative integers are to the left.',
        metadata: { page: 1 }
    }
];

async function ingest() {
    try {
        console.log('Checking Qdrant connection...');
        await qdrant.getCollections(); // Simple ping

        console.log('Recreating collection with vector size 384...');
        await qdrant.recreateCollection('curriculum_chunks', {
            vectors: {
                size: 384,
                distance: 'Cosine'
            }
        });

        console.log('Ingesting sample data...');
        const points = [];
        for (let i = 0; i < sampleData.length; i++) {
            const item = sampleData[i];
            const vector = await getEmbedding(item.text);
            points.push({
                id: i + 1,
                vector: vector,
                payload: item
            });
        }

        await qdrant.upsert('curriculum_chunks', {
            wait: true,
            points: points
        });

        console.log('Ingestion complete!');
    } catch (error) {
        console.error('Ingestion failed:', error);
    }
}

ingest();
