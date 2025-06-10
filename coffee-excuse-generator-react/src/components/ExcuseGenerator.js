import React, { useState, useEffect } from 'react';

function ExcuseGenerator() {
  const [excuse, setExcuse] = useState('Click the button to get your AI-generated coffee excuse!');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canRequest, setCanRequest] = useState(true);

  // Check for existing cooldown on component mount
  useEffect(() => {
    const lastRequestTime = localStorage.getItem('lastCoffeeRequest');
    if (lastRequestTime) {
      const timeSince = Date.now() - parseInt(lastRequestTime);
      const cooldownPeriod = 30000; // 30 seconds
      
      if (timeSince < cooldownPeriod) {
        const remaining = Math.ceil((cooldownPeriod - timeSince) / 1000);
        setTimeLeft(remaining);
        setCanRequest(false);
        startCountdown(remaining);
      }
    }
  }, []);

  const startCountdown = (seconds) => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanRequest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateReason = async () => {
    if (!canRequest) {
      return;
    }

    setLoading(true);
    setCanRequest(false);
    setExcuse('Brewing your perfect coffee excuse...');
    
    // Store the request timestamp
    const requestTime = Date.now();
    localStorage.setItem('lastCoffeeRequest', requestTime.toString());
    
    // Check if Worker URL is configured
    const workerUrl = process.env.REACT_APP_WORKER_URL;
    if (!workerUrl) {
      console.error('Worker URL not configured');
      setExcuse('Configuration error: Worker URL not found');
      setLoading(false);
      // Start cooldown even on error to prevent spam
      setTimeLeft(30);
      startCountdown(30);
      return;
    }

    try {
      const response = await fetch(`${workerUrl}/api/coffee`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add a simple client identifier (you could make this more sophisticated)
          'X-Client-ID': generateClientId(),
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait before trying again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setExcuse(`"${data.reason}"`);
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('Too many requests')) {
        setExcuse('🚫 Whoa there, coffee lover! You\'re brewing too fast. Please wait a moment before your next excuse.');
      } else {
        setExcuse('☕ Oops! The coffee machine is broken. Try again in a moment.');
      }
    }
    
    setLoading(false);
    
    // Start 30-second cooldown
    setTimeLeft(30);
    startCountdown(30);
  };

  // Generate a simple client ID based on browser fingerprint
  const generateClientId = () => {
    const stored = localStorage.getItem('coffeeClientId');
    if (stored) return stored;
    
    const screenWidth = typeof window !== 'undefined' && typeof window.screen !== 'undefined' ? window.screen.width : '';
    const screenHeight = typeof window !== 'undefined' && typeof window.screen !== 'undefined' ? window.screen.height : '';
    const clientId = btoa(
      navigator.userAgent + 
      screenWidth + 
      screenHeight + 
      navigator.language +
      Date.now()
    ).slice(0, 32);
    
    localStorage.setItem('coffeeClientId', clientId);
    return clientId;
  };

  const getButtonText = () => {
    if (loading) return 'Brewing...';
    if (!canRequest && timeLeft > 0) return `Wait ${timeLeft}s`;
    return 'Generate My Coffee Excuse';
  };

  return (
    <div className="excuse-generator">
      <div className="coffee-cup">☕</div>
      <button
        className="generate-btn"
        onClick={generateReason}
        disabled={loading || !canRequest}
        title={!canRequest ? `Please wait ${timeLeft} seconds before requesting another excuse` : ''}
      >
        {getButtonText()}
      </button>
      {!canRequest && timeLeft > 0 && (
        <div className="cooldown-message">
          ⏱️ Next coffee excuse available in {timeLeft} seconds
        </div>
      )}
      <div className={`reason-display ${loading ? 'loading' : ''}`}>
        {excuse}
      </div>
    </div>
  );
}

export default ExcuseGenerator;