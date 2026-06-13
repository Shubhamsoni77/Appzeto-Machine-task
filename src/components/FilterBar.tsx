import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  assignees: string[];
  selectedAssignees: string[];
  onChangeAssignees: (assignees: string[]) => void;
  searchText: string;
  onChangeSearchText: (text: string) => void;
  overdueOnly: boolean;
  onChangeOverdueOnly: (val: boolean) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  assignees,
  selectedAssignees,
  onChangeAssignees,
  searchText,
  onChangeSearchText,
  overdueOnly,
  onChangeOverdueOnly
}) => {
  const [localSearch, setLocalSearch] = useState(searchText);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeSearchText(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onChangeSearchText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAssignee = (assignee: string) => {
    if (selectedAssignees.includes(assignee)) {
      onChangeAssignees(selectedAssignees.filter(a => a !== assignee));
    } else {
      onChangeAssignees([...selectedAssignees, assignee]);
    }
  };

  return (
    <div className="filter-bar">
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          className="filter-input"
          placeholder="Search titles..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          style={{ paddingLeft: '2rem' }}
        />
      </div>

      <div className="custom-dropdown" ref={dropdownRef}>
        <button 
          className="filter-select dropdown-trigger" 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span>
            {selectedAssignees.length === 0 
              ? 'Filter by assignee...' 
              : `${selectedAssignees.length} selected`}
          </span>
          <ChevronDown size={16} />
        </button>
        {isDropdownOpen && (
          <div className="dropdown-menu">
            {assignees.map(a => (
              <label key={a} className="dropdown-item">
                <input 
                  type="checkbox" 
                  checked={selectedAssignees.includes(a)}
                  onChange={() => toggleAssignee(a)}
                />
                {a}
              </label>
            ))}
          </div>
        )}
      </div>

      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={overdueOnly}
          onChange={(e) => onChangeOverdueOnly(e.target.checked)}
        />
        <span>Overdue only</span>
      </label>
      
      {selectedAssignees.length > 0 && (
        <button 
          className="btn"
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
          onClick={() => onChangeAssignees([])}
        >
          Clear Assignees
        </button>
      )}
    </div>
  );
};
