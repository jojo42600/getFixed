import React from 'react';
import CreateProblemModal from './CreateProblemModal.jsx'
import {Button} from 'semantic-ui-react';

// import { graphql } from 'react-apollo'; // for wrapping component with apollo client ??
// import gql from 'graph-ql-tag'; // for constructing query

class FixButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalOpen: false
    };
    this.closeMainModal = this.closeMainModal.bind(this);
  }

  // const _createListing = async () => {
  //   // TODO
  // }

  closeMainModal() {
    this.setState({ modalOpen: false })
  }

  render() {
    return (
      <div>
        <Button basic color='teal' onClick={() => this.setState({modalOpen: true})} >Fix My Stuff</Button>
        {this.state.modalOpen && <CreateProblemModal closeMainModal={this.closeMainModal} />}
      </div>
    );
  }
}

// const POST_MUTATION; // graphQL query

export default FixButton;

// export default graphql(POST_MUTATION, {
//   name: 'postMutation'
// }) // for apollo