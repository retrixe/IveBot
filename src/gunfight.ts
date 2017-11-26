// Our DB's shape.
type DB = {
  gunfight: Array<{
    challenged: string,
    challenger: string,
    accepted: boolean,
    randomWord: string
  }>
}

// Gunfight handler.
export function handleGunfight (command: string, mention: string, sendResponse: Function, db: DB) {
  const challenged = command.split(' ')[1]
  // Confirm an argument was passed.
  if (challenged === undefined) { sendResponse('Please specify a user to challenge >_>'); return }
  if (challenged === mention) { sendResponse('You cannot challenge yourself :P'); return }
  // Push to database.
  db.gunfight.push({ accepted: false, challenged, challenger: mention, randomWord: '' })
  sendResponse(`${challenged}, say /accept to accept the challenge.`)
  // The following will delete the gunfight if unaccepted within 30 seconds.
  setTimeout(() => {
    const gunfightPushed = db.gunfight.find((gunfight) => gunfight.challenged === challenged)
    if (gunfightPushed.accepted) return
    db.gunfight.splice(db.gunfight.indexOf(gunfightPushed), 1)
    sendResponse(`${mention}, your challenge to ${challenged} has been cancelled.`)
  }, 30000)
}

// Accept a gunfight request.
export function handleAccept (db: DB, mention: string, sendResponse: Function) {
  // Find the gunfight, if exists.
  const gunfightToAccept = db.gunfight.find((gunfight) => (
    gunfight.challenged === mention && !gunfight.accepted
  ))
  if (gunfightToAccept === undefined) return // Insert checks.
  // Accept the challenge.
  const indexOfGunfight = db.gunfight.indexOf(gunfightToAccept)
  const words = ['fire', 'water', 'gun', 'dot']
  db.gunfight[indexOfGunfight].accepted = true
  db.gunfight[indexOfGunfight].randomWord = words[Math.floor(Math.random() * words.length)]
  sendResponse(`Within 20 seconds, you will be asked to say a random word.`)
  // Let's wait for 30s and call a random word.
  setTimeout(
    () => {
      sendResponse('Say `' + db.gunfight[indexOfGunfight].randomWord + '`!')
    },
    Math.floor(Math.random() * 20000 + 1000)
  )
}

// Handle a possible response.
export function handleAccept() {
  return
}
