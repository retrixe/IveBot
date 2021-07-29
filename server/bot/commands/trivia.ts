import { Message, GuildTextableChannel, TextableChannel, User, EmbedOptions, Client } from 'eris'
import { Command, DB } from '../imports/types'
import { getInsult } from '../imports/tools'
import fs from 'fs'

async function parseTriviaList (fileName: string) {
  const data = await fs.promises.readFile(`./triviaLists/${fileName}.txt`, 'utf8')
  const triviaList = new Map<string, string[]>()
  data.split('\n').forEach(el => {
    const splitEl = el.split('`').map(ans => ans.trim()).filter(ans => !!ans)
    if (splitEl.length >= 2) triviaList.set(splitEl[0], splitEl.slice(1))
  })
  return triviaList
}

export class TriviaSession {
  settings: { maxScore: number, timeout: number, timeLimit: number, botPlays: boolean, revealAnswer: boolean }
  currentLine: {question: string, answers: string[]}
  channel: TextableChannel
  author: User
  message: Message
  questionList: {question: string, answers: string[]}[]
  scores: { [id: string]: number } = {}
  status = ''
  timer: number = null
  timeout: number = Date.now()
  count: number = 0
  tempDB: DB
  client: Client

  constructor (triviaList: Map<string, string[]>, message: Message, botPlays: boolean, timeLimit: number, maxScore: number, revealAnswer: boolean, tempDB: DB, client: Client) {
    this.channel = message.channel
    this.author = message.author
    this.message = message
    this.questionList = triviaList
    this.status = 'new question'
    this.settings = { maxScore: maxScore, timeout: 120000, timeLimit, botPlays, revealAnswer }
    this.tempDB = tempDB
    this.client = client
  }

  getScores () {
    const currentScores = Object.values(this.scores).sort((a: number, b: number) => b - a)
    const member = this.message.member.guild.members.get(this.client.user.id)
    const color = member ? (member.roles.map(i => member.guild.roles.get(i)).sort(
      (a, b) => a.position > b.position ? -1 : 1
    ).find(i => i.color !== 0) || { color: 0 }).color : 0
    const embed: EmbedOptions = {
      title: 'Scores',
      color,
      timestamp: new Date().toISOString(),
      fields: currentScores.map(score => ({
        name: Object.keys(this.scores).find(key => this.scores[key] === score),
        value: score.toString(),
        inline: true
      }))
    }
    return { embed }
  }

  async endGame () {
    this.status = 'stop'
    delete this.tempDB.trivia[this.channel.id]
    if (this.scores) await this.channel.createMessage(this.getScores())
  }

