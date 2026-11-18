import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HeroBanner.module.css';
import { Timer, Plus } from 'lucide-react';

const HeroBanner: React.FC = () => {
  return (
    <div className={styles.heroWrapper}>
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.content}>
          <div className={styles.label}>
            <div className={styles.iconCircle}>
              <Timer size={14} className={styles.timerIcon} />
            </div>
            <span>กระเป๋าเวลาเรียนรู้</span>
          </div>
          
          <div className={styles.timeValue}>
            5 <span className={styles.unit}>ชม.</span> 30 <span className={styles.unit}>นาที</span> <span className={styles.emoji}>⏱️</span>
          </div>
          
          <div className={styles.subtitle}>
            พร้อมแลกเปลี่ยนทักษะใหม่
          </div>
        </div>
        
        <div className={styles.actionArea}>
          <Link to="/create-request" style={{ textDecoration: 'none' }}>
            <button className={styles.postButton}>
              <Plus size={18} />
              <span>โพสต์หาคนช่วย</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
