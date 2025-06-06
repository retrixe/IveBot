import type { Command } from '../../imports/types.ts'
import { execSync } from 'child_process'
import { host } from '../../config.ts'
import { formatError } from '../../imports/tools.ts'

export const handleRemoteexec: Command = {
  name: 'remoteexec',
  opts: {
    description: 'Execute a command on the host.',
    fullDescription: 'Execute a command on the host. Owner only command.',
    usage: '/remoteexec <command>',
    example: '/remoteexec killall node',
    requirements: {
      userIDs: [host],
    },
  },
  generator: (message, args) => {
    try {
      return execSync(args.join(' '), { encoding: 'utf8' })
    } catch (e) {
      return formatError(e)
    }
  },
}
