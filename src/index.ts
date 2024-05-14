import express, { Request, Response } from 'express';
import { Midjourney } from 'midjourney';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Midjourney client
const client = new Midjourney({
    ServerId: process.env.SERVER_ID as string,
    ChannelId: process.env.CHANNEL_ID as string,
    SalaiToken: process.env.SALAI_TOKEN as string,
    Debug: false,
    Ws: true,
});

type simplifiedResponse = {
    id: string;
    flags: number;
    hash: string;
    uri: string;
}

// Initialize the Midjourney client
(async () => {
    try {
        await client.init();
        console.log('Midjourney client initialized successfully.');
    } catch (error) {
        console.error('Error initializing Midjourney client:', error);
    }
})();

// Route to handle 'imagine' requests
app.post('/imagine', async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).send({ error: 'Prompt is required' });
    }
    try {
        const imagineResult = await client.Imagine(prompt, (uri: string, progress: string) => {
            console.log('loading', uri, 'progress', progress);
        });
        if (!imagineResult) {
            return res.status(500).send({ error: 'No message from Imagine' });
        }
        const apiResponse: simplifiedResponse = {
            id: imagineResult.id as string,
            flags: imagineResult.flags,
            hash: imagineResult.hash as string,
            uri: imagineResult.uri,
        }
        res.send(apiResponse);
    } catch (error) {
        console.error('Error processing imagine request:', error);
        res.status(500).send({ error: 'Failed to process imagine request' });
    }
});

// Route to handle 'variation' requests
app.post('/variation', async (req: Request, res: Response) => {
    const { messageId, index, flags, hash } = req.body;
    if (!messageId || index || flags || hash === undefined) {
        return res.status(400).send({ error: 'Missing required parameters' });
    }
    try {
        const variationResult = await client.Variation({
            index,
            msgId: messageId,
            hash,
            flags,
            loading: (uri: string, progress: string) => {
                console.log('loading', uri, 'progress', progress);
            },
        });
        if (!variationResult) {
            return res.status(500).send({ error: 'No message from Variation' });
        }

        const apiResponse: simplifiedResponse = {
            id: variationResult.id as string,
            flags: variationResult.flags,
            hash: variationResult.hash as string,
            uri: variationResult.uri,
        }
        res.send(apiResponse);
    } catch (error) {
        console.error('Error processing variation request:', error);
        res.status(500).send({ error: 'Failed to process variation request' });
    }
});

// Route to handle 'upscale' requests
app.post('/upscale', async (req: Request, res: Response) => {
    const { messageId, index, flags, customId, hash } = req.body;
    if (!messageId || !flags || !customId || !hash || index === undefined) {
        return res.status(400).send({ error: 'Missing required parameters' });
    }
    try {
        const upscaleResult = await client.Upscale({
            index,
            msgId: messageId,
            hash,
            flags,
            loading: (uri: string, progress: string) => {
                console.log('loading', uri, 'progress', progress);
            },
        });
        if (!upscaleResult) {
            return res.status(500).send({ error: 'No message from Upscale' });
        }
        const apiResponse: simplifiedResponse = {
            id: upscaleResult.id as string,
            flags: upscaleResult.flags,
            hash: upscaleResult.hash as string,
            uri: upscaleResult.uri,
        }
        res.send(apiResponse);
    } catch (error) {
        console.error('Error processing upscale request:', error);
        res.status(500).send({ error: 'Failed to process upscale request' });
    }
});

app.post('/simpleimage', async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).send({ error: 'Prompt is required' });
    }
    try {
        // Step 1: Imagine
        const imagineResult = await client.Imagine(prompt, (uri: string, progress: string) => {
            console.log('loading', uri, 'progress', progress);
        });
        if (!imagineResult) {
            return res.status(500).send({ error: 'No message from Imagine' });
        }

        if (!imagineResult.id) {
            return res.status(500).send({ error: `Missing required message id: ${imagineResult.id}` });
        }

        // Step 2: Upscale the first image
        const upscaleResult = await client.Upscale({
            msgId: imagineResult.id,
            flags: imagineResult.flags,
            hash: imagineResult.hash as string,
            index: 1,
            loading: (uri: string, progress: string) => {
                console.log('loading', uri, 'progress', progress);
            },
        });
        if (!upscaleResult) {
            return res.status(500).send({ error: 'No message from Upscale' });
        }

        const apiResponse: simplifiedResponse = {
            id: upscaleResult.id as string,
            flags: upscaleResult.flags,
            hash: upscaleResult.hash as string,
            uri: upscaleResult.uri,
        }

        res.send(apiResponse);
    } catch (error) {
        console.error('Error processing simpleimage request:', error);
        res.status(500).send({ error: 'Failed to process simpleimage request' });
    }
});

// Route to handle 'custom zoom' requests
app.post('/zoomout', async (req: Request, res: Response) => {
    const { imagineId, flags, hash, level } = req.body;
    if (!imagineId || !flags || !prompt) {
        return res.status(400).send({ error: 'Missing required parameters' });
    }
    try {
        const zoomoutResult = await client.ZoomOut({
            msgId: imagineId,
            flags,
            hash,
            level,
            loading: (uri: string, progress: string) => {
                console.log('loading', uri, 'progress', progress);
            },
        });
        if (!zoomoutResult) {
            return res.status(500).send({ error: 'No message from ZoomOut' });
        }
        const apiResponse: simplifiedResponse = {
            id: zoomoutResult.id as string,
            flags: zoomoutResult.flags,
            hash: zoomoutResult.hash as string,
            uri: zoomoutResult.uri,
        }
        res.send(apiResponse);
    } catch (error) {
        console.error('Error processing zoomout request:', error);
        res.status(500).send({ error: 'Failed to process zoomout request' });
    }
});

// Additional routes can be defined similarly...

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
