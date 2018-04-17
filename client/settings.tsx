import * as React from 'react'
import Typography from 'material-ui/Typography'
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  ExpansionPanelActions
} from 'material-ui/ExpansionPanel'
import Button from 'material-ui/Button'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { FormGroup, FormControlLabel } from 'material-ui/Form'
import Switch from 'material-ui/Switch'
import { Mutation } from 'react-apollo'
import { gql } from 'apollo-boost'
// import TextField from 'material-ui/TextField'

/* eslint-disable quotes, no-multi-str, no-undef */
interface Props {
  data: {}
}
interface State {}
export default class Settings extends React.Component<Props, State> {
  render () {
    const mutation = gql`
mutation {
  editServerSettings(serverId: "broken", linkToken: "broken", addRoleForAll: true) {
    addRoleForAll
  }
}
    `
    return (
      <Mutation mutation={mutation}>
        {updateTodo => (
          <>
            <ExpansionPanel>
              <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>General</Typography>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <FormGroup row>
                  <FormControlLabel
                    control={<Switch />}
                    label='Enable Public Roles'
                  />
                </FormGroup>
              </ExpansionPanelDetails>
              <ExpansionPanelActions>
                <Button size='small'>Cancel</Button>
                <Button size='small' color='primary'>Save</Button>
              </ExpansionPanelActions>
            </ExpansionPanel>
          </>
        )}
      </Mutation>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */
