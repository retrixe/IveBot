import * as fetch from 'isomorphic-unfetch'
import { getArguments, zeroWidthSpace } from '../imports/tools'
import * as moment from 'moment'
// Typings.
import { client, event } from '../imports/types'
// Get the NASA API token.
import 'json5/lib/require'
const { NASAtoken, weatherAPIkey, fixerAPIkey, oxfordAPI } = require('../../config.json5')

export function handleDefine (message: string, sendResponse: Function) {
  if (!getArguments(message)) {
    sendResponse('Enter a valid word for me to define.')
    return
  } else if (getArguments(message).toLowerCase() === 'ibu') {
    sendResponse('someone you do not deserve to know about, haha')
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
        .then((json: { results: Array<{ lexicalEntries: Array<{
        lexicalCategory: string,
        entries: Array<{ senses: Array<{
        definitions: Array<string>,
        short_definitions: Array<string>, examples: Array<{ text: string }>, registers: Array<string>
        }> }>
        }> }> }) => {
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
          sendResponse(`📕 **|** Definition of **${getArguments(message)}**:`, () => {}, {
            color: 0x7289DA,
            type: 'rich',
            title: getArguments(message),
            footer: { text: 'Powered by Oxford Dictionary \\o/' },
            fields
          })
        })
    })
}

export function handleUrban (message: string, sendResponse: Function) {
  // Fetch the definition.
  fetch(`http://api.urbandictionary.com/v0/define?term=${getArguments(message)}`)
  // Convert to JSON.
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
  // If there is a definition, it will be sent successfully.
    .then((json: { list: Array<{ definition: string }> }) => {
      try {
        let response = json.list[0].definition.trim()
        if (response.length > 1900) {
          const splitRes = response.split('')
          response = ''
          for (let i = 0; i < 595; i += 1) response += splitRes[i]
          response += '[...]'
        }
        sendResponse(`**🍸 Definition of ${getArguments(message)}:**`, () => {}, {
          color: 0x555555,
          description: response,
          footer: { text: 'Do not trust Urban Dictionary.' },
          title: getArguments(message)
        })
        // Else, there will be an exception thrown.
      } catch (err) {
        sendResponse('No definition was found.')
      }
    })
}

