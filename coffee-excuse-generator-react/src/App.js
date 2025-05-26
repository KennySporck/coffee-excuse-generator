import React from 'react';
import Header from './components/Header';
import ExcuseGenerator from './components/ExcuseGenerator';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="container">
      <Header />
      <ExcuseGenerator />
      <Footer />
    </div>
  );
}

export default App;