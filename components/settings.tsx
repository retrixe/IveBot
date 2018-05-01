import * as React from 'react'
import Typography from 'material-ui/Typography'
import Button from 'material-ui/Button'
import { LinearProgress } from 'material-ui/Progress'
import Divider from 'material-ui/Divider'
import Input, { InputLabel } from 'material-ui/Input'
import { FormGroup, FormControlLabel, FormControl, FormHelperText } from 'material-ui/Form'
import Switch from 'material-ui/Switch'
import { Mutation } from 'react-apollo'
import { gql } from 'apollo-boost'
// import TextField from 'material-ui/TextField'

/* eslint-disable quotes, no-multi-str, no-undef */
interface Props {
  data: { addRoleForAll: boolean, joinLeaveMessages: Array<string> },
  token: string,
  server: string
}
interface State {
  role: boolean,
  joinLeaveMessages: Array<string>
}
export default class Settings extends React.Component<Props, State> {
  constructor (props) {
    super(props); this.state = {
      role: this.props.data.addRoleForAll,
      joinLeaveMessages: this.props.data.joinLeaveMessages
    }
  }

  render () {
    const mutation = gql`
mutation variables($server: String!, $token: String!, $role: Boolean) {
  editServerSettings(input: { serverId: $server, linkToken: $token, addRoleForAll: $role }) {
    addRoleForAll
  }
}
    `
    return (
      <Mutation mutation={mutation} variables={{
        token: this.props.token, role: this.state.role, server: this.props.server
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
            <Typography variant='subheading' gutterBottom>Join/Leave Message Configuration</Typography>
            <Typography gutterBottom>
              {'Join/leave messages enable you to customize your server. \
              A join/leave message will be sent in a specific channel whenever \
              someone joins or leaves this server. It is useful for logging as well.'}
            </Typography>
            <Typography gutterBottom>
              {'Use {id} for the joining or leaving user\'s ID, {un} for username, {me} \
              for mentioning and {ds} for the discriminator.'}
            </Typography>
            <FormControl>
              <InputLabel>Channel Name</InputLabel>
              <Input value={this.state.joinLeaveMessages[0]} onChange={e => {
                const joinLeaveMessages = JSON.parse(JSON.stringify(this.state.joinLeaveMessages))
                joinLeaveMessages[0] = e.target.value
                this.setState({ joinLeaveMessages })
              }} margin='dense' />
              <FormHelperText>Leave blank to disable</FormHelperText>
            </FormControl>
            <FormControl>
              <InputLabel>Join Message</InputLabel>
              <Input value={this.state.joinLeaveMessages[1]} onChange={e => {
                const joinLeaveMessages = JSON.parse(JSON.stringify(this.state.joinLeaveMessages))
                joinLeaveMessages[1] = e.target.value
                this.setState({ joinLeaveMessages })
              }} multiline fullWidth margin='dense' />
              <FormHelperText>Leave blank to disable</FormHelperText>
            </FormControl>
            <FormControl>
              <InputLabel>Leave Message</InputLabel>
              <Input value={this.state.joinLeaveMessages[2]} onChange={e => {
                const joinLeaveMessages = JSON.parse(JSON.stringify(this.state.joinLeaveMessages))
                joinLeaveMessages[2] = e.target.value
                this.setState({ joinLeaveMessages })
              }} multiline fullWidth margin='dense' />
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
