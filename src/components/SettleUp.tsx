import { useState } from 'react';
import { Group } from '../types';
import { useAppContext } from '../store';
import { calculateBalances, formatCurrency } from '../utils';

export default function SettleUp({ group, onSettled }: { group: Group, onSettled: () => void }) {
  const { dispatch } = useAppContext();
  const balances = calculateBalances(group);
  
  // Only show members who owe money or are owed money
  const membersWithBalance = group.members.filter(m => Math.abs(balances[m.id]) > 0.01);

  const [payerId, setPayerId] = useState(membersWithBalance[0]?.id || '');
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');

  if (membersWithBalance.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p className="text-muted">No balances to settle in this group.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerId || !payeeId || !amount || payerId === payeeId) return;

    dispatch({
      type: 'SETTLE_UP',
      payload: {
        groupId: group.id,
        payerId,
        payeeId,
        amount: Number(amount),
      }
    });

    onSettled();
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: '1.5rem' }}>Record a Payment</h3>

      <div className="form-group">
        <label className="form-label">Who is paying?</label>
        <select value={payerId} onChange={e => setPayerId(e.target.value)} required>
          <option value="">Select a member</option>
          {group.members.map(m => (
            <option key={m.id} value={m.id}>{m.name} {balances[m.id] < 0 ? `(Owes ${formatCurrency(Math.abs(balances[m.id]))})` : ''}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Who is receiving?</label>
        <select value={payeeId} onChange={e => setPayeeId(e.target.value)} required>
          <option value="">Select a member</option>
          {group.members.map(m => (
            <option key={m.id} value={m.id} disabled={m.id === payerId}>
              {m.name} {balances[m.id] > 0 ? `(Owed ${formatCurrency(balances[m.id])})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Amount</label>
        <input 
          type="number" 
          min="0.01" 
          step="0.01" 
          value={amount} 
          onChange={e => setAmount(parseFloat(e.target.value))} 
          placeholder="0.00" 
          required 
        />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={!payerId || !payeeId || !amount || payerId === payeeId}>
        Settle Balance
      </button>
    </form>
  );
}
