import { getArguments } from '../imports/tools'

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
  } else if (+args[1] * message.substring(8 + args[1].length + 1).length >= 5001) {
    sendResponse('To prevent spam, your excessive message has not been repeated.')
    return
  }
  // Generate the repeated string.
  let generatedMessage = ''
  for (let x = 0; x < +args[1]; x++) {
    generatedMessage += message.substring(8 + args[1].length + 1)
  }
  sendResponse(generatedMessage)
}
