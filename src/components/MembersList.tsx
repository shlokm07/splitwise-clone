import { useState } from 'react';
import { Group } from '../types';
import { useAppContext } from '../store';
import { calculateBalances } from '../utils';
import { Trash2, UserPlus } from 'lucide-react';

export default function MembersList({ group }: { group: Group }) {
  const { dispatch } = useAppContext();
  const [newMemberName, setNewMemberName] = useState('');
  const balances = calculateBalances(group);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    dispatch({
      type: 'ADD_MEMBER',
      payload: {
        groupId: group.id,
        member: {
          id: crypto.randomUUID(),
          name: newMemberName.trim(),
        }
      }
    });
    setNewMemberName('');
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    // Check if the member has non-zero balance
    if (Math.abs(balances[memberId] || 0) > 0.01) {
      alert(`Cannot delete ${memberName} because they have an unsettled balance.`);
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
      dispatch({
        type: 'DELETE_MEMBER',
        payload: {
          groupId: group.id,
          memberId,
        }
      });
    }
  };

  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add Member</h3>
        <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={newMemberName} 
            onChange={e => setNewMemberName(e.target.value)} 
            placeholder="New member's name" 
            required 
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <UserPlus size={18} /> Add
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Current Members</h3>
        <div className="flex-col">
          {group.members.map(member => (
            <div key={member.id} className="list-item" style={{ padding: '0.75rem 0' }}>
              <span className="list-item-title">{member.name}</span>
              <button 
                className="btn btn-danger" 
                style={{ padding: '0.4rem', border: 'none' }} 
                onClick={() => handleDeleteMember(member.id, member.name)}
                title="Remove Member"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
