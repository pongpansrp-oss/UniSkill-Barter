import React from 'react';
import styles from './SearchBar.module.css';
import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className={`container ${styles.searchContainer}`}>
      <div className={styles.searchWrapper}>
        <div className={styles.searchIcon}>
          <Search size={20} color="var(--text-muted)" />
        </div>
        <input 
          type="text" 
          className={styles.searchInput} 
          placeholder="ค้นหาทักษะ เช่น สอน Figma, ติวแคล..." 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button className={styles.filterButton}>
          <SlidersHorizontal size={20} color="var(--text-muted)" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
