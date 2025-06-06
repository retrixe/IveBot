// All the types!
import type { Command } from '../../imports/types.ts'
// All the tools!
import { formatError, zeroWidthSpace } from '../../imports/tools.ts'
// Get the NASA API token.
import { oxfordAPI } from '../../config.ts'

interface OxfordApiResponse {
  error?: string
  results: { lexicalEntries: { inflectionOf: { id: string }[] }[] }[]
}
type Categories = {
  lexicalCategory: { id: string; text: string }
  entries: {
    senses: {
      definitions: string[]
      shortDefinitions?: string[]
      examples: { text: string }[]
      registers: { id: string; text: string }[]
    }[]
  }[]
}[]
export const handleDefine: Command = {
  name: 'define',
  aliases: ['def'],
  opts: {
    description: 'Define a word in the Oxford Dictionary.',
    fullDescription: 'Define a word in the Oxford Dictionary.',
    usage: '/define <term>',
    example: '/define cyclone',
  },
  generator: async (message, args) => {
    // Setup request to find word.
    const headers = {
      app_id: oxfordAPI.appId,
      app_key: oxfordAPI.appKey,
      Accept: 'application/json',
    }
    // Search for the word, destructure for results, and then pass them on to our second request.
    try {
      const r = (await (
        await fetch(`https://od-api.oxforddictionaries.com/api/v2/lemmas/en/${args.join(' ')}`, {
          headers,
        })
      ).json()) as OxfordApiResponse
      // If the word doesn't exist in the Oxford Dictionary..
      if (
        r.error === 'No entries were found for a given inflected word' ||
        r.error?.startsWith('No lemma was found')
      ) {
        return { content: 'Did you enter a valid word? 👾', error: true }
      }
      try {
        // Here we get the dictionary entries for the specified word.
        const word = r.results[0].lexicalEntries[0].inflectionOf[0].id
        const { results } = (await (
          await fetch(
            `https://od-api.oxforddictionaries.com/api/v2/entries/en/${word}` +
              '?strictMatch=false&fields=definitions%2Cexamples',
            { headers },
          )
        ).json()) as { results: { lexicalEntries: Categories; word: string }[] }
        // Now we create an embed based on the 1st entry.
        const fields: { name: string; value: string; inline?: boolean }[] = []
        // Function to check for maximum number of fields in an embed, then push.
        const safePush = (object: { name: string; value: string }): void => {
          if (fields.length < 24) {
            fields.push(object)
          } else if (fields.length === 24)
            fields.push({ name: '...too many definitions.', value: zeroWidthSpace })
        }
        for (const result of results) {
          // Our super filter to remove what we don't need.
          const categories: Categories = result.lexicalEntries
          categories.forEach(
            // The function run on each category.
            category => {
              // If our field doesn't have the category name, we push the category name to it.
              if (
                !fields.includes({
                  name: '**' + category.lexicalCategory.text + '**',
                  value: zeroWidthSpace,
                })
              ) {
                // We don't push an empty field for the first element, else we do.
                if (fields.length !== 0) safePush({ name: zeroWidthSpace, value: zeroWidthSpace })
                safePush({
                  name: '**' + category.lexicalCategory.text + '**',
                  value: zeroWidthSpace,
                })
              }
              // Here we add every definition and example to the fields.
              let a = 1 // Index for the definition.
              category.entries.forEach(({ senses }) => {
                // Iterate over every definition.
                senses.forEach(sense => {
                  // Check if there is a definition.
                  if (!sense.shortDefinitions && !sense.definitions) return
                  // Then safely push the definition to the array.
                  safePush({
                    name:
                      `**${a}.** ` +
                      (sense.registers ? `(${sense.registers[0].text}) ` : '') +
                      (sense.shortDefinitions || sense.definitions)[0],
                    value: sense.examples?.[0].text
                      ? `e.g. ${sense.examples[0].text}`
                      : 'No example is available.',
                  })
                  // Add 1 to the index.
                  a += 1
                })
              })
            },
          )
        }
        return {
          content: `📕 **|** Definition of **${args.join(' ')}**:`,
          embeds: [
            {
              color: 0x7289da,
              type: 'rich',
              title: results[0].word,
              footer: { text: 'Powered by Oxford Dictionary \\o/' },
              fields,
            },
          ],
        }
      } catch (err) {
        return `Something went wrong 👾 Error: ${formatError(err)}`
      }
    } catch {
      return { content: 'Did you enter a valid word? 👾', error: true }
    }
  },
}
