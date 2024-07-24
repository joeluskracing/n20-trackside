import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css'; // Make sure to create this CSS file

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li className="navbar-item">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
        </li>
        <li className="navbar-item">
          <NavLink to="/garage" className={({ isActive }) => isActive ? 'active' : ''}>Garage</NavLink>
        </li>
        <li className="navbar-item">
          <NavLink to="/trackside" className={({ isActive }) => isActive ? 'active' : ''}>Trackside</NavLink>
        </li>
        <li className="navbar-item">
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>Settings</NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
