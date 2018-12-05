const { Collection } = require('eris')

/* eslint-disable typescript/no-explicit-any */
const roles = new Collection(Object)

const guild = { roles, ownerID: 'owner' }

export const owner: any = { guild, id: 'owner', roles: ['administratorRole'] }
export const mutedLow: any = { guild, id: 'mutedLow', roles: ['mutedLowRole'] }
export const mutedHigh: any = { guild, id: 'mutedHigh', roles: ['mutedHighRole'] }
export const regular: any = { guild, id: 'regular', roles: ['regularRole'] }

roles.add({ position: 0, name: 'Member', id: 'regularRole' })
roles.add({ position: 1, name: 'Muted', id: 'mutedLowRole' })
roles.add({ position: 2, name: 'Administrator', id: 'administratorRole' })
roles.add({ position: 3, name: 'Muted', id: 'mutedHighRole' })
