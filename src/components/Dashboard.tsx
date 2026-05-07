import { useAppContext } from '../store';
import { calculateGlobalBalances, formatCurrency } from '../utils';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export default function Dashboard() {
  const { state } = useAppContext();
  
  const globalBalances = calculateGlobalBalances(state.groups);
  
  if (globalBalances.length === 0) {
    return (
      <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <Wallet size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
        <h2>Welcome to Split</h2>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>
          No groups or expenses yet. Head over to the Groups tab to get started!
        </p>
      </div>
    );
  }

  const sortedBalances = [...globalBalances].sort((a, b) => b.balance - a.balance);
  const maxBalance = Math.max(...sortedBalances.map(b => Math.abs(b.balance)), 1);

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: '1.5rem' }}>Global Dashboard</h2>
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Overall Balances</h3>
        <div className="flex-col">
          {sortedBalances.map(({ name, balance }) => (
            <div key={name} className="list-item stagger-item" style={{ padding: '1rem 0', display: 'block' }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span className="list-item-title">{name}</span>
                <span className={`tabular-nums ${balance > 0 ? 'badge-glow-success' : balance < 0 ? 'badge-glow-danger' : 'text-muted'}`} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {balance > 0 ? <TrendingUp size={14} /> : balance < 0 ? <TrendingDown size={14} /> : null}
                  {balance > 0 ? 'Gets back ' : balance < 0 ? 'Owes ' : 'Settled up '}
                  {formatCurrency(Math.abs(balance))}
                </span>
              </div>
              {balance !== 0 && (
                <div className="proportion-bar-container">
                  <div 
                    className="proportion-bar-fill" 
                    style={{ 
                      width: `${(Math.abs(balance) / maxBalance) * 100}%`, 
                      background: balance > 0 ? 'var(--success-color)' : 'var(--danger-color)' 
                    }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
