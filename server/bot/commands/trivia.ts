import { Message, GuildTextableChannel, TextableChannel, User } from 'eris'
import { Command } from '../imports/types'
import fs from 'fs'
import { promisify } from 'util'
import { sleep } from '../imports/tools'

const triviaSessions: TriviaSession[] = []

class TriviaSession {
  revealMessages = ['I know this: ', 'Easy: ', 'Of course, it\'s: ']
  failMessages = ['You suck at this', 'That was trivial, really', 'Moving on...']
  settings: { maxScore: number, timeout: number, delay: number, botPlays: boolean, revealAnswer: boolean }
  currentLine: {question: string, answers: string[]}
  channel: TextableChannel
  author: User
  questionList: {question: string, answers: string[]}[]
  scores: { [char: string]: number } = {}
  status = ''
  timer: number
  timeout: number
  count: number

  constructor (triviaList: {question: string, answers: string[]}[], message: Message, botPlays: boolean, timeLimit: number, maxScore: number, revealAnswers: boolean) {
    this.channel = message.channel
    this.author = message.author
    this.questionList = triviaList
    this.status = 'new question'
    this.settings = { maxScore: maxScore, timeout: 120000, delay: timeLimit, botPlays: botPlays, revealAnswer: revealAnswers }
    this.timer = null
    this.count = 0
    this.timeout = Date.now()
  }

  async sendScores () {
    let leaderboard: string = ''
    const currentScores = Object.values(this.scores).sort((a: number, b: number) => b - a)
    currentScores.forEach(score => {
      leaderboard += `${Object.keys(this.scores).find(key => this.scores[key] === score)}\t${score}\n`
    })
    return {
      embed: {
        title: 'Current Scores',
        color: 35327,
        timestamp: new Date().toISOString(),
        description: leaderboard
      }
    }
  }

  async stopTrivia () {
    this.status = 'stop'
    triviaSessions.splice(triviaSessions.indexOf(this))
    this.settings = {
      maxScore: 30,
      timeout: 120000,
      delay: 15000,
      botPlays: false,
      revealAnswer: true
    }
    this.scores = {}
  }

  async endGame () {
    this.status = 'stop'
    triviaSessions.splice(triviaSessions.indexOf(this))
    if (this.scores) { this.channel.createMessage(await this.sendScores()) }
    this.settings = {
      maxScore: 30,
      timeout: 120000,
      delay: 15000,
      botPlays: false,
      revealAnswer: true
    }
    this.scores = {}
  }

  async newQuestion () {
    Object.values(this.scores).forEach(async element => {
      if (element === this.settings.maxScore) {
        await this.endGame()
        return true
      }
    })
    if (!this.questionList) {
      await this.endGame()
      return true
    }
    this.currentLine = this.questionList[Math.floor(Math.random() * this.questionList.length)]
    this.questionList.splice(this.questionList.indexOf(this.currentLine), 1)
    this.status = 'waiting for answer'
    this.count += 1
    this.timer = Date.now()
    this.channel.createMessage(`**Question number ${this.count}!**\n\n${this.currentLine.question}`)

    while (this.status !== 'correct answer' && (Date.now() - this.timer) <= this.settings.delay) {
      if (Date.now() - this.timeout >= this.settings.timeout) {
        this.channel.createMessage('If you ungrateful bastards aren\'t going to play then I might as well stop.')
        await this.stopTrivia()
        return true
      }
      await sleep(1000)
    }

    if (this.status === 'correct answer') {
      this.status = 'new question'
      await sleep(1000)
      this.newQuestion()
    } else if (this.status === 'stop') {
      return true
    } else {
      let message: string
      if (this.settings.revealAnswer) {
        message = this.revealMessages[Math.floor(Math.random() * this.revealMessages.length)] + this.currentLine.answers[0]
      } else {
        message = this.failMessages[Math.floor(Math.random() * this.failMessages.length)]
      }
      if (this.settings.botPlays) {
        message += '**+1** for me!'
        this.scores['Jony Ive'] += 1
      }
      this.currentLine = null
      this.channel.createMessage(message)
      this.channel.sendTyping()
      await sleep(1000)
      this.newQuestion()
    }
  }

  checkAnswer (message: Message) {
    if (message.author.bot || this.currentLine === null) {
      return false
    }
    this.timeout = Date.now()
    let hasGuessed = false

    for (let i = 0; i < this.currentLine.answers.length; i++) {
      let answer = this.currentLine.answers[i].toLowerCase()
      let guess = message.content.toLowerCase()
      if (!(answer.includes(' '))) {
        const guessWords = guess.split(' ')
        for (let j = 0; j < guessWords.length; j++) {
          if (guessWords[j] === answer) {
            hasGuessed = true
          }
        }
      } else {
        if (guess.includes(answer)) {
          hasGuessed = true
        }
      }
    }

    if (hasGuessed) {
      this.currentLine = null
      this.status = 'correct answer'
      if (!this.scores[message.author.username]) {
        this.scores[message.author.username] = 1
      } else {
        this.scores[message.author.username] += 1
      }
      this.channel.createMessage(`You got it ${message.author.username}! **+1** to you!`)
    }
  }
}

function getTriviaByChannel (channel: TextableChannel) {
  for (let i = 0; i < triviaSessions.length; i++) {
    if (triviaSessions[i].channel === channel) {
      return triviaSessions[i]
    } else {
      return null
    }
  }
}

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
  generator: async (message: Message, args: string[]) => {
    let botPlays = false
    let timeLimit = 15000
    let maxScore = 30
    let revealAnswer = true

    if (args.find(element => element === '--bot-plays=')) {
      if (args.find(element => element === '--bot-plays=').split('=')[1] === 'true') {
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
    if (args.find(element => element === '--reveal-answer=')) {
      if (args.find(element => element === '--reveal-answer=').split('=')[1] === 'false') {
        revealAnswer = false
      } else if (args.find(element => element === '--reveal-answer=').split('=')[1] !== 'true') {
        return 'Invalid usage.'
      }
    }
    if (args.length === 1 && args[0] === ('scores' || 'score' || 'leaderboard')) {
      const session = getTriviaByChannel(message.channel)
      if (session) {
        message.channel.createMessage(await session.sendScores())
      } else {
        return 'There is no trivia session ongoing in this channel'
      }
    } else if (args.length === 1 && args[0] === 'list') {
      return 'Available trivia lists: \n\n-anime\n-artandliterature\n-cars\n-computers\n-disney\ndota2abilities\n-dota2items\n-elements\n-entertainment\n-finalfantasy\n-gameofthrones\n-games\n-general\n-greekmyth\n-harrypotter\n-leagueoflegends\n-leagueults\n-nba\n-overwatch\n-pokemon\n-slogans\n-sports\n-starwars\n-uscapitals\n-usflags\n-usmap\n-usstateabbreviations\n-warcraft\n-whosthatpokemon\n-worldcapitals\n-worldflgs\n-worldmap'
    } else if (args.length === 1 && args[0] === 'stop') {
      const session = getTriviaByChannel(message.channel)
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
      const session = getTriviaByChannel(message.channel)
      if (!session) {
        let triviaList
        try {
          triviaList = await parseTriviaList(args[0])
        } catch (err) {
          return 'That trivia list doesn\'t exist.'
        }
        const t = new TriviaSession(triviaList, message, botPlays, timeLimit, maxScore, revealAnswer)
        triviaSessions.push(t)
        t.newQuestion()
      } else {
        return 'A trivia session is already ongoing in this channel.'
      }
    } else {
      return 'Invalid usage.'
    }
  }
}
