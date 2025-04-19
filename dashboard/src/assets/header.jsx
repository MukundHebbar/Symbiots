import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [showAboutDropdown, setShowAboutDropdown] = useState(false);
  
  return (
    <header className="header-container">
      <div className="header-content">
        <div className="nav-links">
          <Link to="/" className="nav-button">
            Home
          </Link>
          
          <div 
            className="about-dropdown"
            onMouseEnter={() => setShowAboutDropdown(true)}
            onMouseLeave={() => setShowAboutDropdown(false)}
          >
            <span className="nav-button about-button">About Us</span>
            
            {showAboutDropdown && (
              <div className="dropdown-content">
                <div className="dropdown-section">
                  <h3>Locations</h3>
                  <ul>
                    <li>Plot No. 45-47, IDA Gandhinagar
                        Balanagar, Hyderabad - 500037
                        Telangana, India</li>
                  </ul>
                </div>
                
                <div className="dropdown-section">
                  <h3>Contact Details</h3>
                  <ul>
                    <li>Email: info@warehouse.com</li>
                    <li>Phone: (+91) 123-4567-890</li>
                    <li>Hours: Mon-Fri 10am-11pm</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <h1 className="header-title">Warehouse SOLUTIONS</h1>
      </div>
    </header>
  );
};

export default Header;