import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Garage from './pages/Garage';
import Trackside from './pages/Trackside';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

const Routes = () => {
  return (
    <Router>
      <Navbar />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/garage" component={Garage} />
        <Route path="/trackside" component={Trackside} />
        <Route path="/settings" component={Settings} />
      </Switch>
    </Router>
  );
};

export default Routes;
