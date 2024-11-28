import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Login from './features/Login/login'; 
import Home from './features/Home/home'; // Import Homepage



// Setting up routing 
function App() {
  return (
    <Router>
      <Routes>
        {/* Login page route */}
        <Route path="/login" element={<Login />} />
        {/* Home page route */}
        <Route path="/home" element={<Home/>} />
      </Routes>
    </Router>
  );
}

export default App;
