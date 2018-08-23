import { getArguments } from '../imports/tools'
import { eval as eva } from 'mathjs'

// Zalgo characters.
const characters = [ // TODO de adaugat u0e49
  // upper characters
  '\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310', '\u0352',
  '\u0357', '\u0351', '\u0307', '\u0308', '\u030a', '\u0342', '\u0343', '\u0344', '\u034a',
  '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350', '\u0300', '\u0301', '\u030b',
  '\u030f', '\u0312', '\u0313', '\u0314', '\u033d', '\u0309', '\u0363', '\u0364', '\u0365',
  '\u0366', '\u0367', '\u0368', '\u0369', '\u036a', '\u036b', '\u036c', '\u036d', '\u036e',
  '\u036f', '\u033e', '\u035b', '\u0346', '\u031a',
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

export function handleChoose (message: string, sendResponse: Function) {
  // Is it used correctly?
  if (message.split('|').length === 1) {
    sendResponse('Correct usage: /choose item1|item2|...')
    return
  }
  const choices = getArguments(message).split('|')
  sendResponse(`I choose: ${choices[Math.floor(Math.random() * choices.length)]}`)
}

export function handleReverse (message: string, sendResponse: Function) {
  sendResponse(getArguments(message).split('').reverse().join(''))
}

export function handle8Ball (message: string, sendResponse: Function) {
  // Check for an argument.
  if (message.split(' ').length === 1) {
    sendResponse('Please ask the 8ball a question.')
    return
  }
  // Possible responses, taken from Diary Of A Wimpy Kid: Hard Luck.
  const responses = [
    'It is certain.', 'It is decidedly so.', 'Better not tell you now.',
    'My sources say no.', 'Without a doubt.', 'Concentrate and ask again.',
    'My reply is no.', 'No.', 'Yes, definitely.',
    'Ask again later.', 'Reply hazy, try again later.'
  ]
  // Respond.
  sendResponse(`The 🎱 has spoken.
8ball: ${responses[Math.floor(Math.random() * responses.length)]}`)
}

export function handleRepeat (message: string, sendResponse: Function) {
  // All arguments.
  const args: Array<string> = message.split(' ')
  // If there are not sufficient arguments or number of repeats is not a string.
  if (args.length <= 2 || isNaN(+args[1])) {
    sendResponse('Correct usage: /repeat <no of repeats> <words to repeat>')
    return
    // Prevent repeated message from exceeding 5000 characters.
  } else if (+args[1] * message.substring(8 + args[1].length + 1).length >= 2001) {
    sendResponse('To prevent spam, your excessive message has not been repeated.')
    return
  } else if (
    getArguments(getArguments(message)) === '_' ||
    getArguments(getArguments(message)) === '*' ||
    getArguments(getArguments(message)) === '~'
  ) {
    sendResponse('This is known to lag users and is disabled.')
    return
  }
  // Generate the repeated string.
  let generatedMessage = ''
  for (let x = 0; x < +args[1]; x++) {
    generatedMessage += message.substring(8 + args[1].length + 1)
  }
  sendResponse(generatedMessage)
}

export function handleZalgo (message: string, sendResponse: Function) {
  let textToZalgo = getArguments(message).split('')
  let newMessage = ''
  textToZalgo.forEach(element => {
    newMessage += element
    for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
      newMessage += characters[Math.floor(Math.random() * characters.length)]
    }
  })
  sendResponse(newMessage.length > 2000 ? getArguments(message) : newMessage)
}

export function handleDezalgo (message: string, sendResponse: Function) {
  let textToZalgo = getArguments(message).split('')
  let newMessage = ''
  textToZalgo.forEach(element => {
    if (characters.indexOf(element) === -1) newMessage += element
  })
  sendResponse(newMessage)
}

export function handleRandom (message: string, sendResponse: Function) {
  // Arguments.
  const args = getArguments(message).split(' ')
  // If argument length is 1 and the argument is a number..
  if (args.length === 1 && !isNaN(+args[0])) {
    const number = +args[0]
    sendResponse(Math.floor(Math.random() * 10) + number)
    return
    // If argument length is 2 and both arguments are numbers..
  } else if (args.length === 2 && !isNaN(+args[0]) && !isNaN(+args[1])) {
    const number1 = +args[0]
    const number2 = +args[1]
    sendResponse(Math.floor(Math.random() * (number2 - number1)) + number1)
    return
  } else if (args.length >= 1) {
    sendResponse('Correct usage: /random (optional start number) (optional end number)')
    return
  }
  sendResponse(Math.floor(Math.random() * 10))
}

export function handleCalculate (message: string, sendResponse: Function) {
  // Arguments.
  const args = getArguments(message).split(' ')
  // If argument length is 1 and the argument is a number..
  if (args.length === 0) {
    sendResponse('Specify an expression >_<')
    return
  }
  try {
    let expression = args.join(' ').split(',').join('.').split('÷').join('/')
    const result = eva(expression)
    sendResponse(result)
  } catch (e) {
    sendResponse('Invalid expression >_<')
  }
}
