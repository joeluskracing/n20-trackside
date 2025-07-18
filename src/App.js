import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Garage from './pages/Garage';
import Trackside from './pages/Trackside';
import Checklist from './pages/Checklist';
import Settings from './pages/Settings';
import CreateCar from './pages/CreateCar';
import AddPart from './pages/AddPart';
import ModifyParts from './pages/ModifyParts';
import ManageParts from './pages/ManageParts';
import { CarProvider } from './context/CarContext'; // Import the CarProvider
import './App.css';
import { EventProvider } from './context/EventContext';

const App = () => {
  return (
    <EventProvider>
    <CarProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/garage" element={<Garage />} />
        <Route path="/trackside" element={<Trackside />} />
        <Route path="/checklist" element={<Checklist />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/create-car" element={<CreateCar />} />
        <Route path="/add-part" element={<AddPart />} />
        <Route path="/modify-parts" element={<ModifyParts />} />
        <Route path="/manage-parts" element={<ManageParts />} />
        {/* Add more routes as needed */}
      </Routes>
    </CarProvider>
    </EventProvider>
  );
};

export default App;
