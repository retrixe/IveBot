// Our DB's shape.
type DB = { /* eslint-disable no-undef */
  gunfight: Array<{
    challenged: string,
    challenger: string,
    accepted: boolean,
    randomWord: string
  }>
} /* eslint-enable no-undef */

// Gunfight handler.
export function handleGunfight (command: string, userID: string, sendResponse: Function, db: DB) {
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
  // Push to database.
  db.gunfight.push({
    accepted: false,
    challenged: challengedID,
    challenger: userID,
    randomWord: ''
  })
  sendResponse(`${challenged}, say /accept to accept the challenge.`)
  // The following will delete the gunfight if unaccepted within 30 seconds.
  setTimeout(() => {
    // Find the gunfight we pushed.
    const gunfightPushed = db.gunfight.find((gunfight) => gunfight.challenged === challengedID)
    // If its accepted, do nothing.
    if (gunfightPushed.accepted) return
    // Remove the object and send a response.
    db.gunfight.splice(db.gunfight.indexOf(gunfightPushed), 1)
    sendResponse(`<@${userID}>, your challenge to ${challenged} has been cancelled.`)
  }, 30000)
}

// Accept a gunfight request.
export function handleAccept (db: DB, userID: string, sendResponse: Function) {
  // Find the gunfight, if exists.
  const gunfightToAccept = db.gunfight.find((gunfight) => (
    gunfight.challenged === userID && !gunfight.accepted
  ))
  if (gunfightToAccept === undefined) return // Insert checks.
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
      db.gunfight.splice(indexOfGunfight, 1)
    },
    Math.floor(Math.random() * 20000 + 1000)
  )
}
