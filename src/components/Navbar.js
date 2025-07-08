import React from 'react';
import { NavLink } from 'react-router-dom';
import TracksideNotice from './TracksideNotice';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li className="navbar-item">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
        </li>
        <li className="navbar-item">
          <NavLink to="/garage" className={({ isActive }) => (isActive ? 'active' : '')}>Garage</NavLink>
        </li>
        <li className="navbar-item">
          <NavLink to="/trackside" className={({ isActive }) => (isActive ? 'active' : '')}>Trackside</NavLink>
        </li>
        <li className="navbar-item">
          <NavLink to="/checklist" className={({ isActive }) => (isActive ? 'active' : '')}>Checklist</NavLink>
        </li>
        <li className="navbar-item">
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>Settings</NavLink>
        </li>
      </ul>
      <TracksideNotice />
    </nav>
  );
};

export default Navbar;
