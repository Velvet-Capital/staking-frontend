import React from 'react';
import { Web3Provider } from './contexts/Web3Context';
import WalletConnect from './components/WalletConnect';
import StakingForm from './components/StakingForm';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <div className="app">
        <div className="app-content">
          <header className="app-header">
            <h1 className="app-title">Staking DApp</h1>
            <p className="app-description">
              Stake your tokens and earn rewards
            </p>
          </header>
          <WalletConnect />
          <StakingForm />
        </div>
      </div>
    </Web3Provider>
  );
}

export default App; 