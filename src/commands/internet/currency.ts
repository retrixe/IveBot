// All the types!
import type { Command } from '../../imports/types.ts'
// Get the NASA API token.
import { fixerApiKey } from '../../config.ts'
import fs from 'fs'

interface countriesInfo {
  name: string
  'alpha-2': string
  'alpha-3': string
  'country-code': number
  'iso_3166-2': string
  region: string
  'sub-region': string
  'intermediate-region': string
  'region-code': number
  'sub-region-code': number
  'intermediate-region-code': number
}
interface currenciesInfo {
  AlphabeticCode: string
  Currency: string
  Entity: string
  MinorUnit: number
  NumericCode: number
  WithdrawalDate: null
}

const countries = JSON.parse(
  await fs.promises.readFile('./src/data/countries.json', 'utf-8'),
) as countriesInfo[]
const currencies = JSON.parse(
  await fs.promises.readFile('./src/data/currencies.json', 'utf-8'),
) as currenciesInfo[]

function convertToSym(input: string): string {
  // For countries alpha codes.
  if (input.length === 3) {
    const info = countries.find(elem => elem['alpha-3'] === input)
    input = info ? info.name.toUpperCase().split(' ').join('') : input
  } else if (input.length === 2) {
    const info = countries.find(elem => elem['alpha-2'] === input)
    input = info ? info.name.toUpperCase().split(' ').join('') : input
  }
  // Find the matching Entity and return the currency code.
  const country = currencies.find(elem => elem.Entity.toUpperCase().split(' ').join('') === input)
  return country ? country.AlphabeticCode : input
}

// Initialize cache.
let currency: { timestamp: number; rates: Record<string, number> }
export const handleCurrency: Command = {
  name: 'currency',
  aliases: ['cur'],
  opts: {
    description: 'Convert a currency from one currency to another.',
    fullDescription: 'Convert a currency from one currency to another.',
    usage:
      '/currency (list) <currency symbol to convert from> <currency symbol to convert to> (amount, default: 1)',
    example: '/currency EUR USD 40',
  },
  generator: async (message, args) => {
    // Check cache if old, and refresh accordingly.
    if (!currency || Date.now() - currency.timestamp > 3600000) {
      // This just fetches the data and parses it to JSON.
      currency = (await (
        await fetch(`http://data.fixer.io/api/latest?access_key=${fixerApiKey}`)
      ).json()) as typeof currency
      currency.timestamp = Date.now() // To set the timestamp to the current time of the system.
      // to change syp value to blackmarket value
      const response = await fetch('https://sp-today.com/en/currency/us_dollar/city/damascus')
      const data = await response.text()
      // + 20 to skip the <span class="value"> part.
      const value = data.substring(data.search('<span class="value">') + 20).split('<')[0]
      currency.rates.SYP = Number(value) * currency.rates.USD
    }
    // For /currency list
    if (args.length === 1 && args[0].toLowerCase() === 'list') {
      return {
        content: '**List of symbols:**',
        embeds: [
          {
            description: Object.keys(currency.rates).toString().split(',').join(', '),
            color: 0x666666,
            title: '💲 Currency symbols',
            fields: [
              {
                name: 'Tip',
                value:
                  'Symbols are usually (but NOT ALWAYS) the country 2 letter code + the first letter of the currency name.',
              },
            ],
          },
        ],
      }
    }
    // Calculate the currencies to conver from and to, as well as the amount.
    if (args.length < 2)
      return { content: 'Invalid usage, use /help currency for proper usage.', error: true }
    let from = args[0].toUpperCase()
    let to = args[1].toUpperCase()
    // If input does not exist as currency, we check if user meant a country name or code instead.
    if (!currency.rates[from]) from = convertToSym(from)
    if (!currency.rates[to]) to = convertToSym(to)
    // Check if everything is in order.
    if (from.length !== 3 || !currency.rates[from])
      return { content: 'Invalid currency to convert from.', error: true }
    else if (to.length !== 3 || !currency.rates[to])
      return { content: 'Invalid currency to convert to.', error: true }
    else if (!args[2])
      args[2] = '1' // If no amount was provided, the amount should be one.
    else if (args[2].search(',') !== -1)
      args[2] = args[2].split(',').join('') // If user used commas, they should be removed.
    else if (args.length > 3)
      return { content: 'Enter a single number for currency conversion.', error: true }
    else if (isNaN(+args[2])) return { content: 'Enter a proper number to convert.', error: true }
    // Now we convert the amount.
    const convertedAmount = (currency.rates[to] / currency.rates[from]) * +args[2]
    const roundedOffAmount = Math.ceil(convertedAmount * Math.pow(10, 4)) / Math.pow(10, 4)
    return `**${from}** ${args[2]} = **${to}** ${roundedOffAmount}`
  },
}
