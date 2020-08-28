// Flow our types.
import { Client, Message, MessageContent, EmbedOptions, TextableChannel, User } from 'eris'
import CommandParser from '../client'
import { Db } from 'mongodb'
import { sleep, getInsult } from './tools'

export type DB = {
  gunfight: {
    [key: string]: {
      randomWord: string,
      timestamp: number,
      channelID: string,
      accepted: boolean,
      wordSaid: boolean
    }
  },
  say: {
    // Channels.
    [index: string]: string
  },
  trivia: {
    [index: string]: TriviaSession
  },
  mute: {
    // Servers with userIDs contained.
    [index: string]: string[]
  },
  link: {
    [index: string]: string
  },
  cooldowns: { request: string[] },
  leave: Array<string>
}

export type Context = { tempDB: DB, db: Db, commandParser: CommandParser, client: Client }
export type IveBotCommandGeneratorFunction = (msg: Message, args: string[], ctx: Context) => string | void | {
    content?: string;
    tts?: boolean;
    disableEveryone?: boolean;
    embed?: EmbedOptions;
} | Promise<MessageContent> | Promise<void>
export type IveBotCommandGenerator = IveBotCommandGeneratorFunction|MessageContent
export type Command = {
  opts: CommandOptions,
  aliases?: string[],
  name: string,
  generator: IveBotCommandGenerator,
  postGenerator?: (message: Message, args: string[], sent?: Message, ctx?: Context) => void
}
export type CommandOptions = {
  argsRequired?: boolean
  caseInsensitive?: boolean
  deleteCommand?: boolean
  errorMessage?: string
  invalidUsageMessage?: string
  guildOnly?: boolean
  dmOnly?: boolean
  description: string
  fullDescription: string
  usage: string
  example: string
  hidden?: boolean
  requirements?: {
    userIDs?: string[],
    roleNames?: string[],
    custom?: (message: Message) => boolean,
    permissions?: {},
    roleIDs?: string[]
  }
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

  constructor (triviaList: {question: string, answers: string[]}[], message: Message, botPlays: boolean, timeLimit: number, maxScore: number, revealAnswers: boolean, tempDB: DB) {
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
  }

  async sendScores () {
    const currentScores = Object.values(this.scores).sort((a: number, b: number) => b - a)
    const member = this.message.member.guild.members.find(i => i.user.id === '383591525944262656')
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
      await sleep(1000)
    }

    if (this.status === 'correct answer') {
      this.status = 'new question'
      await sleep(1000)
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
      await sleep(1000)
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
