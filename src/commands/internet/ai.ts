import { Constants, type TextChannel } from '@projectdysnomia/dysnomia'
import type { SlashCommand } from '../../imports/types.ts'
import { openaiApiKey } from '../../config.ts'

const generator = async (query: string, userID: string, guildID?: string, reply?: string) => {
  // TODO: This should be configurable.
  let model = 'text-davinci-003'
  if (query.includes('--ada')) {
    query = query.replace('--ada', '')
    model = 'text-ada-001'
  } else if (query.includes('--babbage')) {
    query = query.replace('--babbage', '')
    model = 'text-babbage-001'
  } else if (query.includes('--curie')) {
    query = query.replace('--curie', '')
    model = 'text-curie-001'
  }
  let temperature = model === 'text-davinci-003' ? 0.9 : 0
  if (query.includes('--temp')) {
    const temp = /--temp ([0-9.]+)/.exec(query)
    if (temp) {
      temperature = parseFloat(temp[1])
      query = query.replace(temp[0], '')
    }
  }

  const request = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: query,
      max_tokens: 400,
      temperature,
      user: userID,
    }),
  })
  const response = (await request.json()) as { choices: { text: string }[] }
  if (response.choices.length === 0) {
    return 'OpenAI servers returned no response (likely rate-limited). Try again later?'
  }
  return {
    content: response.choices[0].text.trim(),
    messageReference: reply ? { messageID: reply } : undefined,
  }
}

export const handleAi: SlashCommand<{ query: string }> = {
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
        required: true,
      },
    ],
  },
  generator: async (message, args) =>
    await generator(
      args.join(' '),
      message.author.id,
      (message.channel as TextChannel).guild?.id,
      message.id,
    ),
  slashGenerator: async (interaction, { query }) => {
    await interaction.defer()
    return await generator(
      query,
      interaction.user?.id,
      (interaction.channel as TextChannel).guild?.id,
    )
  },
}
