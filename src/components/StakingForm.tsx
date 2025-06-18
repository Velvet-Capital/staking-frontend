import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import './StakingForm.css';

const StakingForm: React.FC = () => {
  const { veVirtualContract, mockTokenContract, isConnected, account } = useWeb3();
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [withdrawId, setWithdrawId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');

  useEffect(() => {
    if (isConnected && account) {
      loadBalances();
    }
  }, [isConnected, account]);

  const loadBalances = async () => {
    if (!isConnected || !veVirtualContract || !mockTokenContract || !account) return;

    try {
      const balance = await mockTokenContract.balanceOf(account);
      const staked = await veVirtualContract.balanceOf(account);

      setTokenBalance(ethers.utils.formatEther(balance));
      setStakedAmount(ethers.utils.formatEther(staked));
    } catch (err) {
      console.error('Error loading balances:', err);
    }
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !veVirtualContract || !mockTokenContract) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const amountWei = ethers.utils.parseEther(amount);

      console.log('amountWei', amountWei);
      console.log('duration', duration);
      console.log('autoUpdate', autoUpdate);

      const approveTx = await mockTokenContract.approve(
        veVirtualContract.address,
        amountWei
      );
      await approveTx.wait();

      const stakeTx = await veVirtualContract.stake(amountWei, duration, autoUpdate);
      await stakeTx.wait();

      setAmount('');
      setDuration('30');
      await loadBalances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !veVirtualContract) {
      setError('Please connect your wallet first');
      return;
    }

    if (!withdrawId) {
      setError('Please enter a valid ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await veVirtualContract.withdraw(withdrawId, {
        gasLimit: 1000000,
      });
      await tx.wait();

      setWithdrawId('');
      await loadBalances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    try {
      console.log('Minting tokens');
      setLoading(true);
      setError(null);
      
      if (!mockTokenContract) {
        throw new Error('Mock token contract not initialized');
      }

      // Mint 1000 tokens (with 18 decimals)
      const mintAmount = ethers.utils.parseEther('1000');
      const tx = await mockTokenContract.mint(account, mintAmount);
      await tx.wait();

      // You might want to refresh balances here
      console.log('Successfully minted tokens');
    } catch (err) {
      console.error('Error minting tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint tokens');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="not-connected-message">
        <p className="not-connected-text">Please connect your wallet to start staking</p>
      </div>
    );
  }

  return (
    <div className="staking-form">
      <div className="balance-header">
        <h2 className="balance-title">Your Balances</h2>
        <button 
          onClick={handleMint}
          disabled={loading}
          className="mint-button"
        >
          {loading ? 'Minting...' : 'Mint Test Tokens'}
        </button>
      </div>

      <div className="balance-grid">
        <div className="balance-item">
          <div className="balance-label">Token Balance</div>
          <div className="balance-value">
            {tokenBalance} <span className="token-symbol">MOCK</span>
          </div>
        </div>
        <div className="balance-item">
          <div className="balance-label">Staked Amount</div>
          <div className="balance-value">
            {stakedAmount} <span className="token-symbol">veVirtual</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleStake}>
        <div className="form-container">
          <div className="form-group">
            <div>
              <label htmlFor="amount" className="form-label">
                Amount to Stake
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
                placeholder="Enter amount"
                required
              />
            </div>

            <div>
              <label htmlFor="duration" className="form-label">
                Lock Duration (minutes)
              </label>
              <input
                type="number"
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="form-input"
                placeholder="Enter number of weeks"
                min="1"
                required
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="autoUpdate"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor="autoUpdate" className="checkbox-label">
                Auto-update lock duration
              </label>
            </div>
          </div>

          <div className="button-group">
            <button
              type="submit"
              disabled={loading}
              className="stake-button"
            >
              {loading ? 'Staking...' : 'Stake'}
            </button>
            <div className="withdraw-group">
              <input
                type="number"
                value={withdrawId}
                onChange={(e) => setWithdrawId(e.target.value)}
                placeholder="Enter ID"
                className="withdraw-input"
              />
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={loading || !withdrawId}
                className="withdraw-button"
              >
                {loading ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StakingForm; 