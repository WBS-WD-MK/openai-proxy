import { randomUUID } from 'crypto';
import ollama from 'ollama';
import ErrorResponse from './ErrorResponse.js';

export default class Ollama {
  chat = {
    completions: {
      async create({ messages, model, stream, format }) {
        if (!model) throw new ErrorResponse('400 you must provide a model parameter', 400);
        if (!messages) throw new ErrorResponse("400 Missing required parameter: 'messages'", 400);
        const response = await ollama.chat({
          model,
          messages,
          stream,
          format,
        });

        if (stream) {
          return this.createStream(response);
        }

        return {
          id: `chatcmpl-${randomUUID()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: response.message.content,
              },
              logprobs: null,
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
          system_fingerprint: 'fp_ollama',
        };
      },
      async *createStream(response) {
        for await (const part of response) {
          yield {
            id: `chatcmpl-${randomUUID()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: part.model,
            system_fingerprint: 'fp_ollama',
            choices: [
              {
                index: 0,
                delta: {
                  content: part.message.content,
                },
                logprobs: null,
                finish_reason: part.done ? 'stop' : null,
              },
            ],
          };
        }
      },
    },
  };
}
