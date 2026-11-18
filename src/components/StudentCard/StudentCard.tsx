import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './StudentCard.module.css';
import { BadgeCheck, Star, Clock, ArrowRight, Trophy } from 'lucide-react';

export interface Student {
  id: string;
  name: string;
  faculty: string;
  year: string;
  avatarUrl: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  skills: string[];
  rate: { hours: number; credits: number };
  award?: string;
  category?: string;
}

interface StudentCardProps {
  student: Student;
}

const StudentCard: React.FC<StudentCardProps> = ({ student }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.card}>
      <Link to={`/student/${student.id}`} className={styles.header}>
        <div className={styles.profileInfo}>
          <div className={styles.avatarWrapper}>
            <img src={student.avatarUrl} alt={student.name} className={styles.avatar} />
            {student.isVerified && (
              <div className={styles.verifiedBadge}>
                <BadgeCheck size={14} color="var(--white)" fill="var(--primary)" />
              </div>
            )}
          </div>
          <div className={styles.details}>
            <h4 className={styles.name}>{student.name}</h4>
            <p className={styles.faculty}>{student.faculty} ปี {student.year}</p>
            {student.award ? (
              <div className={styles.award}>
                <Trophy size={12} className={styles.awardIcon} />
                <span>{student.award}</span>
              </div>
            ) : (
              student.isVerified && (
                <div className={styles.verifiedText}>
                  <BadgeCheck size={12} className={styles.verifiedIcon} />
                  <span>ยืนยันตัวตนนักศึกษาแล้ว</span>
                </div>
              )
            )}
          </div>
        </div>
        <div className={styles.ratingBox}>
          <Star size={12} fill="#ffb800" color="#ffb800" />
          <span className={styles.ratingScore}>{student.rating.toFixed(1)}</span>
          <span className={styles.reviewCount}>({student.reviewCount})</span>
        </div>
      </Link>

      <div className={styles.skillsSection}>
        <p className={styles.skillsLabel}>ทักษะที่พร้อมแลกเปลี่ยน</p>
        <div className={styles.skillTags}>
          {student.skills.map((skill, index) => (
            <span key={index} className={styles.skillTag}>
              <span className={styles.dot}></span>
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.rate}>
          <Clock size={14} className={styles.clockIcon} />
          <span>{student.rate.hours} ชม. / {student.rate.credits} เครดิต</span>
        </div>
        <button className={styles.requestBtn} onClick={() => navigate('/create-request')}>
          ส่งคำขอแลก <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default StudentCard;
