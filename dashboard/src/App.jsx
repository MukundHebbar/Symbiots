import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Toxic from "./pages/toxic.jsx";
import Corrosive from "./pages/corrosive.jsx";
import Flame from "./pages/flame.jsx";
import './App.css';
import Header from "./assets/header";

const MainGrid = () => {
  const categories = [
    { name: 'Flammable', path: '/pages/flame', className: 'flammable' },
    { name: 'Corrosive', path: '/pages/corrosive', className: 'corrosive' },
    { name: 'Toxic', path: '/pages/toxic', className: 'toxic' },
    { name: '', path: '', className: 'blank' }
  ];

  return (
    <div className="app-container">
      <div className="grid-container">
        {categories.map((category, index) => (
          <div 
            key={index} 
            className={`category-card ${category.className} ${!category.name ? 'blank-card' : ''}`}
          >
            {category.name && (
              <Link to={category.path} className="category-title">
                {category.name}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
const App = () => {
  const location = useLocation();

  return (
    <>
    <Header/>
    <Routes>
      <Route path="/" element={<MainGrid />} />
      <Route path="/pages/toxic" element={<Toxic />} />
      <Route path="/pages/corrosive" element={<Corrosive />} />
      <Route path="/pages/flame" element={<Flame />} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
</>  );
};

export default App;