import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PopularRequests.module.css';

interface RequestItem {
  id: string;
  title: string;
  description: string;
  requestsCount: number;
  icon: string;
}

const requests: RequestItem[] = [
  { id: '1', title: 'สรุปสถิติ & SPSS', description: 'ช่วงก่อนสอบมิดเทอม', requestsCount: 18, icon: '📊' },
  { id: '2', title: 'IELTS & สนทนา', description: 'เตรียมสมัครฝึกงาน', requestsCount: 24, icon: '🇬🇧' },
  { id: '3', title: 'ตัดต่อ Premiere Pro', description: 'ทำส่งโปรเจกต์กลุ่ม', requestsCount: 12, icon: '🎬' },
  { id: '4', title: 'Basic Latte Art', description: 'กิจกรรมคลายเครียด', requestsCount: 9, icon: '☕' },
];

const PopularRequests: React.FC = () => {
  return (
    <div className={`container ${styles.section}`}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.fireIcon}>🔥</span>
          <h3 className={styles.title}>ทักษะยอดฮิตประจำสัปดาห์</h3>
        </div>
        <span className={styles.updateText}>อัปเดตวันนี้</span>
      </div>

      <div className={styles.grid}>
        {requests.map(req => (
          <div key={req.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}>{req.icon}</div>
              <div className={styles.badge}>+{req.requestsCount} คำขอ</div>
            </div>
            <h4 className={styles.cardTitle}>{req.title}</h4>
            <p className={styles.cardDesc}>{req.description}</p>
          </div>
        ))}
      </div>

      <Link to="/search" style={{ textDecoration: 'none' }}>
        <button className={styles.seeAllBtn}>
          ดูรายชื่อนักศึกษาทั้งหมด (See All) →
        </button>
      </Link>
    </div>
  );
};

export default PopularRequests;
