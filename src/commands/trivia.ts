import type { Message, GuildTextableChannel, TextableChannel, User, EmbedOptions, Client } from '@projectdysnomia/dysnomia'
import type { Command, DB } from '../imports/types.js'
import { getInsult } from '../imports/tools.js'
import fs from 'fs'

async function parseTriviaList (fileName: string): Promise<Map<string, string[]>> {
  const data = await fs.promises.readFile(`./src/data/triviaLists/${fileName}.txt`, 'utf8')
  const triviaList = new Map<string, string[]>()
  data.split('\n').forEach(el => {
    const splitEl = el.split('`').map(ans => ans.trim()).filter(ans => !!ans)
    if (splitEl.length >= 2) triviaList.set(splitEl[0], splitEl.slice(1))
  })
  return triviaList
}

export class TriviaSession {
  settings: { maxScore: number, timeout: number, timeLimit: number, botPlays: boolean, revealAnswer: boolean }
  currentQuestion: [string, string[]]
  channel: TextableChannel
  author: User
  message: Message
  questionList: Map<string, string[]>
  scores: Record<string, number> = {}
  stopped = false
  timer: number | null = null
  timeout = Date.now()
  count = 0
  tempDB: DB
  client: Client

  constructor (triviaList: Map<string, string[]>, message: Message, botPlays: boolean, timeLimit: number, maxScore: number, revealAnswer: boolean, tempDB: DB, client: Client) {
    this.channel = message.channel
    this.author = message.author
    this.message = message
    this.questionList = triviaList
    this.settings = { maxScore, timeout: 120000, timeLimit, botPlays, revealAnswer }
    this.tempDB = tempDB
    this.client = client
  }

  getScores (addMedals = false): { embeds: EmbedOptions[] } {
    const currentScores = Object.entries(this.scores).sort(([, a], [, b]) => b - a)
    const medals: Record<string, string> = {}
    if (addMedals) {
      const maxReduce = (a: number, b: number): number => Math.max(a || 0, b || 0)
      const values = Object.values(this.scores)
      const first = values.reduce(maxReduce)
      const second = values.filter(num => num !== first).reduce(maxReduce, 0)
      const third = values.filter(num => num !== first && num !== second).reduce(maxReduce, 0)
      currentScores.forEach(([id, b]) => {
        medals[id] = first && b === first
          ? '🥇 '
          : second && b === second
            ? '🥈 '
            : third && b === third ? '🥉 ' : ''
      })
    }
    const member = this.message.member.guild.members.get(this.client.user.id)
    const color = member
      ? (member.roles.map(i => member.guild.roles.get(i)).sort(
          (a, b) => a.position > b.position ? -1 : 1
        ).find(i => i.color !== 0) || { color: 0 }).color
      : 0
    const embed: EmbedOptions = {
      title: 'Scores',
      color,
      timestamp: new Date().toISOString(),
      fields: currentScores.map(player => ({
        name: (medals[player[0]] || '') + this.message.member.guild.members.get(player[0]).username,
        value: player[1].toString(),
        inline: true
      }))
    }
    return { embeds: [embed] }
  }

  async endGame (): Promise<void> {
    this.stopped = true
    delete this.tempDB.trivia[this.channel.id]
    if (Object.keys(this.scores).length > 0) await this.channel.createMessage(this.getScores(true))
  }

