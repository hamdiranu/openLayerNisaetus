import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/notMatch.css';

class NotMatch extends React.Component {
  render() {
    return (
      <div className='container'>
        <div className='row notMatch'>
          <div className='col-md-4'></div>
          <div className='col-md-4'>
            <img
              src='http://4.bp.blogspot.com/-RVo9qRfkIPE/T7jMTx1PgFI/AAAAAAAAAFY/A-qqtkPDfVA/s1600/nyasar.jpg'
              alt='not match'
            />
            <h1>Page Not Found</h1>
            <Link to='/'>Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }
}

export default NotMatch;