  async newQuestion () {
    for (let i of Object.values(this.scores)) {
      if (i === this.settings.maxScore) {
        await this.endGame()
        return true
      }
    }
    if (!this.questionList) {
      await this.endGame()
      return true
    }
    this.currentLine = this.questionList[Math.floor(Math.random() * this.questionList.length)]
    this.questionList.splice(this.questionList.indexOf(this.currentLine), 1)
    this.status = 'waiting for answer'
    this.count += 1
    this.timer = Date.now()
    await this.channel.createMessage(`**Question number ${this.count}!**\n\n${this.currentLine.question}`)

    while (this.status !== 'correct answer' && (Date.now() - this.timer) <= this.settings.timeLimit) {
      if (Date.now() - this.timeout >= this.settings.timeout) {
        const msg = `If you ${getInsult()}s aren't going to play then I might as well stop.`
        if (msg.includes('asss')) {
          msg.replace('asss', 'asses')
        }
        await this.channel.createMessage(msg)
        await this.endGame()
        return true
      }
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for answer or timeout
    }

    const revealMessages = ['I know this: ', 'Easy: ', 'Of course, it\'s: ']
    const failMessages = ['You suck at this', 'That was trivial, really', 'Moving on...']

    if (this.status === 'correct answer') {
      this.status = 'new question'
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (this.status !== 'stop') await this.newQuestion()
    } else if (this.status === 'stop') {
      return true
    } else {
      let message: string
      if (this.settings.revealAnswer) {
        message = revealMessages[Math.floor(Math.random() * revealMessages.length)] + this.currentLine.answers[0]
      } else {
        message = failMessages[Math.floor(Math.random() * failMessages.length)]
      }
      if (this.settings.botPlays) {
        message += '\n**+1** for me!'
        if (!this.scores['Jony Ive']) {
          this.scores['Jony Ive'] = 1
        } else {
          this.scores['Jony Ive'] += 1
        }
      }
      this.currentLine = null
      await this.channel.createMessage(message)
      await this.channel.sendTyping()
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (this.status !== 'stop') await this.newQuestion()
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
      if (!answer.includes(' ')) { // Strict answer checking for one word answers
        const guessWords = guess.split(' ')
        for (let j = 0; j < guessWords.length; j++) {
          if (guessWords[j] === answer) {
            hasGuessed = true
          }
        }
      } else if (guess.includes(answer)) { // The answer has spaces, checking isn't as strict
        hasGuessed = true
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
      await this.channel.createMessage(`You got it ${message.author.username}! **+1** to you!`)
    }
  }
}

export const handleTrivia: Command = {
  name: 'trivia',
  opts: {
    description: 'Start a trivia session',
    fullDescription: 'Start a trivia session\nDefault settings are:\nIve gains points: false\nSeconds to answer: 15\nPoints needed to win: 30\nReveal answer on timeout: true',
    usage: '/trivia <topic> (--bot-plays=true|false) (--time-limit=<time longer than 4s>) (--max-score=<points greater than 0>) (--reveal-answer=true|false)\n During a trivia session, the following commands may also be run:\n/trivia score\n/trivia stop',
    example: '/trivia greekmyth --bot-plays=true',
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
        return 'Invalid usage. It must be either true or false.'
      }
    }
    if (args.find(element => element.includes('--time-limit='))) {
      if (+args.find(element => element.includes('--time-limit=')).split('=')[1] > 4) {
        timeLimit = +args.find(element => element.includes('--time-limit=')).split('=')[1]
      } else {
        return 'Invalid usage. It must be a number greater than 4.'
      }
    }
    if (args.find(element => element.includes('--max-score='))) {
      if (+args.find(element => element.includes('--max-score=')).split('=')[1] > 0) {
        maxScore = +args.find(element => element.includes('--max-score')).split('=')[1]
      } else {
        return 'Invalid usage. It must be a number greater than 0.'
      }
    }
    if (args.find(element => element.includes('--reveal-answer='))) {
      if (args.find(element => element.includes('--reveal-answer=')).split('=')[1] === 'false') {
        revealAnswer = false
      } else if (args.find(element => element === '--reveal-answer=').split('=')[1] !== 'true') {
        return 'Invalid usage. It must be either true or false.'
      }
    }
    if (args.length === 1 && ['scores', 'score', 'leaderboard'].includes(args[0])) {
      const session = tempDB.trivia[message.channel.id]
      if (session) {
        return session.getScores()
      } else {
        return 'There is no trivia session ongoing in this channel.'
      }
    } else if (args.length === 1 && args[0] === 'list') {
      let lists = await fs.promises.readdir('./triviaLists/')
      lists = lists.map(list => list.slice(0, -4))
      const member = message.member.guild.members.get(client.user.id)
      const color = member ? (member.roles.map(i => member.guild.roles.get(i)).sort(
        (a, b) => a.position > b.position ? -1 : 1
      ).find(i => i.color !== 0) || { color: 0 }).color : 0
      const embed: EmbedOptions = {
        title: 'Available trivia lists',
        color,
        fields: lists.map(name => ({ name, value: '_ _', inline: true }))
      }
      return { embed }
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
    } else {
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
        await t.newQuestion()
      } else {
        return 'A trivia session is already ongoing in this channel.'
      }
    }
  }
}
