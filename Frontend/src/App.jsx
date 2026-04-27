import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Fleet from './pages/Fleet';
import EmergencyGuide from './pages/EmergencyGuide';
import Blog from './pages/Blog';
import Patient from './pages/Patient';
import Driver from './pages/Driver'
import Login from './pages/Login.jsx'
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      {/*Router*/}
      <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans transition-colors duration-300 flex flex-col">
        <Navbar />

        {/*Main Area*/}
        <main className="grow">
          <Routes>
            <Route path= "/" element={<Home />} />
            <Route path= "/about" element={<About />} />
            <Route path= "/features" element={<Features />} />
            <Route path= "/fleet" element={<Fleet />} />
            <Route path= "/emergency" element={<EmergencyGuide />} />
            <Route path= "/blog" element={<Blog />} />
            <Route path="/patient" element={<Patient />} />
            <Route path="/driver" element={
                  <ProtectedRoute>
                    <Driver />
                  </ProtectedRoute>
                }
            />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App