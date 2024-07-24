import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Garage from './pages/Garage';
import Trackside from './pages/Trackside';
import Settings from './pages/Settings';
import CreateCar from './pages/CreateCar';
import AddPart from './pages/AddPart';
import ModifyParts from './pages/ModifyParts';
import './App.css';

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/garage" element={<Garage />} />
        <Route path="/trackside" element={<Trackside />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/create-car" element={<CreateCar />} />
        <Route path="/add-part" element={<AddPart />} />
        <Route path="/modify-parts" element={<ModifyParts />} />
        {/* Add more routes as needed */}
      </Routes>
    </div>
  );
};

export default App;
