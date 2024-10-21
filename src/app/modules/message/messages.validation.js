const { z } = require('zod');

const messages = z.object({
  body: z.object({
    message: z.string().nonempty({ message: 'Message is required' }),
  }),
});

const MessageValidation = { messages };

module.exports = MessageValidation;
