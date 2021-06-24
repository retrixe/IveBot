import { Message, GuildTextableChannel, TextableChannel, User, EmbedOptions, Client } from 'eris'
import { Command, DB } from '../imports/types'
import fs from 'fs'
import { promisify } from 'util'
import { getInsult } from '../imports/tools'

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

export class TriviaSession {
  revealMessages = ['I know this: ', 'Easy: ', 'Of course, it\'s: ']
  failMessages = ['You suck at this', 'That was trivial, really', 'Moving on...']
  settings: { maxScore: number, timeout: number, delay: number, botPlays: boolean, revealAnswer: boolean }
  currentLine: {question: string, answers: string[]}
  channel: TextableChannel
  author: User
  message: Message
  questionList: {question: string, answers: string[]}[]
  scores: { [char: string]: number } = {}
  status = ''
  timer: number
  timeout: number
  count: number
  tempDB: DB
  client: Client

  constructor (triviaList: {question: string, answers: string[]}[], message: Message, botPlays: boolean, timeLimit: number, maxScore: number, revealAnswers: boolean, tempDB: DB, client: Client) {
    this.channel = message.channel
    this.author = message.author
    this.message = message
    this.questionList = triviaList
    this.status = 'new question'
    this.settings = { maxScore: maxScore, timeout: 120000, delay: timeLimit, botPlays: botPlays, revealAnswer: revealAnswers }
    this.timer = null
    this.count = 0
    this.timeout = Date.now()
    this.tempDB = tempDB
    this.client = client
  }

  async sendScores () {
    const currentScores = Object.values(this.scores).sort((a: number, b: number) => b - a)
    const member = this.message.member.guild.members.get(this.client.user.id)
    const color = member ? (member.roles.map(i => member.guild.roles.get(i)).sort(
      (a, b) => a.position > b.position ? -1 : 1
    ).find(i => i.color !== 0) || { color: 0 }).color : 0
    const embed: EmbedOptions = {
      title: 'Scores',
      color,
      timestamp: new Date().toISOString(),
      fields: []
    }
    currentScores.forEach(score => {
      embed.fields.push({
        name: Object.keys(this.scores).find(key => this.scores[key] === score),
        value: String(score),
        inline: true
      })
    })
    return { embed }
  }

  async stopTrivia () {
    this.status = 'stop'
    delete this.tempDB.trivia[this.channel.id]
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
    delete this.tempDB.trivia[this.channel.id]
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
    for (let i of Object.values(this.scores)) {
      if (i === this.settings.maxScore) {
        this.endGame()
        return true
      }
    }
    if (!this.questionList) {
      this.endGame()
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
        const msg = `If you ${getInsult}s aren't going to play then I might as well stop.`
        if (msg.includes('asss')) {
          msg.replace('asss', 'asses')
        }
        this.channel.createMessage(msg)
        await this.stopTrivia()
        return true
      }
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for answer or timeout
    }

    if (this.status === 'correct answer') {
      this.status = 'new question'
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (this.status !== 'stop') { this.newQuestion() }
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
        message += '\n**+1** for me!'
        if (!this.scores['Jony Ive']) {
          this.scores['Jony Ive'] = 1
        } else {
          this.scores['Jony Ive'] += 1
        }
      }
      this.currentLine = null
      this.channel.createMessage(message)
      this.channel.sendTyping()
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (this.status !== 'stop') { this.newQuestion() }
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
      if (!(answer.includes(' '))) { // Strict answer checking for one word answers
        const guessWords = guess.split(' ')
        for (let j = 0; j < guessWords.length; j++) {
          if (guessWords[j] === answer) {
            hasGuessed = true
          }
        }
      } else {
        if (guess.includes(answer)) { // The answer has spaces, checkign isn't as strict
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

export const handleTrivia: Command = {
  name: 'trivia',
  opts: {
    description: 'Start a trivia session',
    fullDescription: 'Start a trivia session\nDefault settings are:\nIve gains points: false\nSeconds to answer: 15\nPoints needed to win: 30\nReveal answer on timeout: true',
    usage: '/trivia <topic> (--bot-plays=true|false) (--time-limit=<time longer than 4s>) (--max-score=<points greater than 0>) (--reveal-answer=true|false)\n During a trivia session, the following commands may also be run:\n/trivia score\n/trivia stop',
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
        message.channel.createMessage(await session.sendScores())
      } else {
        return 'There is no trivia session ongoing in this channel.'
      }
    } else if (args.length === 1 && args[0] === 'list') {
      const readdir = promisify(fs.readdir)
      let lists = await readdir('./triviaLists/')
      lists = lists.map(list => list.slice(0, -4))
      const member = message.member.guild.members.get(client.user.id)
      const color = member ? (member.roles.map(i => member.guild.roles.get(i)).sort(
        (a, b) => a.position > b.position ? -1 : 1
      ).find(i => i.color !== 0) || { color: 0 }).color : 0
      const embed: EmbedOptions = {
        title: 'Available trivia lists',
        color,
        fields: []
      }
      lists.forEach(list => {
        embed.fields.push({
          name: list,
          value: '_ _',
          inline: true
        })
      })
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
    } else if (args.length === 1) {
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
      return 'Invalid usage. Use `/help trivia` to see proper usage.'
    }
  }
}
