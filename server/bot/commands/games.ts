import { Command } from '../imports/types'
import { eval as eva } from 'mathjs'

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
    usage: '/choose <option 1>|(option 2)|(option 3)...'
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
    usage: '/reverse <text>'
  },
  generator: (message, args) => args.join(' ').split('').reverse().join('')
}

export const handle8ball: Command = {
  name: '8ball',
  opts: {
    description: 'Random answers to random questions.',
    fullDescription: 'Random answers to random questions.',
    usage: '/8ball <question>',
    example: '/8ball Will I flunk my exam?',
    invalidUsageMessage: 'Please ask the 8ball a question.'
  },
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
    example: '/zalgo sup'
  },
  generator: (message, args) => {
    let textToZalgo = args.join(' ').split('')
    let newMessage = ''
    textToZalgo.forEach(element => {
      newMessage += element
      for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
        newMessage += characters[Math.floor(Math.random() * characters.length)]
      }
    })
    return newMessage.length >= 2000 ? args.join(' ') : newMessage
  }
}

export const handleDezalgo: Command = {
  name: 'dezalgo',
  aliases: ['dzgo'],
  opts: {
    description: 'The zalgo demon\'s writing.',
    fullDescription: 'Read the zalgo demon\'s writing.',
    usage: '/dezalgo <text>',
    example: '/dezalgo ḥ̛̓e̖l̽͞҉lͦͅoͥ'
  },
  generator: (message, args) => {
    let newMessage = ''
    args.join(' ').split('').forEach(element => {
      if (characters.indexOf(element) === -1) newMessage += element
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
    example: '/repeat 10 a'
  },
  generator: (message, args) => {
    // All arguments.
    const number = +args.shift()
    if (isNaN(number)) return 'Correct usage: /repeat <number of times> <string to repeat>'
    else if (number * args.join(' ').length >= 2001) {
      return { content: 'To prevent spam, your excessive message has not been repeated.', error: true }
    } else if (
      args.join(' ') === '_' || args.join(' ') === '*' || args.join(' ') === '~'
    ) return { content: 'This is known to lag users and is disabled.', error: true }
    // Generate the repeated string.
    let generatedMessage = ''
    for (let x = 0; x < number; x++) { generatedMessage += args.join(' ') }
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
    argsRequired: false
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

export const handleCalculate: Command = {
  name: 'calculate',
  aliases: ['calc', 'cal'],
  opts: {
    description: 'Calculate an expression.',
    fullDescription: `Calculate the value of an expression.
More info here: https://mathjs.org/docs/expressions/syntax.html`,
    usage: '/calculate <expression>',
    example: '/calculate 2 + 2',
    invalidUsageMessage: 'Specify an expression >_<'
  },
  generator: (message, args) => {
    try {
      return `${eva(args.join(' ').split(',').join('.').split('÷').join('/').toLowerCase())}`
    } catch (e) {
      return { content: 'Invalid expression >_<', error: true }
    }
  }
}

export const handleDistort: Command = {
  name: 'distort',
  opts: {
    description: 'Pretty distorted text.',
    fullDescription: 'Pretty distorted text.',
    usage: '/distort <text>',
    example: '/distort lol'
  },
  generator: (message, args) => args.map(i => (
    i.split('').join('*') + (i.length % 2 === 0 ? '*' : '')
  )).join(' ')
}