  async newQuestion (): Promise<boolean> {
    for (const i of Object.values(this.scores)) {
      if (i === this.settings.maxScore) {
        await this.endGame()
        return true
      }
    }
    if (!this.questionList) {
      await this.endGame()
      return true
    }
    this.currentQuestion = Array.from(this.questionList.entries())[Math.floor(Math.random() * this.questionList.size)]
    this.questionList.delete(this.currentQuestion[0])
    this.count += 1
    this.timer = Date.now()
    await this.channel.createMessage(`**Question number ${this.count}!**\n\n${this.currentQuestion[0]}`)

    while (this.currentQuestion !== null && (Date.now() - this.timer) <= this.settings.timeLimit) {
      if (Date.now() - this.timeout >= this.settings.timeout) {
        await this.channel.createMessage(`If you ${getInsult(true)} aren't going to play then I might as well stop.`)
        await this.endGame()
        return true
      }
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for answer or timeout
    }

    const revealMessages = ['I know this: ', 'Easy: ', 'Of course, it\'s: ']
    const failMessages = ['You suck at this', 'That was trivial, really', 'Moving on...']

    if (this.currentQuestion === null) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (!this.stopped) await this.newQuestion()
    } else if (this.stopped) {
      return true
    } else {
      let message: string
      if (this.settings.revealAnswer) {
        message = revealMessages[Math.floor(Math.random() * revealMessages.length)] + this.currentQuestion[1][0]
      } else {
        message = failMessages[Math.floor(Math.random() * failMessages.length)]
      }
      if (this.settings.botPlays) {
        message += '\n**+1** for me!'
        if (!this.scores[this.client.user.id]) {
          this.scores[this.client.user.id] = 1
        } else {
          this.scores[this.client.user.id] += 1
        }
      }
      this.currentQuestion = null
      await this.channel.createMessage(message)
      await this.channel.sendTyping()
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (!this.stopped) await this.newQuestion()
    }
  }

  async checkAnswer (message: Message): Promise<boolean> {
    if (message.author.bot || this.currentQuestion === null) {
      return false
    }
    this.timeout = Date.now()
    let hasGuessed = false

    // TODO: fuse.js for better pattern matching.
    for (let i = 0; i < this.currentQuestion[1].length; i++) {
      const answer = this.currentQuestion[1][i].toLowerCase()
      const guess = message.content.toLowerCase()
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
      this.currentQuestion = null
      if (!this.scores[message.author.id]) {
        this.scores[message.author.id] = 1
      } else {
        this.scores[message.author.id] += 1
      }
      await this.channel.createMessage(`You got it ${message.author.username}! **+1** to you!`)
    }
  }
}

export const handleTrivia: Command = {
  name: 'trivia',
  opts: {
    description: 'Start a trivia game on a topic of your choice.',
    fullDescription: `Start a trivia game on a topic of your choice.
**Default settings:** IveBot plays: no, seconds to answer: 15, points to win: 30, reveal answer: yes`,
    usage: `/trivia <topic> (botplays(=true/false)) (revealanswer(=true/false)) (timelimit=<5 seconds or more>) (pointstowin=<1 point or more>)
**During a trivia game:** /trivia (scoreboard/score/scores or stop/end)
**To view available topics:** /trivia list`,
    example: '/trivia greekmyth botplays revealanswer=false timelimit=5 pointstowin=10',
    guildOnly: true,
    argsRequired: true
  },
  generator: async (message, args, { tempDB, client }) => {
    let botPlays = false
    let timeLimit = 15000
    let maxScore = 30
    let revealAnswer = true

    const botPlaysFlag = args.find(element => element.startsWith('botplays=') || element === 'botplays')
    if (botPlaysFlag) {
      if (botPlaysFlag.split('=')[1] === 'true' || botPlaysFlag === 'botplays') {
        botPlays = true
      } else if (botPlaysFlag.split('=')[1] !== 'false') {
        return 'Invalid usage. `botplays` must be either true or false.'
      }
    }
    const timeLimitFlag = args.find(element => element.startsWith('timelimit='))?.split('=')
    if (timeLimitFlag) {
      if (!isNaN(+timeLimitFlag[1]) && +timeLimitFlag[1] > 4) timeLimit = +timeLimitFlag[1] * 1000
      else return 'Invalid usage. `timelimit` must be a number greater than 4.'
    }
    const maxScoreFlag = args.find(element => element.startsWith('pointstowin='))?.split('=')
    if (maxScoreFlag) {
      if (+maxScoreFlag[1] > 0) maxScore = +maxScoreFlag[1]
      else return 'Invalid usage. `pointstowin` must be a number greater than 0.'
    }
    const revealAnswerFlag = args.find(element => element.startsWith('revealanswer=') || element === 'revealanswer')
    if (revealAnswerFlag) {
      if (revealAnswerFlag.split('=')[1] === 'false') {
        revealAnswer = false
      } else if (revealAnswerFlag.includes('=') && revealAnswerFlag.split('=')[1] !== 'true') {
        return 'Invalid usage. `revealanswer` must be either true or false.'
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
      const lists = await fs.promises.readdir('./src/data/triviaLists/')
      const member = message.member.guild.members.get(client.user.id)
      const color = member
        ? (member.roles.map(i => member.guild.roles.get(i)).sort(
            (a, b) => a.position > b.position ? -1 : 1
          ).find(i => i.color !== 0) || { color: 0 }).color
        : 0
      return {
        content: '❔ **Available trivia topics:**',
        embeds: [{ color, description: lists.map(name => `**${name.replace('.txt', '')}**`).join(', ') }]
      }
    } else if (args.length === 1 && (args[0] === 'stop' || args[0] === 'end')) {
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
