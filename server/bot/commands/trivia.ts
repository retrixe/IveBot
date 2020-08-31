import { Message, GuildTextableChannel } from 'eris'
import { Command, TriviaSession } from '../imports/types'
import fs from 'fs'
import { promisify } from 'util'

async function parseTriviaList (fileName: string) {
  const readFile = promisify(fs.readFile)
  const data = await readFile(`./triviaLists/${fileName}.txt`, 'utf8')
  const triviaList = data.split('\n')
  return triviaList
    .map(el => el.replace('\n', '').split('`'))
    .filter(el => el.length >= 2 && el[0])
    .map(el => ({
      question: el[0],
      answers: el.slice(1).map(ans => ans.trim())
    }))
}

export const handleTrivia: Command = {
  name: 'trivia',
  opts: {
    description: 'Start a trivia session',
    fullDescription: 'Start a trivia session\nDefault settings are:\nIve gains points: false\nSeconds to answer: 15\nPoints needed to win: 30\nReveal answer on timeout: true',
    usage: '/trivia <topic> (--bot-plays=true|false) (--time-limit=<time longer than 4s>) (--max-score=<points greater than 0>) (--reveal-answer=true|false)',
    example: '/trivia greekmyths --bot-plays=true',
    guildOnly: true,
    argsRequired: true
  },
  generator: async (message: Message, args: string[], { tempDB, client }) => {
    let botPlays = false
    let timeLimit = 15000
    let maxScore = 30
    let revealAnswer = true

    if (args.find(element => element.includes('--bot-plays='))) {
      if (args.find(element => element.includes('--bot-plays=')).split('=')[1] === 'true') {
        botPlays = true
      } else if (args.find(element => element === '--bot-plays=').split('=')[1] !== 'false') {
        return 'Invalid usage.'
      }
    }
    if (args.find(element => element.includes('--time-limit='))) {
      if (+args.find(element => element.includes('--time-limit=')).split('=')[1] > 4) {
        timeLimit = +args.find(element => element.includes('--time-limit=')).split('=')[1]
      } else {
        return 'Invalid usage'
      }
    }
    if (args.find(element => element.includes('--max-score='))) {
      if (+args.find(element => element.includes('--max-score=')).split('=')[1] > 0) {
        maxScore = +args.find(element => element.includes('--max-score')).split('=')[1]
      } else {
        return 'Invalid usage.'
      }
    }
    if (args.find(element => element.includes('--reveal-answer='))) {
      if (args.find(element => element.includes('--reveal-answer=')).split('=')[1] === 'false') {
        revealAnswer = false
      } else if (args.find(element => element === '--reveal-answer=').split('=')[1] !== 'true') {
        return 'Invalid usage.'
      }
    }
    if (args.length === 1 && ['scores', 'score', 'leaderboard'].includes(args[0])) {
      const session = tempDB.trivia[message.channel.id]
      if (session) {
        message.channel.createMessage(await session.sendScores())
      } else {
        return 'There is no trivia session ongoing in this channel.'
      }
    } else if (args.length === 1 && args[0] === 'list') {
      return 'Available trivia lists: \n\n-anime\n-artandliterature\n-cars\n-computers\n-disney\ndota2abilities\n-dota2items\n-elements\n-entertainment\n-finalfantasy\n-gameofthrones\n-games\n-general\n-greekmyth\n-harrypotter\n-leagueoflegends\n-leagueults\n-nba\n-overwatch\n-pokemon\n-slogans\n-sports\n-starwars\n-uscapitals\n-usflags\n-usmap\n-usstateabbreviations\n-warcraft\n-whosthatpokemon\n-worldcapitals\n-worldflgs\n-worldmap'
    } else if (args.length === 1 && args[0] === 'stop') {
      const session = tempDB.trivia[message.channel.id]
      const channel = message.channel as GuildTextableChannel
      if (session) {
        if (message.author === session.author || channel.permissionsOf(message.author.id).has('manageMessages')) {
          await session.endGame()
          return 'Trivia stopped.'
        } else {
          return 'You are not authorized to do that.'
        }
      } else {
        return 'There is no trivia session ongoing in this channel.'
      }
    } else if (args[0] !== ('scores' || 'score' || 'leaderboard' || 'stop' || 'list')) {
      const session = tempDB.trivia[message.channel.id]
      if (!session) {
        let triviaList
        try {
          triviaList = await parseTriviaList(args[0])
        } catch (err) {
          return 'That trivia list doesn\'t exist.'
        }
        const t = new TriviaSession(triviaList, message, botPlays, timeLimit, maxScore, revealAnswer, tempDB, client)
        tempDB.trivia[message.channel.id] = t
        t.newQuestion()
      } else {
        return 'A trivia session is already ongoing in this channel.'
      }
    } else {
      return 'Invalid usage.'
    }
  }
}
