import type { Command } from '../../imports/types.ts'
import moment from 'moment'
import { getIdFromMention, getInsult } from '../../imports/tools.ts'
import { Base, Constants, type InteractionDataOptionsString } from '@projectdysnomia/dysnomia'

export const handleCreationtime: Command = {
  name: 'creationtime',
  aliases: ['ct', 'creation', 'createdat', 'when'],
  opts: {
    description: 'Finds out when a Snowflake (e.g. user ID) was created.',
    fullDescription: 'Finds out when a Snowflake (e.g. user ID) was created.',
    usage: '/creationtime <ID or mention>',
    example: '/creationtime 383591525944262656',
    options: [
      {
        name: 'entities',
        description: 'The users, channels, roles and/or Discord IDs to get the creation time of.',
        required: true,
        type: Constants.ApplicationCommandOptionTypes.STRING,
      },
    ],
  },
  slashGenerator: async ({ data: { options } }) =>
    await handleCreationtime.commonGenerator(
      (options[0] as InteractionDataOptionsString).value
        .trim()
        .split(' ')
        .filter(arg => !!arg),
    ),
  generator: async (message, args) => await handleCreationtime.commonGenerator(args),
  commonGenerator: (args: string[]) => {
    if (args.length === 1) {
      // Just parse it normally.
      let id = args[0]
      id = isNaN(+id) ? getIdFromMention(args[0]) : id
      if (id.length < 17 || isNaN(+id)) {
        return { content: `Provide an valid ID or mention, you ${getInsult()}.`, error: true }
      }
      return moment(new Base(id).createdAt).format('YYYY/MM/DD, hh:mm:ss A')
    } else {
      const res = args
        .map(mention => {
          // Parse each ID.
          let id = mention
          id = isNaN(+id) ? getIdFromMention(mention) : id
          if (id.length < 17 || isNaN(+id)) {
            return mention + ': invalid!'
          }
          return mention + ': ' + moment(new Base(id).createdAt).format('YYYY/MM/DD, hh:mm:ss A')
        })
        .join('\n')
      return {
        content: res,
        allowedMentions: { users: false, roles: false, everyone: false },
      }
    }
  },
}
