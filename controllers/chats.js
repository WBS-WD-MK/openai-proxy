import OpenAI from 'openai';
import OpenAIMock from '../utils/OpenAIMock.js';
import Ollama from '../utils/Ollama.js';
import asyncHandler from '../utils/asyncHandler.js';

export const createChat = asyncHandler(async (req, res) => {
  const {
    body: { stream, ...request },
    headers: { mode, provider },
  } = req;

  let aiProvider;
  if (provider === 'ollama') {
    aiProvider = new Ollama();
  } else {
    mode === 'production'
      ? (aiProvider = new OpenAI({ apiKey: process.env.OPEN_AI_APIKEY }))
      : (aiProvider = new OpenAIMock());
  }
  const completion = await aiProvider.chat.completions.create({
    stream,
    ...request,
  });

  if (stream) {
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
    });
    for await (const chunk of completion) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.end();
    res.on('close', () => res.end());
  } else {
    res.json(completion.choices[0]);
  }
});
