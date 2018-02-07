export const getArguments = (message: string) => {
  const splitMessage = message.split(' ')
  splitMessage.splice(0, 1)
  return splitMessage.join(' ').trim()
}

export const getIdFromMention = (mention: string) => mention.substring(2, mention.length - 1).split('!').join('')
