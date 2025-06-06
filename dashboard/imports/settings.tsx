import React, { useState } from 'react'
import {
  Typography,
  Button,
  LinearProgress,
  Divider,
  InputLabel,
  FormGroup,
  FormControlLabel,
  FormControl,
  FormHelperText,
  MenuItem,
  Switch,
  Select,
  TextField,
} from '@mui/material'
import { gql, useMutation } from '@apollo/client'
import type { JoinLeaveMessages, ServerInfo, ServerSettings } from './graphqlTypes'

const EDIT_SERVER_SETTINGS = gql`
  mutation EditServerSettings($id: String!, $newSettings: EditServerSettingsInput!) {
    editServerSettings(id: $id, newSettings: $newSettings) {
      id
      publicRoles
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

const Settings = (props: { data: ServerSettings; server: ServerInfo }): React.JSX.Element => {
  const [editServerSettings, { loading, error }] = useMutation(EDIT_SERVER_SETTINGS)
  const [serverSettings, setServerSettings] = useState<ServerSettings>({ ...props.data })
  const [originalServerSettings, setOriginalServerSettings] = useState<ServerSettings>({
    ...props.data,
  })
  // useEffect(() => setServerSettings({ ...props.data }), [props.data])?

  const setJoinLeaveMessages = (e: Partial<JoinLeaveMessages>): void =>
    setServerSettings(s => ({
      ...s,
      joinLeaveMessages: { ...s.joinLeaveMessages, ...e },
    }))
  const setPublicRoles = (e: string): void => setServerSettings(s => ({ ...s, publicRoles: e }))
  const setJoinAutorole = (e: string): void => setServerSettings(s => ({ ...s, joinAutorole: e }))
  const toggleOcrOnSend = (): void => setServerSettings(s => ({ ...s, ocrOnSend: !s.ocrOnSend }))

  const handleSave = () => {
    const newSettings: Partial<ServerSettings> = {
      ...serverSettings,
      joinLeaveMessages: { ...serverSettings.joinLeaveMessages },
    }
    delete newSettings.id
    delete newSettings.__typename
    if (newSettings.joinLeaveMessages?.__typename) delete newSettings.joinLeaveMessages.__typename
    editServerSettings({ variables: { id: props.server.id, newSettings } })
      .then(() => setOriginalServerSettings(serverSettings))
      .catch(console.error)
  }

  return (
    <>
      <br />
      <Typography variant='h6' gutterBottom>
        Public Roles
      </Typography>
      <Divider />
      <br />
      <Typography gutterBottom>
        {
          'Public roles enable members to add the roles listed to themselves without any \
          necessary permissions. This enables features such as colored roles or announcement \
          pings.'
        }
      </Typography>
      <Typography gutterBottom>
        Use | to separate roles. If a role contains |, it will not be added to the list.
      </Typography>
      <TextField
        fullWidth
        margin='dense'
        label='Role Names'
        value={serverSettings.publicRoles || ''}
        onChange={e => setPublicRoles(e.target.value)}
        helperText='Leave blank to disable public roles'
      />
      <br />
      <Typography variant='h6' gutterBottom>
        Join/Leave Actions
      </Typography>
      <Divider />
      <br />
      <Typography variant='subtitle1' gutterBottom>
        Join Autorole
      </Typography>
      <Typography gutterBottom>
        {
          'Join autorole automatically gives a joining person a specified role. \
          It is useful in giving members specified colors or in combination with public \
          roles by giving a person a high role.'
        }
      </Typography>
      <Typography gutterBottom>
        {
          'Use | to separate roles. If a role contains |, it will not be added. \
          Prefix role names with bot- for adding roles to bots automatically.'
        }
      </Typography>
      <TextField
        fullWidth
        margin='dense'
        label='Role Names'
        value={serverSettings.joinAutorole || ''}
        onChange={e => setJoinAutorole(e.target.value)}
        helperText='Leave blank to disable autorole'
      />
      <br />
      <br />
      <Divider />
      <br />
      <Typography variant='subtitle1' gutterBottom>
        Join/Leave Messages
      </Typography>
      <Typography gutterBottom>
        {
          'Join/leave messages send a customized message whenever someone joins or leaves \
          \\o/'
        }
      </Typography>
      <Typography gutterBottom>Ensure the channel name is correct.</Typography>
      <FormControl fullWidth>
        <InputLabel>Channel Name</InputLabel>
        <Select
          value={serverSettings.joinLeaveMessages.channel || ''}
          fullWidth
          margin='dense'
          onChange={e => setJoinLeaveMessages({ channel: e.target.value })}
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          {props.server.channels.map(i => (
            <MenuItem value={i.id} key={i.id}>
              {i.name}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Leave blank to disable join/leave messages</FormHelperText>
      </FormControl>
      <div style={{ height: 10 }} />
      <Typography gutterBottom>
        {
          'Use {un} for the username of the \
          joining/leaving user, {m} for mentioning them and {d} for their discriminator.'
        }
      </Typography>
      <TextField
        fullWidth
        margin='dense'
        label='Join Message'
        value={serverSettings.joinLeaveMessages.joinMessage || ''}
        onChange={e => setJoinLeaveMessages({ joinMessage: e.target.value })}
      />
      <div style={{ height: 10 }} />
      <TextField
        fullWidth
        margin='dense'
        label='Leave Message'
        value={serverSettings.joinLeaveMessages.leaveMessage || ''}
        onChange={e => setJoinLeaveMessages({ leaveMessage: e.target.value })}
      />
      <div style={{ height: 10 }} />
      <TextField
        fullWidth
        margin='dense'
        label='Ban Message'
        value={serverSettings.joinLeaveMessages.banMessage || ''}
        onChange={e => setJoinLeaveMessages({ banMessage: e.target.value })}
      />
      <br />
      <br />
      <Typography variant='h6' gutterBottom>
        Text Recognition on Image Send
      </Typography>
      <Divider />
      <FormGroup row>
        <FormControlLabel
          control={
            <Switch
              color='secondary'
              checked={serverSettings.ocrOnSend}
              onChange={() => toggleOcrOnSend()}
            />
          }
          label='Enable OCR on Send'
        />
      </FormGroup>
      <Typography gutterBottom>
        {
          'This option recognizes text from any image whenever an image is sent in any \
          channel and posts the result using /ocr.'
        }
      </Typography>
      <div style={{ height: 10 }} />
      <Button size='small' onClick={() => setServerSettings(originalServerSettings)}>
        Cancel
      </Button>
      <Button size='small' onClick={handleSave}>
        Save
      </Button>
      {loading && (
        <>
          <br />
          <LinearProgress color='secondary' variant='query' />
        </>
      )}
      {error != null && (
        <>
          <br />
          <Typography color='error'>Error :( Please try again</Typography>
        </>
      )}
    </>
  )
}

export default Settings
