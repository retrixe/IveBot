import * as fetch from 'isomorphic-unfetch'
import { getArguments, zeroWidthSpace } from '../imports/tools'
// Get the NASA API token.
import 'json5/lib/require'
import { oxfordAPI } from '../../../config.json5'

export function handleDefine (message: string, sendResponse: Function) {
  if (!getArguments(message)) {
    sendResponse('Enter a valid word for me to define.')
    return
  }
  // Fetch the definition.
  const headers = { 'app_id': oxfordAPI.appId, 'app_key': oxfordAPI.appKey, Accept: 'application/json' }
  fetch(`https://od-api.oxforddictionaries.com/api/v1/inflections/en/${getArguments(message)}`, {
    headers
  })
    // Convert to JSON.
    .then((res: { json: Function }) => res.json())
    // eslint-disable-next-line handle-callback-err
    .catch((err: string) => sendResponse(`Did you enter a valid word? 👾`))
    // If there is a definition, it will be sent successfully.
    .then((json: { results: Array<{ id: string }> }) => {
      if (!json) return
      let response = json.results[0].id
      fetch(`https://od-api.oxforddictionaries.com/api/v1/entries/en/${response}`, { headers })
        // Convert to JSON.
        .then((res: { json: Function }) => res.json())
        .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
        // If there is a definition, it will be sent successfully.
        .then((json: {
        results: Array<{
        lexicalEntries: Array<{
        lexicalCategory: string,
        entries: Array<{
        senses: Array<{
        definitions: Array<string>,
        short_definitions: Array<string>, examples: Array<{ text: string }>, registers: Array<string>
        }>
        }>
        }>
        }>
        }) => {
          let fields: Array<{ name: string, value: string, inline?: boolean }> = []
          json.results[0].lexicalEntries.forEach((element, index) => {
            if (fields.length === 24) {
              fields.push({
                name: '..too many definitions', value: 'More definitions will not be displayed.'
              })
            } else if (fields.length === 25) return
            fields.push({ name: '**' + element.lexicalCategory + '**', value: zeroWidthSpace })
            element.entries.forEach(element => element.senses.forEach((element, index) => {
              if (fields.length === 24) {
                fields.push({
                  name: '..too many definitions', value: 'More definitions will not be displayed.'
                })
              } else if (fields.length === 25) return
              let i = ''
              if (element.registers) i += `(${element.registers[0]})`
              const shouldExample = element.examples && element.examples[0].text
              if (!element.short_definitions && !element.definitions) return
              const definition = element.short_definitions ? element.short_definitions[0]
                : element.definitions[0]
              fields.push(shouldExample ? {
                name: `**${index + 1}.** ${i} ${definition}`,
                value: `e.g. ${element.examples[0].text}`
              } : {
                name: `**${index + 1}.** ${i} ${definition}`,
                value: 'No example is available.'
              })
            }))
            const emptyField = { name: zeroWidthSpace, value: zeroWidthSpace }
            if (index + 1 !== json.results[0].lexicalEntries.length) fields.push(emptyField)
          })
          sendResponse(`📕 **|** Definition of **${getArguments(message)}**:`, {
            color: 0x7289DA,
            type: 'rich',
            title: getArguments(message),
            footer: { text: 'Powered by Oxford Dictionary \\o/' },
            fields
          })
        })
    })
}
