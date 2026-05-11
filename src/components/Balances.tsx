import { Group } from '../types';
import { calculateBalances, formatCurrency } from '../utils';
import { CheckCircle } from 'lucide-react';

export default function Balances({ group }: { group: Group }) {
  const balances = calculateBalances(group);
  
  // Calculate Trip Summary
  const validExpenses = group.expenses.filter(e => e.description !== 'Settle Up');
  const tripTotal = validExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const averagePerPerson = group.members.length > 0 ? tripTotal / group.members.length : 0;
  
  const paidByMember: Record<string, number> = {};
  const shareByMember: Record<string, number> = {};
  group.members.forEach(m => {
    paidByMember[m.id] = 0;
    shareByMember[m.id] = 0;
  });
  validExpenses.forEach(exp => {
    if (paidByMember[exp.paidBy] !== undefined) {
      paidByMember[exp.paidBy] += exp.amount;
    }
    Object.entries(exp.splits).forEach(([memberId, splitAmt]) => {
      if (shareByMember[memberId] !== undefined) {
        shareByMember[memberId] += splitAmt;
      }
    });
  });
  
  // Calculate who owes whom
  const debtors = Object.entries(balances)
    .filter(([_, amount]) => amount < -0.01)
    .sort((a, b) => a[1] - b[1]); // Most negative first
    
  const creditors = Object.entries(balances)
    .filter(([_, amount]) => amount > 0.01)
    .sort((a, b) => b[1] - a[1]); // Most positive first

  const settlements: { from: string, to: string, amount: number }[] = [];

  // Greedy algorithm to calculate settlements
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtorId = debtors[i][0];
    const creditorId = creditors[j][0];
    
    const debt = Math.abs(debtors[i][1]);
    const credit = creditors[j][1];
    
    const amount = Math.min(debt, credit);
    
    if (amount > 0.01) {
      settlements.push({ from: debtorId, to: creditorId, amount });
    }
    
    debtors[i][1] += amount;
    creditors[j][1] -= amount;
    
    if (Math.abs(debtors[i][1]) < 0.01) i++;
    if (creditors[j][1] < 0.01) j++;
  }

  if (settlements.length === 0) {
    return (
      <div className="flex-col">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Trip Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div className="text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Expense</div>
              <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(tripTotal)}</div>
            </div>
            <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div className="text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Avg Per Person</div>
              <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(averagePerPerson)}</div>
            </div>
          </div>
          
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Individual Shares</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Member</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Paid</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Share</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {group.members.map(m => {
                  const paid = paidByMember[m.id] || 0;
                  const share = shareByMember[m.id] || 0;
                  const net = paid - share;
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{m.name}</td>
                      <td className="tabular-nums" style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{formatCurrency(paid)}</td>
                      <td className="tabular-nums" style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>{formatCurrency(share)}</td>
                      <td className="tabular-nums" style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>
                        <span className={net > 0.01 ? 'badge-glow-success' : net < -0.01 ? 'badge-glow-danger' : 'text-muted'}>
                          {net > 0 ? '+' : ''}{formatCurrency(net)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <CheckCircle size={48} color="var(--success-color)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h3>All settled up!</h3>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>No one owes anything in this group.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col">
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Trip Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div className="text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Expense</div>
            <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(tripTotal)}</div>
          </div>
          <div style={{ background: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div className="text-muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Avg Per Person</div>
            <div className="tabular-nums" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(averagePerPerson)}</div>
          </div>
        </div>
        
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Individual Shares</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Member</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Paid</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Share</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Net</th>
              </tr>
            </thead>
            <tbody>
              {group.members.map(m => {
                const paid = paidByMember[m.id] || 0;
                const share = shareByMember[m.id] || 0;
                const net = paid - share;
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{m.name}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{formatCurrency(paid)}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', padding: '0.75rem 0.5rem' }}>{formatCurrency(share)}</td>
                    <td className="tabular-nums" style={{ textAlign: 'right', padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>
                      <span className={net > 0.01 ? 'badge-glow-success' : net < -0.01 ? 'badge-glow-danger' : 'text-muted'}>
                        {net > 0 ? '+' : ''}{formatCurrency(net)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Group Balances</h3>
        <div className="flex-col">
        {settlements.map((s, idx) => {
          const from = group.members.find(m => m.id === s.from)?.name;
          const to = group.members.find(m => m.id === s.to)?.name;
          const maxAmount = Math.max(...settlements.map(s => s.amount), 1);
          return (
            <div key={idx} className="list-item" style={{ padding: '1rem 0', display: 'block' }}>
              <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                <span>
                  <span style={{ fontWeight: 600 }}>{from}</span> owes <span style={{ fontWeight: 600 }}>{to}</span>
                </span>
                <span className="badge-glow-danger tabular-nums">
                  {formatCurrency(s.amount)}
                </span>
              </div>
              <div className="proportion-bar-container">
                <div 
                  className="proportion-bar-fill" 
                  style={{ width: `${(s.amount / maxAmount) * 100}%`, background: 'var(--danger-color)' }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
