import { Constants, InteractionDataOptionsString } from 'eris'
import { Command } from '../imports/types.js'
import { openaiAPIkey } from '../config.js'
import fetch from 'node-fetch'

// TODO: Support switching between models: ada/babbage/davinci/curie
export const handleAi: Command = {
  name: 'ai',
  aliases: ['openai'],
  opts: {
    description: 'An interesting AI you can ask questions.',
    fullDescription: 'An interesting AI you can ask questions. Powered by OpenAI.',
    usage: '/ai <query>',
    example: '/ai how to make a sandwich',
    options: [
      {
        name: 'query',
        description: 'The query to ask the AI.',
        type: Constants.ApplicationCommandOptionTypes.STRING,
        required: true
      }
    ]
  },
  generator: (message, args) => handleAi.commonGenerator(args.join(' '), message.id),
  slashGenerator: async interaction => {
    await interaction.defer()
    return await handleAi.commonGenerator(
      (interaction.data.options[0] as InteractionDataOptionsString).value)
  },
  commonGenerator: async (query: string, reply?: string) => {
    const request = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiAPIkey}`
      },
      body: JSON.stringify({
        model: 'text-davinci-003',
        prompt: query,
        max_tokens: 400,
        temperature: 0
      })
    })
    const response = await request.json() as { choices: Array<{ text: string }> }
    return {
      content: response.choices[0].text.trim(),
      messageReference: reply ? { messageID: reply } : undefined
    }
  }
}
