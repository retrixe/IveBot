import test from 'ava'
import {
  handleReverse as hr, handle8Ball as h8, handleChoose as hc, handleRandom as hrand
} from '../../../lib/bot/commands/games'

const handleReverse = hr({}).generator
const handle8Ball = h8({}).generator
const handleChoose = hc({}).generator
const handleRandom = hrand({}).generator

test('/reverse works as expected', t => handleReverse('/reverse ab', result => t.is(result, 'ba')))
test('/8ball works as expected', t => handle8Ball('/8ball hi', result => {
  t.true(result.startsWith('The 🎱 has spoken.\n8ball:'))
}))
test('/choose works as expected', t => {
  handleChoose('/choose hi|hello', result => {
    t.true(result.startsWith('I choose: hi') || result.startsWith('I choose: hello'))
  })
  handleChoose('/choose hi', result => { t.is(result, 'Correct usage: /choose item1|item2|...') })
  handleChoose('/choose', result => { t.is(result, 'Correct usage: /choose item1|item2|...') })
})

test('/random works as expected', t => {
  handleRandom('/random', result => {
    const testArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    let pass = false
    for (let x = 0; x < testArray.length; x++) { if (result === testArray[x]) pass = true }
    t.true(pass)
  })
  handleRandom('/random 8', result => {
    const testArray = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    let pass = false
    for (let x = 0; x < testArray.length; x++) { if (result === testArray[x]) pass = true }
    t.true(pass)
  })
  handleRandom('/random 8 12', result => {
    const testArray = [8, 9, 10, 11, 12]
    let pass = false
    for (let x = 0; x < testArray.length; x++) { if (result === testArray[x]) pass = true }
    t.true(pass)
  })
})
