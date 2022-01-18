import { Command } from '../imports/types.js'
import { Constants, InteractionDataOptionsInteger, InteractionDataOptionsString } from 'eris'

// Zalgo characters.
const characters = [
  // upper characters
  '\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310', '\u0352',
  '\u0357', '\u0351', '\u0307', '\u0308', '\u030a', '\u0342', '\u0343', '\u0344', '\u034a',
  '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350', '\u0300', '\u0301', '\u030b',
  '\u030f', '\u0312', '\u0313', '\u0314', '\u033d', '\u0309', '\u0363', '\u0364', '\u0365',
  '\u0366', '\u0367', '\u0368', '\u0369', '\u036a', '\u036b', '\u036c', '\u036d', '\u036e',
  '\u036f', '\u033e', '\u035b', '\u0346', '\u031a', '\u0e49',
  // middle characters
  '\u0315', '\u031b', '\u0340', '\u0341', '\u0358', '\u0321', '\u0322', '\u0327', '\u0328',
  '\u0334', '\u0335', '\u0336', '\u034f', '\u035c', '\u035d', '\u035e', '\u035f', '\u0360',
  '\u0362', '\u0338', '\u0337', '\u0361', '\u0489',
  // low characters
  '\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f', '\u0320',
  '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c', '\u032d', '\u032e',
  '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339', '\u033a', '\u033b', '\u033c',
  '\u0345', '\u0347', '\u0348', '\u0349', '\u034d', '\u034e', '\u0353', '\u0354', '\u0355',
  '\u0356', '\u0359', '\u035a', '\u0323'
]

