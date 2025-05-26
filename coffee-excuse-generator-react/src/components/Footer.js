// filepath: src/components/Footer.js
import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <p>Made with ❤️ and lots of ☕</p>
      <aside>
        <p>
          A project quick and dirty by{' '}
          <a href="https://github.com/KennySporck/" target="_blank" rel="noopener noreferrer">
            Kenny Sporck
          </a>.
        </p>
        <p>
          Inspired by caffeine addiction and wise words from{' '}
          <a href="https://github.com/jonasclaes/" target="_blank" rel="noopener noreferrer">
            Jonas Claes
          </a>.
        </p>
        <p>
          Check out the code over at{' '}
          <a href="https://github.com/KennySporck/coffee-excuse-generator" target="_blank" rel="noopener noreferrer">
            KennySporck/coffee-excuse-generator
          </a>.
        </p>
        <p>Copyright © 2025</p>
      </aside>
    </footer>
  );
}

export default Footer;