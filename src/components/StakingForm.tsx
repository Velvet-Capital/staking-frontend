import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import './StakingForm.css';

interface Position {
  amount: string;
  start: string;
  end: string;
  numWeeks: number;
  autoRenew: boolean;
  id: string;
}

const StakingForm: React.FC = () => {
  const { veVirtualContract, mockTokenContract, isConnected, account } = useWeb3();
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [positions, setPositions] = useState<Position[]>([]);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    if (!isConnected || !veVirtualContract || !account) return;

    try {
      const positions = await veVirtualContract.getPositions(account, 0, 100);
      const formattedPositions = positions
        .filter((pos: any) => !pos.amount.isZero())
        .map((pos: any) => ({
          amount: ethers.utils.formatEther(pos.amount),
          start: new Date(pos.start.toNumber() * 1000).toLocaleString(),
          end: new Date(pos.end.toNumber() * 1000).toLocaleString(),
          numWeeks: pos.numWeeks,
          autoRenew: pos.autoRenew,
          id: pos.id.toString()
        }));
      setPositions(formattedPositions);
    } catch (err) {
      console.error('Error loading positions:', err);
    }
  }, [isConnected, veVirtualContract, account]);

  const loadBalances = useCallback(async () => {
    if (!isConnected || !veVirtualContract || !mockTokenContract || !account) return;

    try {
      const balance = await mockTokenContract.balanceOf(account);
      const staked = await veVirtualContract.balanceOf(account);

      setTokenBalance(ethers.utils.formatEther(balance));
      setStakedAmount(ethers.utils.formatEther(staked));
    } catch (err) {
      console.error('Error loading balances:', err);
    }
  }, [isConnected, veVirtualContract, mockTokenContract, account]);

  useEffect(() => {
    if (isConnected && account) {
      loadBalances();
      loadPositions();
    }
  }, [isConnected, account, loadBalances, loadPositions]);

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
      await loadPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!isConnected || !veVirtualContract) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setWithdrawingId(id);
      setError(null);

      const tx = await veVirtualContract.withdraw(id, {
        gasLimit: 1000000,
      });
      await tx.wait();

      await loadBalances();
      await loadPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setWithdrawingId(null);
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

      await loadBalances();
      await loadPositions();
      console.log('Successfully minted tokens');
    } catch (err) {
      console.error('Error minting tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRenew = async (id: string) => {
    if (!isConnected || !veVirtualContract) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await veVirtualContract.toggleAutoRenew(id, {
        gasLimit: 1000000,
      });
      await tx.wait();

      await loadPositions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          </div>
        </div>
      </form>

      {positions.length > 0 && (
        <div className="positions-container">
          <h3 className="positions-title">Your Positions</h3>
          <div className="positions-grid">
            {positions.map((position) => (
              <div key={position.id} className="position-item">
                <div className="position-header">
                  <span className="position-id">ID: {position.id}</span>
                  <div className="position-actions">
                    <button
                      onClick={() => handleToggleAutoRenew(position.id)}
                      className={`auto-renew-toggle ${position.autoRenew ? 'active' : ''}`}
                      disabled={loading}
                    >
                      {position.autoRenew ? 'Auto-Renew On' : 'Auto-Renew Off'}
                    </button>
                    <button
                      onClick={() => handleWithdraw(position.id)}
                      className="withdraw-button"
                      disabled={loading || withdrawingId === position.id}
                    >
                      {withdrawingId === position.id ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  </div>
                </div>
                <div className="position-details">
                  <div className="position-detail">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">{position.amount} MOCK</span>
                  </div>
                  <div className="position-detail">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{position.numWeeks} minutes</span>
                  </div>
                  <div className="position-detail">
                    <span className="detail-label">Start:</span>
                    <span className="detail-value">{position.start}</span>
                  </div>
                  <div className="position-detail">
                    <span className="detail-label">End:</span>
                    <span className="detail-value">{position.end}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StakingForm; 