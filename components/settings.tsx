import * as React from 'react'
import {
  Typography, Button, LinearProgress, Divider, Input, InputLabel, FormGroup, FormControlLabel,
  FormControl, FormHelperText, Switch
} from '@material-ui/core'
import { Mutation } from 'react-apollo'
import { gql } from 'apollo-boost'
// import TextField from 'material-ui/TextField'

/* eslint-disable quotes, no-multi-str, no-undef */
interface Props {
  data: { addRoleForAll: boolean, joinAutorole: string },
  token: string,
  server: string
}
interface State {
  role: boolean,
  joinAutorole: string
}
export default class Settings extends React.Component<Props, State> {
  constructor (props) {
    super(props); this.state = {
      role: this.props.data.addRoleForAll,
      joinAutorole: this.props.data.joinAutorole
    }
  }

  render () {
    const mutation = gql`
mutation variables($server: String!, $token: String!, $role: Boolean, $joinAutorole: String) {
  editServerSettings(input: {
    serverId: $server, linkToken: $token, addRoleForAll: $role, joinAutorole: $joinAutorole
  }) {
    addRoleForAll
    joinAutorole
  }
}
    `
    return (
      <Mutation mutation={mutation} variables={{
        token: this.props.token,
        role: this.state.role,
        server: this.props.server,
        joinAutorole: this.state.joinAutorole
      }}>
        {(updateSettings, { loading, error }) => (
          <>
            <br />
            <Typography variant='title' gutterBottom>Public Roles</Typography>
            <Divider />
            <FormGroup row>
              <FormControlLabel
                control={
                  <Switch color='secondary' checked={this.state.role}
                    onChange={() => this.setState({ role: !this.state.role })}
                  />
                }
                label='Enable Public Roles'
              />
            </FormGroup>
            <Typography gutterBottom>
              {'Public roles enable members to add roles to themselves as long as \
              the roles remain below their highest role. This enables features such as \
              colored roles in addition to auto roles.'}
            </Typography>
            <br />
            <Typography variant='title' gutterBottom>Join/Leave Actions</Typography>
            <Divider />
            <br />
            <Typography variant='subheading' gutterBottom>Join Autorole</Typography>
            <Typography gutterBottom>
              {'Join autorole automatically gives a joining person a specified role. \
              It is useful in giving members specified colors or in combination with public \
              roles by giving a person a high role.'}
            </Typography>
            <Typography gutterBottom>
              {'Use | to separate roles. If a role contains |, it will not be added.'}
            </Typography>
            <FormControl>
              <InputLabel>Role Names</InputLabel>
              <Input
                value={this.state.joinAutorole} fullWidth
                onChange={e => this.setState({ joinAutorole: e.target.value })} margin='dense' />
              <FormHelperText>Leave blank to disable</FormHelperText>
            </FormControl>
            <div style={{ height: 10 }} />
            <Button size='small'>Cancel</Button>
            <Button size='small' onClick={() => updateSettings()}>Save</Button>
            {loading && <><br /><LinearProgress color='secondary' variant='query' /></>}
            {error && <><br /><Typography color='error'>Error :( Please try again</Typography></>}
          </>
        )}
      </Mutation>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */
