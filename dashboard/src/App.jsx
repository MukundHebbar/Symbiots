import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Toxic from "./pages/toxic.jsx";
import Corrosive from "./pages/corrosive.jsx";
import Flame from "./pages/flame.jsx";
import './App.css';
import Header from "./assets/header";
import Alerts from "./assets/alerts";
import Others from "./pages/others.jsx"
import SensorWatcher from "./assets/SensorWatcher"; // Import the watcher

const MainGrid = () => {
  const categories = [
    { name: 'Flammable', path: '/pages/flame', className: 'flammable' },
    { name: 'Corrosive', path: '/pages/corrosive', className: 'corrosive' },
    { name: 'Cold Chain', path: '/pages/toxic', className: 'toxic' },
    { name: 'Others', path: '/pages/others', className: 'others' }
  ];

  return (
    <div className="app-container">
      <Alerts/>
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
    <SensorWatcher/>
    <Routes>
      <Route path="/" element={<MainGrid />} />
      <Route path="/pages/toxic" element={<Toxic />} />
      <Route path="/pages/corrosive" element={<Corrosive />} />
      <Route path="/pages/flame" element={<Flame />} />
      <Route path="/pages/others" element={<Others/>} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
</>  );
};

export default App;