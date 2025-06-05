// All the types!
import type { Command } from '../../imports/types.ts'
// All the tools!
import moment from 'moment'
import { zeroWidthSpace, getIdFromMention } from '../../imports/tools.ts'

export const handleNamemc: Command = {
  name: 'namemc',
  aliases: ['nmc'],
  opts: {
    description: "A Minecraft user's previous usernames and skin.",
    fullDescription: 'Displays previous usernames and skins of a Minecraft player.',
    usage: '/namemc <premium Minecraft username>',
    example: '/namemc voldemort',
  },
  generator: async (message, args) => {
    if (args.length > 1) return 'Minecraft users cannot have spaces in their name.'
    try {
      // Fetch the UUID and name of the user and parse it to JSON.
      const member = message.member?.guild.members.get(getIdFromMention(args[0]))
      const username = member ? member.nick || member.username : args[0]
      const { id, name } = (await (
        await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`)
      ).json()) as { id?: string; name?: string }
      if (!id || !name) {
        return {
          content: 'Enter a valid Minecraft username (account must be premium)',
          error: true,
        }
      }
      // Fetch the previous names as well.
      try {
        const names: { name: string; changedToAt?: number }[] = [
          {
            name:
              'Currently, username history is not available. ' +
              'See: https://help.minecraft.net/hc/en-us/articles/8969841895693-Username-History-API-Removal-FAQ-',
          },
        ]
        /* await (await fetch(
          `https://api.mojang.com/user/profiles/${id}/names`
        )).json() as Array<{ name: string, changedToAt?: number }> */
        return {
          content: `**Minecraft history and skin for ${name}:**`,
          embeds: [
            {
              color: 0x00ae86,
              title: 'Skin and Name History',
              fields: [
                ...names.map(object => ({
                  name: object.name,
                  value: object.changedToAt
                    ? `Changed to this name on ${moment(object.changedToAt).format('dddd, MMMM Do YYYY, h:mm:ss A')}`
                    : zeroWidthSpace,
                })),
                { name: 'Skin', value: zeroWidthSpace },
              ],
              description: '**Name History**\n',
              image: { url: `https://mc-heads.net/body/${id}`, height: 216, width: 90 },
              footer: { text: 'Skin is recovered through https://mc-heads.net' },
            },
          ],
        }
      } catch (err) {
        return `Something went wrong 👾 Error: ${err}`
      }
    } catch {
      return { content: 'Enter a valid Minecraft username (account must be premium)', error: true }
    }
  },
}
