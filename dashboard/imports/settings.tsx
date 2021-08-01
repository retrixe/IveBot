import React, { useState } from 'react'
import {
  Typography, Button, LinearProgress, Divider, Input, InputLabel, FormGroup, FormControlLabel,
  FormControl, FormHelperText, Switch, Select, MenuItem
} from '@material-ui/core'
import { gql, useMutation } from '@apollo/client'
import { JoinLeaveMessages, ServerInfo, ServerSettings } from './graphqlTypes'

const EDIT_SERVER_SETTINGS = gql`
  mutation EditServerSettings(
    $id: String!, $newSettings: EditServerSettingsInput!
  ) {
    editServerSettings(id: $id, newSettings: $newSettings) {
      id
      addRoleForAll
      joinAutorole
      ocrOnSend
      joinLeaveMessages {
        channel
        joinMessage
        leaveMessage
        banMessage
      }
    }
  }
`

const Settings = (props: { data: ServerSettings, server: ServerInfo }) => {
  const [editServerSettings, { loading, error }] = useMutation(EDIT_SERVER_SETTINGS)
  const [serverSettings, setServerSettings] = useState<ServerSettings>({ ...props.data })
  // useEffect(() => setServerSettings({ ...props.data }), [props.data])?

  const setJoinLeaveMessages = (e: Partial<JoinLeaveMessages>) => setServerSettings(s => ({
    ...s, joinLeaveMessages: { ...(s.joinLeaveMessages || {}), ...e }
  }))
  const setAddRoleForAll = (e: string) => setServerSettings(s => ({ ...s, addRoleForAll: e }))
  const setJoinAutorole = (e: string) => setServerSettings(s => ({ ...s, joinAutorole: e }))
  const toggleOcrOnSend = () => setServerSettings(s => ({ ...s, ocrOnSend: !s.ocrOnSend }))

  return (
    <>
      <br />
      <Typography variant='h6' gutterBottom>Public Roles</Typography>
      <Divider />
      <br />
      <Typography gutterBottom>
        {'Public roles enable members to add the roles listed to themselves without any \
          necessary permissions. This enables features such as colored roles or announcement \
          pings.'}
      </Typography>
      <Typography gutterBottom>
        Use | to separate roles. If a role contains |, it will not be added to the list.
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Role Names</InputLabel>
        <Input
          value={serverSettings.addRoleForAll || ''} fullWidth
          onChange={e => setAddRoleForAll(e.target.value)} margin='dense'
        />
        <FormHelperText>Leave blank to disable public roles</FormHelperText>
      </FormControl>
      <br /><br />
      <Typography variant='h6' gutterBottom>Join/Leave Actions</Typography>
      <Divider />
      <br />
      <Typography variant='subtitle1' gutterBottom>Join Autorole</Typography>
      <Typography gutterBottom>
        {'Join autorole automatically gives a joining person a specified role. \
          It is useful in giving members specified colors or in combination with public \
          roles by giving a person a high role.'}
      </Typography>
      <Typography gutterBottom>
        {'Use | to separate roles. If a role contains |, it will not be added. \
          Prefix role names with bot- for adding roles to bots automatically.'}
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Role Names</InputLabel>
        <Input
          value={serverSettings.joinAutorole || ''} fullWidth
          onChange={e => setJoinAutorole(e.target.value)} margin='dense'
        />
        <FormHelperText>Leave blank to disable autorole</FormHelperText>
      </FormControl>
      <br /><br /><Divider /><br />
      <Typography variant='subtitle1' gutterBottom>Join/Leave Messages</Typography>
      <Typography gutterBottom>
        {'Join/leave messages send a customized message whenever someone joins or leaves \
          \\o/'}
      </Typography>
      <Typography gutterBottom>Ensure the channel name is correct.</Typography>
      <FormControl fullWidth>
        <InputLabel>Channel Name</InputLabel>
        <Select
          value={serverSettings.joinLeaveMessages.channel || ''} fullWidth margin='dense'
          onChange={e => setJoinLeaveMessages({ channel: e.target.value as string })}
        >
          <MenuItem value=''><em>None</em></MenuItem>
          {props.server.channels.map(i => (
            <MenuItem value={i.id} key={i.id}>{i.name}</MenuItem>
          ))}
        </Select>
        <FormHelperText>Leave blank to disable join/leave messages</FormHelperText>
      </FormControl>
      <div style={{ height: 10 }} />
      <Typography gutterBottom>
        {'Use {un} for the username of the \
          joining/leaving user, {m} for mentioning them and {d} for their discriminator.'}
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Join Message</InputLabel>
        <Input
          value={serverSettings.joinLeaveMessages.joinMessage || ''} fullWidth
          onChange={e => setJoinLeaveMessages({ joinMessage: e.target.value })} margin='dense'
        />
      </FormControl>
      <div style={{ height: 10 }} />
      <FormControl fullWidth>
        <InputLabel>Leave Message</InputLabel>
        <Input
          value={serverSettings.joinLeaveMessages.leaveMessage || ''} fullWidth
          onChange={e => setJoinLeaveMessages({ leaveMessage: e.target.value })} margin='dense'
        />
      </FormControl>
      <div style={{ height: 10 }} />
      <FormControl fullWidth>
        <InputLabel>Ban Message</InputLabel>
        <Input
          value={serverSettings.joinLeaveMessages.banMessage || ''} fullWidth
          onChange={e => setJoinLeaveMessages({ banMessage: e.target.value })} margin='dense'
        />
      </FormControl>
      <br /><br />
      <Typography variant='h6' gutterBottom>Text Recognition on Image Send</Typography>
      <Divider />
      <FormGroup row>
        <FormControlLabel
          control={
            <Switch
              color='secondary' checked={serverSettings.ocrOnSend}
              onChange={() => toggleOcrOnSend()}
            />
          }
          label='Enable OCR on Send'
        />
      </FormGroup>
      <Typography gutterBottom>
        {'This option recognizes text from any image whenever an image is sent in any \
          channel and posts the result using /ocr.'}
      </Typography>
      <div style={{ height: 10 }} />
      <Button size='small'>Cancel</Button>
      <Button
        size='small' onClick={async () => {
          const newSettings: Partial<ServerSettings> = {
            ...serverSettings, joinLeaveMessages: { ...serverSettings.joinLeaveMessages }
          }
          delete newSettings.id
          delete newSettings.__typename
          if (newSettings.joinLeaveMessages?.__typename) delete newSettings.joinLeaveMessages.__typename
          await editServerSettings({ variables: { id: props.server.id, newSettings } })
        }}
      >Save
      </Button>
      {loading && <><br /><LinearProgress color='secondary' variant='query' /></>}
      {(error != null) && <><br /><Typography color='error'>Error :( Please try again</Typography></>}
    </>
  )
}

export default Settings
