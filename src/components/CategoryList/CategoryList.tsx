import React from 'react';
import styles from './CategoryList.module.css';

export const categories = [
  { id: 'all', label: 'ทั้งหมด', emoji: '🔥' },
  { id: 'design', label: 'ออกแบบ & กราฟิก', emoji: '🎨' },
  { id: 'coding', label: 'โค้ดดิ้ง & เทค', emoji: '💻' },
  { id: 'language', label: 'ภาษาต่างประเทศ', emoji: '🗣️' },
  { id: 'academic', label: 'ติวสอบ & วิชาการ', emoji: '📐' },
  { id: 'music', label: 'ดนตรี & มัลติมีเดีย', emoji: '🎵' },
];

interface CategoryListProps {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ activeCategory, onSelectCategory }) => {
  return (
    <div className={`container ${styles.categorySection}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>หมวดหมู่ยอดนิยม</h3>
        <span className={styles.hint}>เลื่อนดูเพิ่มเติม 👉</span>
      </div>
      
      <div className={styles.scrollContainer}>
        <div className={styles.pillList}>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className={`${styles.pill} ${activeCategory === cat.id ? styles.active : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span className={styles.emoji}>{cat.emoji}</span>
              <span className={styles.label}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryList;
