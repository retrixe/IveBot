import * as React from 'react'
import Typography from 'material-ui/Typography'
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  ExpansionPanelActions
} from 'material-ui/ExpansionPanel'
import Button from 'material-ui/Button'
import { LinearProgress } from 'material-ui/Progress'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { FormGroup, FormControlLabel } from 'material-ui/Form'
import Switch from 'material-ui/Switch'
import { Mutation } from 'react-apollo'
import { gql } from 'apollo-boost'
// import TextField from 'material-ui/TextField'

/* eslint-disable quotes, no-multi-str, no-undef */
interface Props {
  data: { addRoleForAll: boolean },
  token: string,
  server: string
}
interface State {
  role: boolean
}
export default class Settings extends React.Component<Props, State> {
  constructor (props) { super(props); this.state = { role: this.props.data.addRoleForAll } }

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
            <ExpansionPanel>
              <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>General</Typography>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails>
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
              </ExpansionPanelDetails>
              <ExpansionPanelActions>
                <Button size='small'>Cancel</Button>
                <Button size='small' onClick={() => updateSettings()}>Save</Button>
              </ExpansionPanelActions>
            </ExpansionPanel>
            {loading && <><br /><LinearProgress color='secondary' variant='query' /></>}
            {error && <><br /><Typography color='error'>Error :( Please try again</Typography></>}
          </>
        )}
      </Mutation>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */
