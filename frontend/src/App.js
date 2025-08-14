import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import Dashboard from './components/dashboard';


function App() {
  return (
    <Router>
      <Routes>
        {/* Publicly accessible Homepage */}
        <Route path="/" element={<HomePage />} />
        {/* Manager-only Dashboard - secure with auth later */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;