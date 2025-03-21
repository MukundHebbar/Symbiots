import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header-container">
      <div className="header-content">
        <Link to="/" className="home-button">
          Home
        </Link>
        <h1 className="header-title">Inventory Of Things</h1>
      </div>
    </header>
  );
};

export default Header;