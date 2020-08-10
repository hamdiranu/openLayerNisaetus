import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { Provider } from 'unistore/react';
import { store } from '../store';
import NotMatch from '../pages/notMatch';
import Beranda from '../pages/home';

const MainRoute = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Switch>
          {/* PAGES ROUTING */}
          <Route exact path='/' component={Beranda} />
          <Route component={NotMatch} />
        </Switch>
      </BrowserRouter>
    </Provider>
  );
};

export default MainRoute;
