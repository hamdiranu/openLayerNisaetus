import React from 'react';
import '../styles/bootstrap.min.css';
import { withRouter } from 'react-router-dom';
import { connect } from 'unistore/react';
import { actions } from '../store';

class Dummy extends React.Component {
  render() {
    return (
      <React.Fragment>
        <div></div>
      </React.Fragment>
    );
  }
}

export default connect('', actions)(withRouter(Dummy));
