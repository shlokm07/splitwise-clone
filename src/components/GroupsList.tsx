import { useState } from 'react';
import { useAppContext } from '../store';
import { Users, Plus, Trash2 } from 'lucide-react';

type Props = {
  onViewGroup: (id: string) => void;
};

export default function GroupsList({ onViewGroup }: Props) {
  const { state, dispatch } = useAppContext();
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState<string[]>([]);

  const handleAddMember = () => {
    if (memberName.trim() && !members.includes(memberName.trim())) {
      setMembers([...members, memberName.trim()]);
      setMemberName('');
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || members.length === 0) return;

    const newGroup = {
      id: crypto.randomUUID(),
      name: groupName.trim(),
      members: members.map(name => ({ id: crypto.randomUUID(), name })),
      expenses: [],
    };

    dispatch({ type: 'ADD_GROUP', payload: newGroup });
    setIsCreating(false);
    setGroupName('');
    setMembers([]);
  };

  return (
    <div className="fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h2>Your Groups</h2>
        {!isCreating && (
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
            <Plus size={18} /> New Group
          </button>
        )}
      </div>

      {isCreating && (
        <form className="card fade-in" onSubmit={handleCreateGroup}>
          <h3>Create New Group</h3>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Group Name</label>
            <input 
              type="text" 
              value={groupName} 
              onChange={e => setGroupName(e.target.value)} 
              placeholder="e.g., Goa Trip" 
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Members (add at least 1)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                value={memberName} 
                onChange={e => setMemberName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                placeholder="Enter name" 
              />
              <button type="button" className="btn btn-secondary" onClick={handleAddMember}>Add</button>
            </div>
            {members.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {members.map(m => (
                  <span key={m} style={{ background: 'var(--surface-color-hover)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={!groupName || members.length === 0}>
              Create
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex-col">
        {state.groups.length === 0 && !isCreating && (
          <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>
            No groups created yet.
          </p>
        )}
        {state.groups.map(group => (
          <div 
            key={group.id} 
            className="card list-item" 
            style={{ cursor: 'pointer', marginBottom: '0' }}
            onClick={() => onViewGroup(group.id)}
          >
            <div>
              <div className="list-item-title">{group.name}</div>
              <div className="list-item-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={14} /> {group.members.length} members
              </div>
            </div>
            <button 
              className="btn btn-danger" 
              style={{ padding: '0.5rem' }} 
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete "${group.name}"? This action cannot be undone.`)) {
                  dispatch({ type: 'DELETE_GROUP', payload: { groupId: group.id } });
                }
              }}
              title="Delete Group"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