export const handleChoose: Command = {
  name: 'choose',
  aliases: ['cho'],
  opts: {
    description: 'Choose between multiple options.',
    fullDescription: 'Choose between multiple options.',
    example: '/choose cake|ice cream|pasta',
    usage: '/choose <option 1>|(option 2)|(option 3)...',
    options: [{
      name: 'choices',
      description: 'The choices to choose from. Each option should be separated like: item1|item2',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },
  slashGenerator: interaction => {
    const choices = (interaction.data.options[0] as InteractionDataOptionsString).value.split('|')
    return `I choose: ${choices[Math.floor(Math.random() * choices.length)]}`
  },
  generator: (message, args) => {
    // Is it used correctly?
    if (message.content.split('|').length === 1) return { content: 'Correct usage: /choose item1|item2|...', error: true }
    const choices = args.join(' ').split('|')
    return `I choose: ${choices[Math.floor(Math.random() * choices.length)]}`
  }
}

export const handleReverse: Command = {
  name: 'reverse',
  aliases: ['rev'],
  opts: {
    description: 'Reverse a sentence.',
    fullDescription: 'Reverse a sentence.',
    example: '/reverse hello',
    usage: '/reverse <text>',
    options: [{
      name: 'text',
      description: 'The text to reverse.',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },
  slashGenerator: interaction => (interaction.data.options[0] as InteractionDataOptionsString).value
    .split('').reverse().join(''),
  generator: (message, args) => args.join(' ').split('').reverse().join('')
}

export const handle8ball: Command = {
  name: '8ball',
  opts: {
    description: 'Random answers to random questions.',
    fullDescription: 'Random answers to random questions.',
    usage: '/8ball <question>',
    example: '/8ball Will I flunk my exam?',
    invalidUsageMessage: 'Please ask the 8ball a question.',
    options: [{
      name: 'question',
      description: 'The question you wish to ask the 8ball.',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },
  slashGenerator: true,
  generator: () => {
    // Possible responses, taken from Diary Of A Wimpy Kid: Hard Luck.
    const responses = [
      'It is certain.', 'It is decidedly so.', 'Better not tell you now.',
      'My sources say no.', 'Without a doubt.', 'Concentrate and ask again.',
      'My reply is no.', 'No.', 'Yes, definitely.',
      'Ask again later.', 'Reply hazy, try again later.'
    ]
    // Respond.
    return `The 🎱 has spoken.
8ball: ${responses[Math.floor(Math.random() * responses.length)]}`
  }
}

export const handleZalgo: Command = {
  name: 'zalgo',
  aliases: ['zgo'],
  opts: {
    description: 'The zalgo demon\'s writing.',
    fullDescription: 'The zalgo demon\'s handwriting.',
    usage: '/zalgo <text>',
    example: '/zalgo sup',
    options: [{
      name: 'text',
      description: 'The text to convert into the zalgo demon\'s handwriting.',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },
  generator: (message, args) => handleZalgo.commonGenerator(args.join(' ')),
  slashGenerator: interaction => handleZalgo.commonGenerator(
    (interaction.data.options[0] as InteractionDataOptionsString).value
  ),
  commonGenerator: (text: string) => {
    const textToZalgo = text.split('')
    let newMessage = ''
    textToZalgo.forEach(element => {
      newMessage += element
      for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
        newMessage += characters[Math.floor(Math.random() * characters.length)]
      }
    })
    return newMessage.length >= 2000 ? text : newMessage
  }
}

export const handleDezalgo: Command = {
  name: 'dezalgo',
  aliases: ['dzgo'],
  opts: {
    description: 'The zalgo demon\'s writing.',
    fullDescription: 'Read the zalgo demon\'s writing.',
    usage: '/dezalgo <text>',
    example: '/dezalgo ḥ̛̓e̖l̽͞҉lͦͅoͥ',
    options: [{
      name: 'text',
      description: 'The zalgo demon\'s handwriting to be converted to regular text.',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },
  slashGenerator: interaction => handleDezalgo.commonGenerator(
    (interaction.data.options[0] as InteractionDataOptionsString).value
  ),
  generator: (message, args) => handleDezalgo.commonGenerator(args.join(' ')),
  commonGenerator: (text: string) => {
    let newMessage = ''
    text.split('').forEach(element => {
      if (!characters.includes(element)) newMessage += element
    })
    return newMessage
  }
}

export const handleRepeat: Command = {
  name: 'repeat',
  aliases: ['rep'],
  opts: {
    description: 'Repeat a string.',
    fullDescription: 'Repeat a string.',
    usage: '/repeat <number of times> <string to repeat>',
    example: '/repeat 10 a',
    options: [{
      name: 'number',
      description: 'The number of times to repeat the text.',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.INTEGER
    }, {
      name: 'text',
      description: 'The text to repeat as many times as you want.',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },
  slashGenerator: interaction => {
    const number = (interaction.data.options.find(opt => opt.name === 'number') as
      InteractionDataOptionsInteger).value
    const text = (interaction.data.options.find(opt => opt.name === 'text') as
      InteractionDataOptionsString).value
    return handleRepeat.commonGenerator(number, text)
  },
  generator: (message, args) => {
    // All arguments.
    const number = +args.shift()
    if (isNaN(number)) return 'Correct usage: /repeat <number of times> <string to repeat>'
    return handleRepeat.commonGenerator(number, args.join(' '))
  },
  commonGenerator: (number: number, text: string) => {
    if (number * text.length >= 2001) {
      return { content: 'To prevent spam, your excessive message has not been repeated.', error: true }
    } else if (text === '_' || text === '*' || text === '~') {
      return { content: 'This is known to lag users and is disabled.', error: true }
    }
    let generatedMessage = ''
    for (let x = 0; x < number; x++) { generatedMessage += text }
    return generatedMessage
  }
}

export const handleRandom: Command = {
  name: 'random',
  aliases: ['rand'],
  opts: {
    description: 'Return a random number.',
    fullDescription: 'Returns a random number, by default between 0 and 10.',
    usage: '/random (starting number) (ending number)',
    example: '/random 1 69',
    argsRequired: false,
    options: [{
      name: 'start',
      description: 'The number which the random number should be higher than or equal to.',
      required: false,
      type: Constants.ApplicationCommandOptionTypes.INTEGER
    }, {
      name: 'end',
      description: 'The number which the random number should be lower than.',
      required: false,
      type: Constants.ApplicationCommandOptionTypes.INTEGER
    }]
  },
  slashGenerator: interaction => {
    const start = (interaction.data.options.find(option => option.name === 'start') as
      InteractionDataOptionsInteger)?.value
    const end = (interaction.data.options.find(option => option.name === 'end') as
      InteractionDataOptionsInteger)?.value
    if (typeof start === 'number' && typeof end === 'number') {
      return `The number.. is.. ${Math.floor(Math.random() * (end - start)) + start}`
    } else if (typeof end === 'number') {
      return `The number.. is.. ${Math.floor(Math.random() * end)}`
    } else if (typeof start === 'number') {
      return { content: 'You must provide an end number if providing a start number.', error: true }
    } else return `The number.. is.. ${Math.floor(Math.random() * 10)}`
  },
  generator: (message, args) => {
    // If argument length is 1 and the argument is a number..
    if (args.length === 1 && !isNaN(+args[0])) {
      const number = +args[0]
      return `The number.. is.. ${Math.floor(Math.random() * number)}`
      // If argument length is 2 and both arguments are numbers..
    } else if (args.length === 2 && !isNaN(+args[0]) && !isNaN(+args[1])) {
      const number1 = +args[0]
      const number2 = +args[1]
      return `The number.. is.. ${Math.floor(Math.random() * (number2 - number1)) + number1}`
    } else if (args.length >= 1) {
      return { content: 'Correct usage: /random (optional start number) (optional end number)', error: true }
    }
    return `The number.. is.. ${Math.floor(Math.random() * 10)}`
  }
}

export const handleDistort: Command = {
  name: 'distort',
  opts: {
    description: 'Pretty distorted text.',
    fullDescription: 'Pretty distorted text.',
    usage: '/distort <text>',
    example: '/distort lol',
    options: [{
      name: 'text',
      description: 'The text to be distorted.',
      required: true,
      type: Constants.ApplicationCommandOptionTypes.STRING
    }]
  },
  slashGenerator: interaction => (interaction.data.options[0] as InteractionDataOptionsString).value
    .split(' ')
    .map((i: string) => (i.split('').join('*') + (i.length % 2 === 0 ? '*' : '')))
    .join(' '),
  generator: (message, args) => args.map(i => (
    i.split('').join('*') + (i.length % 2 === 0 ? '*' : '')
  )).join(' ')
}
