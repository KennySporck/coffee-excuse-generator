import React, { useState } from 'react';

function ExcuseGenerator() {
  const [excuse, setExcuse] = useState('Click the button to get your AI-generated coffee excuse!');
  const [loading, setLoading] = useState(false);

  const generateReason = async () => {
    setLoading(true);
    setExcuse('Generating your perfect coffee excuse...');
    try {
      // Replace with your Cloudflare Worker endpoint
      const response = await fetch(`${process.env.REACT_APP_WORKER_URL}/api/coffee`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setExcuse(`"${data.reason}"`);
    } catch (error) {
      console.error('Error:', error);
      setExcuse('Oops! The coffee machine is broken. Try again in a moment.');
    }
    setLoading(false);
    console.log(process.env.REACT_APP_WORKER_URL);
  };

  return (
    <div className="excuse-generator">
      <div className="coffee-cup">☕</div>
      <button
        className="generate-btn"
        onClick={generateReason}
        disabled={loading}
      >
        {loading ? 'Brewing...' : 'Generate My Coffee Excuse'}
      </button>
      <div className={`reason-display ${loading ? 'loading' : ''}`}>
        {excuse}
      </div>
    </div>
  );
}

export default ExcuseGenerator;