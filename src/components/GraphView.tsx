import { Group } from '../types';
import { formatCurrency } from '../utils';

const CATEGORY_COLORS = {
  Food: '#4CAF50',
  Entertainment: '#9C27B0',
  Travel: '#2196F3',
  Hotels: '#FF9800',
  Others: '#9E9E9E',
};

export default function GraphView({ group }: { group: Group }) {
  const totals: Record<string, number> = {
    Food: 0,
    Entertainment: 0,
    Travel: 0,
    Hotels: 0,
    Others: 0,
  };

  let totalAmount = 0;

  group.expenses.forEach(exp => {
    // Ignore "Settle Up" events in the expense graph
    if (exp.description === 'Settle Up') return;

    const cat = exp.category || 'Others';
    totals[cat] = (totals[cat] || 0) + exp.amount;
    totalAmount += exp.amount;
  });

  if (totalAmount === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p className="text-muted">No expenses to chart yet.</p>
      </div>
    );
  }

  let currentAngle = 0;
  const conicStops = Object.entries(totals).map(([cat, amount]) => {
    const percentage = (amount / totalAmount) * 100;
    if (percentage === 0) return null;
    const start = currentAngle;
    const end = currentAngle + percentage;
    currentAngle = end;
    return `${CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || '#9E9E9E'} ${start}% ${end}%`;
  }).filter(Boolean).join(', ');

  const pieStyle = {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: `conic-gradient(${conicStops})`,
    margin: '0 auto 2rem auto',
    boxShadow: 'var(--shadow-md)',
  };

  return (
    <div className="card fade-in">
      <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Expenses by Category</h3>
      
      <div style={pieStyle}></div>

      <div className="flex-col">
        {Object.entries(totals)
          .filter(([_, amount]) => amount > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, amount]) => (
          <div key={cat} className="list-item" style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || '#9E9E9E' }}></div>
              <span>{cat}</span>
            </div>
            <div style={{ fontWeight: 'bold' }}>
              {formatCurrency(amount)} <span className="text-muted" style={{ fontSize: '0.85em', fontWeight: 'normal' }}>({((amount/totalAmount)*100).toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
