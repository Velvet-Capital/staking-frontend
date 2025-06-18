import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './WalletConnect.css';

const WalletConnect: React.FC = () => {
  const { account, connect, disconnect, isConnected } = useWeb3();

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Connecting wallet...');
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Disconnecting wallet...');
    disconnect();
  };

  return (
    <div className="wallet-connect">
      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="connect-button"
        >
          <span className="button-text">Connect Wallet</span>
        </button>
      ) : (
        <div className="wallet-connect">
          <div className="account-display">
            <span className="account-text">{account}</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="disconnect-button"
          >
            <span className="button-text">Disconnect</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 