export function handleCat (message: string, sendResponse: Function) {
  // Fetch a cat.
  fetch(`http://aws.random.cat/meow`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((json: { file: string }) => sendResponse(json.file))
    .catch(() => {})
}

export function handleDog (message: string, sendResponse: Function) {
  if (getArguments(message).split(' ')[0].trim()) {
    fetch(`http://dog.ceo/api/breed/${getArguments(message).split(' ')[0]}/images/random`)
      .then((res: { json: Function }) => res.json())
      .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
      .then((json: { message: string }) => sendResponse(json.message))
  } else {
    // Fetch a dog.
    fetch(`http://dog.ceo/api/breeds/image/random`)
      .then((res: { json: Function }) => res.json())
      .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
      .then((json: { message: string }) => sendResponse(json.message))
  }
}

export function handleRobohash (message: string, sendResponse: Function) {
  // Get text to hash.
  let text: string|Array<string> = getArguments(message).split(' ')
  text.splice(0, 1)
  text = text.join('%20')
  // Send a robohash.
  if (getArguments(message).split(' ')[0] === 'robot') sendResponse(`https://robohash.org/${text}.png`)
  else if (getArguments(message).split(' ')[0] === 'monster') sendResponse(`https://robohash.org/${text}.png?set=set2`)
  else if (getArguments(message).split(' ')[0] === 'head') sendResponse(`https://robohash.org/${text}.png?set=set3`)
  else if (getArguments(message).split(' ')[0] === 'cat') sendResponse(`https://robohash.org/${text}.png?set=set4`)
  else {
    sendResponse('Proper usage: /robohash <robot, monster, head, cat> <text to robohash>')
  }
}

export function handleApod (message: string, sendResponse: Function) {
  // Check for date.
  const arrayOfDates = [
    moment.ISO_8601, moment.RFC_2822, 'Do M YYYY', 'Do MM YYYY', 'Do MMM YYYY',
    'Do MMMM YYYY', 'D M YYYY', 'D MM YYYY', 'D MMM YYYY', 'D MMMM YYYY'
  ]
  if (moment(getArguments(message), arrayOfDates).isValid()) {
    const date = moment(getArguments(message), arrayOfDates).format('YYYY-MM-DD')
    // Fetch a picture.
    fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}&date=${date}`)
      .then((res: { json: Function }) => res.json())
      .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
      .then((json: { url: string, title: string, explanation: string }
      ) => sendResponse('**' + json.title + '**\n' + json.explanation, () => '', {
        image: { url: json.url },
        color: 0x2361BE
      }))
    return
  } else if (getArguments(message)) {
    sendResponse('Invalid date. Sending today\'s APOD. ')
  }
  // Fetch a picture.
  fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASAtoken}`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((json: { hdurl: string, title: string, explanation: string }
    ) => sendResponse('**' + json.title + '**\n' + json.explanation, () => '', {
      image: { url: json.hdurl },
      color: 0x2361BE
    }))
}

// Weather command.
// This is the response we expect.
/* eslint-disable no-undef,camelcase,no-use-before-define */
type weather = { cod: string, coord: { lon: string, lat: string }, weather: Array<{
  main: string,
  description: string
}>, main: { temp: number, temp_min: number, temp_max: number, humidity: number, pressure: number },
  visibility: number, wind: { speed: number, deg: number },
  clouds: { all: number }, rain: { '3h': number }, snow: { '3h': number }
}
/* eslint-enable no-undef,camelcase,no-use-before-define */
// This is the weather handling function.
export function handleWeather (message: string, sendResponse: Function, client: client, channel: string) {
  fetch(`http://api.openweathermap.org/data/2.5/weather?q=${getArguments(message)}&appid=${weatherAPIkey}`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
    .then((json: weather) => {
      if (json.cod === '404') {
        sendResponse('Enter a valid city >_<')
      } else {
        client.sendMessage({
          embed: {
            color: 0x00AE86,
            type: 'rich',
            title: 'Weather',
            /* {"clouds":{"all":40},"sys":{"sunrise":1523078495,"sunset":1523126670}} */
            description: `
**Coordinates:** (longitude: ${json.coord.lon}) (latitude: ${json.coord.lat})
**Description:** ${json.weather[0].main} - ${json.weather[0].description}
**Temperature:** (avg: ${Math.floor(json.main.temp - 272.15)}) (max: ${Math.floor(json.main.temp_max - 272.15)}) (min: ${Math.floor(json.main.temp_min - 272.15)})
**Pressure:** ${json.main.pressure} millibars
**Humidity:** ${json.main.humidity}%
**Wind:** (speed: ${json.wind.speed} meter/sec) (direction: ${json.wind.deg} degree)\n` +
`${json.visibility ? `**Visibility:** ${json.visibility} meters` : ''}\n` +
`${json.clouds ? `**Cloud cover:** ${json.clouds.all}%` : ''}\n` +
`${json.rain ? `**Rain (past 3 hours):** ${json.rain['3h']}mm` : ''}\n` +
`${json.snow ? `**Snow (past 3 hours):** ${json.snow['3h']}mm` : ''}\n`,
            footer: { text: 'Weather data from https://openweathermap.org' }
          },
          message: `**🌇🌃🌁🌆 The weather for ${getArguments(message)}:**`,
          to: channel
        })
      }
    })
}

fetch(`http://data.fixer.io/api/latest?access_key=${fixerAPIkey}`)
  .then((res: { json: Function }) => res.json())
  .catch((err: string) => console.log(`Something went wrong 👾 Error: ${err}`))
  .then((json: { rates: { [index: string]: number }, timestamp: number }) => {
    exchangeRates = json
    exchangeRates.timestamp = Date.now()
  })
let exchangeRates: { timestamp: number, rates: { [index: string]: number } }
// Currency.
export function handleCurrency (message: string, sendResponse: Function) {
  if (!exchangeRates || Date.now() - exchangeRates.timestamp > 3600000) {
    fetch(`http://data.fixer.io/api/latest?access_key=${fixerAPIkey}`)
      .then((res: { json: Function }) => res.json())
      .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
      .then((json: { rates: { [index: string]: number }, timestamp: number }) => {
        exchangeRates = json
        exchangeRates.timestamp = Date.now()
      })
  }
  // Whee, currency conversion!
  const from = getArguments(message).split(' ')[0].toUpperCase()
  if (from === 'LIST') {
    sendResponse('**List of symbols:**\n' + Object.keys(exchangeRates.rates).toString().split(',').join(', '))
    return
  }
  const to = getArguments(message).split(' ')[1].toUpperCase()
  let amount = getArguments(getArguments(getArguments(message))).trim()
  if (from.length !== 3 || !exchangeRates.rates[from]) {
    sendResponse('Invalid currency to convert from.')
    return
  } else if (!to || to.length !== 3 || !exchangeRates.rates[to]) {
    sendResponse('Invalid currency to convert to.')
    return
  } else if (!amount) {
    amount = '1'
  } else if (amount && amount.split(' ').length !== 1) {
    sendResponse('Enter a single number for currency conversion.')
    return
  } else if (amount && isNaN(+amount)) {
    sendResponse('Enter a proper number to convert.')
    return
  }
  let converted: string|Array<string> =
    ((exchangeRates.rates[to] / exchangeRates.rates[from]) * +amount).toString().split('.')
  if (converted[1]) converted[1] = converted[1].substr(0, 4)
  converted = converted.join('.')
  sendResponse(`**${from}** ${amount} = **${to}** ${converted}`)
}

// Namemc.
export function handleNamemc (message: string, sendResponse: Function, client: client, channel: string) {
  if (getArguments(message).split(' ').length > 1) {
    sendResponse('Minecraft users cannot have spaces in their name.')
    return
  }
  fetch(`https://api.mojang.com/users/profiles/minecraft/${getArguments(message).trim()}`)
    .then((res: { json: Function }) => res.json())
    .catch((err: string) => { if (err) sendResponse(`Enter a valid Minecraft username (account must be premium)`) })
    .then((json1: { id: string, name: string }) => {
      fetch(`https://api.mojang.com/user/profiles/${json1.id}/names`)
        .then((res: { json: Function }) => res.json())
        .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
        .then((json2: Array<{ name: string, changedToAt?: number }>) => {
          let history = '\n'
          json2.forEach(object => {
            if (object.changedToAt) {
              history += `**-** Name: ${object.name}
  Changed to this name on ${moment(object.changedToAt).format('dddd, MMMM Do YYYY, h:mm:ss A')}\n`
            } else history += `**-** Name: ${object.name}\n`
          })
          if (json2.length === 1) history = 'Name has not been changed.\n'
          client.sendMessage({
            to: channel,
            message: '**Minecraft history and skin for ' + getArguments(message).trim() + ':**',
            embed: {
              color: 0x00AE86,
              type: 'rich',
              title: 'Skin and Name History',
              description: `
**Name History**
${history}
[**Skin**](https://mc-heads.net/body/${json1.id})\n
              `,
              image: {
                url: `https://mc-heads.net/body/${json1.id}`,
                height: 216,
                width: 90
              },
              footer: { text: 'Skin is recovered through https://mc-heads.net' }
            }
          })
        })
    })
}

type fifaData = { /* eslint-disable camelcase,no-undef */
  home_team: { goals: number, country: string, penalties: number },
  away_team: { goals: number, country: string, penalties: number },
  home_team_statistics: {
    yellow_cards: number, red_cards: number, fouls_committed: number,
    attempts_on_goal: number, on_target: number, num_passes: number, pass_accuracy: number,
    ball_possession: number, corners: number, offsides: number
  },
  away_team_statistics: {
    yellow_cards: number, red_cards: number, fouls_committed: number,
    attempts_on_goal: number, on_target: number, num_passes: number, pass_accuracy: number,
    ball_possession: number, corners: number, offsides: number
  },
  winner: string,
  fifa_id: string,
  datetime: string,
  status: 'completed'|string
} /* eslint-enable camelcase,no-undef */
export function handleFifalist (message: string, sendResponse: Function, client: client, event: event) {
  // Check for date.
  let when = getArguments(message).length
    ? getArguments(message).split(' ')[0] : 'today'
  if (when !== 'all' && when !== 'today') {
    sendResponse('Invalid usage: /fifalist (all|today)')
  }
  if (when === 'today') {
    fetch('https://worldcup.sfg.io/matches/today?by_date=DESC').then((a: { json: Function }) => a.json())
      .catch(() => sendResponse(`There are no matches scheduled today.`))
      .then((json: Array<fifaData>) => sendResponse('⚽ FIFA World Cup 2018 matches **today**:', () => {}, {
        fields: json.map(i => ({
          name: `${i.home_team.country} v. ${i.away_team.country} on ${moment(i.datetime).format('DD-MM-Y hh:mm A')}`,
          value: `**Winner: ${
            i.winner ? i.winner : 'TBD'
          } ${i.home_team.goals}-${i.away_team.goals}** | FIFA ID: ${i.fifa_id}`
        })),
        title: 'FIFA matches today',
        footer: { text: 'Tip: Use /fifaboard for stats.' },
        color: 0x010fff
      }))
  } else if (when === 'all') {
    fetch('https://worldcup.sfg.io/matches?by_date=DESC').then((a: { json: Function }) => a.json())
      .catch((err: string) => sendResponse(`Something went wrong 👾 Error: ${err}`))
      .then((json: Array<fifaData>) => {
        client.sendMessage({
          to: event.d.author.id,
          embed: {
            fields: json.map(i => ({
              name: `${i.home_team.country} v. ${i.away_team.country} on ${moment(i.datetime).format('DD-MM-Y hh:mm A')}`,
              value: `**Winner: ${
                i.winner ? i.winner : 'TBD'
              } ${i.home_team.goals}-${i.away_team.goals}** | FIFA ID: ${i.fifa_id}`
            })),
            title: 'Last 25 FIFA matches',
            footer: { text: 'Tip: Use /fifaboard for stats.' },
            color: 0x010fff
          }
        })
        sendResponse('⚽ **Last 25** FIFA World Cup 2018 matches DMed.')
      }).catch(() => {})
  }
}
export async function handleFifaboard (message: string, sendResponse: Function, client: client, event: event) {
  try {
    let initFetch: fifaData = (await (await fetch('https://worldcup.sfg.io/matches/current')).json())[0]
    if (!initFetch && !getArguments(message)) {
      sendResponse('There are no matches in progress, use /fifalist to check..'); return
    } else if (getArguments(message)) {
      initFetch = (await (await fetch('https://worldcup.sfg.io/matches?by_date=DESC')).json()).find(
        (i: fifaData) => i.fifa_id === getArguments(message) ||
          (i.home_team.country + '|' + i.away_team.country).toLowerCase() === getArguments(message).toLowerCase() ||
          (i.away_team.country + '|' + i.home_team.country).toLowerCase() === getArguments(message).toLowerCase()
      )
    }
    if (!initFetch) {
      sendResponse('Incorrect match provided, provide FIFA ID or Team1|Team2 e.g. Spain|Russia')
      return
    } else if (!initFetch.away_team_statistics && !initFetch.home_team_statistics) {
      initFetch.away_team_statistics = {
        yellow_cards: 0,
        red_cards: 0,
        fouls_committed: 0,
        attempts_on_goal: 0,
        on_target: 0,
        num_passes: 0,
        pass_accuracy: 0,
        ball_possession: 0,
        corners: 0,
        offsides: 0
      }
      initFetch.home_team_statistics = {
        yellow_cards: 0,
        red_cards: 0,
        fouls_committed: 0,
        attempts_on_goal: 0,
        on_target: 0,
        num_passes: 0,
        pass_accuracy: 0,
        ball_possession: 0,
        corners: 0,
        offsides: 0
      }
    }
    client.sendMessage({
      to: event.d.channel_id,
      // Content for match.
      embed: {
        color: 0xFF0000,
        title: `${initFetch.home_team.country} v. ${initFetch.away_team.country}`,
        fields: [{ name: '🏆 Winner', value: initFetch.winner || 'TBD' }, {
          name: `Score (${initFetch.home_team.country} - ${initFetch.away_team.country})`,
          value: `${initFetch.home_team.goals} - ${initFetch.away_team.goals}`,
          inline: true
        }, {
          name: 'Penalty shoot-out',
          value: initFetch.home_team.penalties && initFetch.away_team.penalties
            ? `${initFetch.home_team.penalties} - ${initFetch.away_team.penalties}` : 'None',
          inline: true
        }, {
          name: 'Fouls',
          value: `${initFetch.home_team_statistics.fouls_committed} - ${initFetch.away_team_statistics.fouls_committed}`,
          inline: true
        }, {
          name: 'Yellow Cards',
          value: `${initFetch.home_team_statistics.yellow_cards} - ${initFetch.away_team_statistics.yellow_cards}`,
          inline: true
        }, {
          name: 'Red Cards',
          value: `${initFetch.home_team_statistics.red_cards} - ${initFetch.away_team_statistics.red_cards}`,
          inline: true
        }, {
          name: `Shots`,
          value: `${initFetch.home_team_statistics.attempts_on_goal} - ${initFetch.away_team_statistics.attempts_on_goal}`,
          inline: true
        }, {
          name: `Shots On Target`,
          value: `${initFetch.home_team_statistics.on_target} - ${initFetch.away_team_statistics.on_target}`,
          inline: true
        }, {
          name: `Possesion`,
          value: `${initFetch.home_team_statistics.ball_possession}% - ${initFetch.away_team_statistics.ball_possession}%`,
          inline: true
        }, {
          name: `Passes`,
          value: `${initFetch.home_team_statistics.num_passes} - ${initFetch.away_team_statistics.num_passes}`,
          inline: true
        }, {
          name: `Pass Accuracy`,
          value: `${initFetch.home_team_statistics.pass_accuracy}% - ${initFetch.away_team_statistics.pass_accuracy}%`,
          inline: true
        }, {
          name: `Offsides`,
          value: `${initFetch.home_team_statistics.offsides} - ${initFetch.away_team_statistics.offsides}`,
          inline: true
        }, {
          name: `Corners`,
          value: `${initFetch.home_team_statistics.corners} - ${initFetch.away_team_statistics.corners}`,
          inline: true
        }],
        description: initFetch.status === 'completed'
          ? '⚽ FIFA match' : initFetch.status === 'future'
            ? '⚽ Future FIFA match' : '⚽ Live FIFA match 👏',
        footer: { text: 'FIFA ID: ' + initFetch.fifa_id }
      }
    }, async (err: string, res: { id: string, channel_id: string }) => {
      if (err) sendResponse(`Something went wrong 👾 Error: ${err}`)
      else if (initFetch.status === 'completed' || initFetch.status === 'future') return
      // Edits till full-time..
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 30000))
        initFetch = (await (await fetch('https://worldcup.sfg.io/matches/current')).json())[0]
        if (initFetch.status === 'completed' || initFetch.status === 'future') break
        client.editMessage({
          messageID: res.id,
          channelID: res.channel_id,
          embed: {
            color: 0xFF0000,
            title: `${initFetch.home_team.country} v. ${initFetch.away_team.country}`,
            fields: [{ name: '🏆 Winner', value: initFetch.winner || 'TBD' }, {
              name: `Score (${initFetch.home_team.country} - ${initFetch.away_team.country})`,
              value: `${initFetch.home_team.goals} - ${initFetch.away_team.goals}`,
              inline: true
            }, {
              name: 'Penalty shoot-out',
              value: initFetch.home_team.penalties && initFetch.away_team.penalties
                ? `${initFetch.home_team.penalties} - ${initFetch.away_team.penalties}` : 'None',
              inline: true
            }, {
              name: 'Fouls',
              value: `${initFetch.home_team_statistics.fouls_committed} - ${initFetch.away_team_statistics.fouls_committed}`,
              inline: true
            }, {
              name: 'Yellow Cards',
              value: `${initFetch.home_team_statistics.yellow_cards} - ${initFetch.away_team_statistics.yellow_cards}`,
              inline: true
            }, {
              name: 'Red Cards',
              value: `${initFetch.home_team_statistics.red_cards} - ${initFetch.away_team_statistics.red_cards}`,
              inline: true
            }, {
              name: `Shots`,
              value: `${initFetch.home_team_statistics.attempts_on_goal} - ${initFetch.away_team_statistics.attempts_on_goal}`,
              inline: true
            }, {
              name: `Shots On Target`,
              value: `${initFetch.home_team_statistics.on_target} - ${initFetch.away_team_statistics.on_target}`,
              inline: true
            }, {
              name: `Possesion`,
              value: `${initFetch.home_team_statistics.ball_possession}% - ${initFetch.away_team_statistics.ball_possession}%`,
              inline: true
            }, {
              name: `Passes`,
              value: `${initFetch.home_team_statistics.num_passes} - ${initFetch.away_team_statistics.num_passes}`,
              inline: true
            }, {
              name: `Pass Accuracy`,
              value: `${initFetch.home_team_statistics.pass_accuracy}% - ${initFetch.away_team_statistics.pass_accuracy}%`,
              inline: true
            }, {
              name: `Offsides`,
              value: `${initFetch.home_team_statistics.offsides} - ${initFetch.away_team_statistics.offsides}`,
              inline: true
            }, {
              name: `Corners`,
              value: `${initFetch.home_team_statistics.corners} - ${initFetch.away_team_statistics.corners}`,
              inline: true
            }],
            description: initFetch.status === 'completed'
              ? '⚽ FIFA match' : initFetch.status === 'future'
                ? '⚽ Future FIFA match' : '⚽ Live FIFA match 👏',
            footer: { text: 'FIFA ID: ' + initFetch.fifa_id }
          }
        })
      }
    })
  } catch (e) { sendResponse(`Something went wrong 👾 Error: ${e}`) }
}
