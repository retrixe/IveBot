import { IveBotCommand } from '../../imports/types'

export const handleWarn: IveBotCommand = (client, tempDB, DB) => ({
  name: 'warn',
  opts: {
    description: 'Warn someone.',
    fullDescription: 'Warn someone.',
    usage: '/warn <user by ID/username/mention> <reason>'
  },
  generator: (message, args) => {
    // Check user for permissions.
    if (!message.member.permission.has('manageMessages')) {
      return '**Thankfully, you don\'t have enough permissions for that, you ungrateful bastard.**'
    // Or if improper arguments were provided, then we must inform the user.
    } else if (args.length < 2) return 'Correct usage: /warn <user> <reason>'
  }
})
