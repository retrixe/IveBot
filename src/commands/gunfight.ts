// Our DB's shape.
type DB = { /* eslint-disable no-undef */
  gunfight: Array<{
    challenged: string,
    challenger: string,
    accepted: boolean,
    randomWord: string,
    channelID: string
  }>
} /* eslint-enable no-undef */

// Gunfight handler.
export function handleGunfight (command: string, userID: string, sendResponse: Function, db: DB, channelID: string) {
  // Get challenged mention and ID.
  const challenged = command.split(' ')[1]
  const challengedID = challenged.substring(2, challenged.length - 1).split('!').join('')
  // Confirm an argument was passed.
  if (challenged === undefined || isNaN(+challengedID)) {
    sendResponse('Please specify a user to challenge >_>')
    return
  }
  // Challenging the bot and themselves.
  if (challengedID === userID) { sendResponse('You cannot challenge yourself :P'); return }
  if (challengedID === '383591525944262656') {
    sendResponse('Aw, how sweet. But I don\'t play with pathetic fools who try to fool me :>')
    return
  }
  // Do not challenge someone already in a gunfight.
  // Possible gunfights.
  const possibleGunfight = db.gunfight.find((gunfight) => gunfight.challenged === challengedID)
  if (possibleGunfight) {
    sendResponse('This user is already in a fight!')
    return
  }
  // Push to database.
  db.gunfight.push({
    accepted: false,
    challenged: challengedID,
    challenger: userID,
    randomWord: '',
    channelID
  })
  sendResponse(`${challenged}, say /accept to accept the challenge.`)
  // The following will delete the gunfight if unaccepted within 30 seconds.
  setTimeout(() => {
    // Find the gunfight we pushed.
    const gunfightPushed = db.gunfight.find((gunfight) => gunfight.challenged === challengedID)
    // Remove the object and send a response.
    if (!gunfightPushed.accepted) sendResponse(`<@${userID}>, your challenge to ${challenged} has been cancelled.`)
    db.gunfight.splice(db.gunfight.indexOf(gunfightPushed), 1)
  }, 30000)
}

// Accept a gunfight request.
export function handleAccept (db: DB, userID: string, sendResponse: Function, channelID: string) {
  // Find the gunfight, if exists.
  const gunfightToAccept = db.gunfight.find((gunfight) => (
    gunfight.challenged === userID && !gunfight.accepted
  ))
  if (gunfightToAccept === undefined) return // Insert checks.
  // Accept in same channelID.
  if (gunfightToAccept.channelID !== channelID) {
    sendResponse('Please accept any challenges in the same channel.')
    return
  }
  // Accept only if person is not in another gunfight.
  if (db.gunfight.find((gunfight) => (gunfight.challenged === userID)) !== gunfightToAccept) {
    sendResponse('You are already in a gunfight!')
    return
  }
  // Accept the challenge.
  const indexOfGunfight = db.gunfight.indexOf(gunfightToAccept)
  const words = ['fire', 'water', 'gun', 'dot']
  db.gunfight[indexOfGunfight].accepted = true
  db.gunfight[indexOfGunfight].randomWord = words[Math.floor(Math.random() * words.length)]
  sendResponse(`Within 20 seconds, you will be asked to say a random word.`)
  // Let's wait for random amount under 20s and call a random word.
  setTimeout(
    () => {
      sendResponse('Say `' + db.gunfight[indexOfGunfight].randomWord + '`!')
    },
    Math.floor(Math.random() * 20000 + 1000)
  )
}
