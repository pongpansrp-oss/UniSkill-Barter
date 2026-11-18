import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './StudentProfileDetailsPage.module.css';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import {
  GraduationCap,
  Star,
  Handshake,
  Zap,
  Lightbulb,
  Folder,
  Lock,
  Unlock,
  Phone,
  MessageSquare,
  Globe,
  Send,
  Flag,
  Trash2,
  Heart,
  ExternalLink,
  Code,
  Palette,
  Pencil,
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

function normalizeExternalUrl(raw?: string): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('@')) {
    return `https://github.com/${trimmed.slice(1)}`;
  }
  return `https://${trimmed}`;
}

const StudentProfileDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    db,
    currentUser,
    isGuest,
    getUserById,
    getUserRatingStats,
    canViewPrivateContact,
    addReview,
    deleteReviewByAdmin,
    reportUser,
    favoriteUserIds,
    toggleFavoriteUser,
    calculateMatchScore,
  } = useDatabase();

  const student = id ? getUserById(id) : undefined;

  const [showReviewForm, setShowReviewForm] = useState(
    searchParams.get('review') === 'true'
  );
  const [rateValue, setRateValue] = useState<number>(5.0);
  const [reviewSkill, setReviewSkill] = useState(searchParams.get('skill') || '');
  const [reviewComment, setReviewComment] = useState('');

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('ทิ้งงาน / ไม่มาตามนัดหมาย');
  const [reportDetail, setReportDetail] = useState('');

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sync reviewSkill from URL query param or completed request
  useEffect(() => {
    const querySkill = searchParams.get('skill');
    if (querySkill) {
      setReviewSkill(querySkill);
      return;
    }
    if (currentUser && student) {
      const completedReq = db.requests.find(
        (r) =>
          r.status === 'Completed' &&
          ((r.requesterId === currentUser.id && r.targetUserId === student.id) ||
            (r.targetUserId === currentUser.id && r.requesterId === student.id))
      );
      if (completedReq) {
        setReviewSkill(
          completedReq.requesterId === currentUser.id
            ? completedReq.skillNeeded
            : completedReq.skillOffered
        );
      } else if (student.skills[0]?.name) {
        setReviewSkill(student.skills[0].name);
      }
    }
  }, [currentUser?.id, student?.id, searchParams]);

  if (!student) {
    return (
      <div className={styles.page}>
        <Header title="Student Profile" showBack />
        <main className={styles.mainContent}>
          <div className={styles.emptyCard}>
            <h2>ไม่พบข้อมูลนักศึกษา</h2>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => navigate('/search')}
            >
              กลับไปหน้าค้นหา
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === student.id;
  const isFav = favoriteUserIds.includes(student.id);
  const ratingStats = getUserRatingStats(student.id);
  const contactUnlocked = isOwnProfile || canViewPrivateContact(student.id);
  const matchInfo = !isOwnProfile ? calculateMatchScore(student) : null;
  const matchScore = matchInfo ? matchInfo.percent : 0;

  const hasCompletedExchange = Boolean(
    currentUser &&
      db.requests.some(
        (r) =>
          r.status === 'Completed' &&
          ((r.requesterId === currentUser.id && r.targetUserId === student.id) ||
            (r.targetUserId === currentUser.id && r.requesterId === student.id))
      )
  );

  const handleRequestHelpClick = () => {
    if (isGuest || !currentUser) {
      setFeedback({
        type: 'error',
        text: 'สิทธิ์ของ Guest ไม่สามารถกดส่งคำขอความช่วยเหลือได้ กรุณาเข้าสู่ระบบนักศึกษาก่อน',
      });
      return;
    }
    if (isOwnProfile) {
      navigate('/profile');
      return;
    }
    navigate(`/create-request?target=${student.id}`);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const requestIdParam = searchParams.get('requestId') || undefined;

    const res = await addReview({
      targetUserId: student.id,
      requestId: requestIdParam,
      rate: rateValue,
      comment: reviewComment,
      skillExchanged: reviewSkill || student.skills[0]?.name || 'Skill Exchange',
    });

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.message || 'ไม่สามารถบันทึกรีวิวได้' });
      return;
    }

    setReviewComment('');
    setShowReviewForm(false);
    setFeedback({
      type: 'success',
      text: 'บันทึกรีวิว คำนวณคะแนนเฉลี่ยใหม่ และมอบ +15 XP ลงฐานข้อมูล JSON เรียบร้อยแล้ว!',
    });
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = await reportUser({
      targetUserId: student.id,
      reason: reportReason,
      detail: reportDetail,
    });

    if (!res.ok) {
      setFeedback({ type: 'error', text: res.message || 'ไม่สามารถส่งรายงานได้' });
      return;
    }

    setReportDetail('');
    setShowReportForm(false);
    setFeedback({
      type: 'success',
      text: res.message || 'ส่งรายงานให้ผู้ดูแลระบบตรวจสอบเรียบร้อยแล้ว',
    });
  };

  const hasPortfolioLinks = Boolean(
    student.portfolioLinks?.githubOrWebsite ||
      student.portfolioLinks?.dribbble ||
      student.portfolioLinks?.googleDrive
  );

  return (
    <div className={styles.page}>
      <Header title={isOwnProfile ? 'My Public Profile' : 'Student Profile'} showBack />

      <main className={styles.mainContent}>
        {feedback && (
          <div
            className={`${styles.feedbackBox} ${
              feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess
            }`}
          >
            <span>{feedback.text}</span>
            <button type="button" onClick={() => setFeedback(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Student Profile Hero Card */}
        <section className={styles.heroCard}>
          <div className={styles.topRowBadges}>
            <span className={styles.verifiedPill}>
              นักศึกษายืนยันตัวตนแล้ว ({student.verifiedDomain || '@university.ac.th'})
            </span>
            <span className={student.isAvailable ? styles.availPill : styles.busyPill}>
              {student.isAvailable ? '● ว่างนัดสัปดาห์นี้' : '○ คิวเต็มชั่วคราว'}
            </span>
            {!isOwnProfile && matchScore > 0 && (
              <span className={styles.matchScorePill}>⚡ Match {matchScore}%</span>
            )}
            {student.isSuspended && (
              <span className={styles.suspendedBadge}>ระงับชั่วคราว</span>
            )}
          </div>

          <div className={styles.avatarWrap}>
            <img src={student.picture} alt={student.name} className={styles.avatar} />
          </div>

          <h1 className={styles.name}>
            {student.name}
            {student.nickname ? ` (${student.nickname})` : ''}
          </h1>
          <p className={styles.faculty}>
            {student.faculty} • {student.major}
          </p>
          <div className={styles.uniRow}>
            <GraduationCap size={15} />
            <span>
              ชั้นปีที่ {student.year} • {student.university}
            </span>
          </div>

          {isOwnProfile ? (
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.requestHelpBtn}
                onClick={() => navigate('/profile')}
              >
                <Pencil size={15} />
                <span>แก้ไขข้อมูลโปรไฟล์ของฉัน</span>
              </button>
            </div>
          ) : (
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.requestHelpBtn}
                onClick={handleRequestHelpClick}
              >
                <Send size={15} />
                <span>ปุ่มขอความช่วยเหลือ (Request Help)</span>
              </button>
              <button
                type="button"
                className={`${styles.favIconBtn} ${isFav ? styles.favIconBtnActive : ''}`}
                onClick={() => toggleFavoriteUser(student.id)}
                title={isFav ? 'ลบออกจากรายการโปรด' : 'บันทึกเป็นรายการโปรด'}
              >
                <Heart
                  size={16}
                  fill={isFav ? '#ef4444' : 'none'}
                  color={isFav ? '#ef4444' : 'currentColor'}
                />
              </button>
              <button
                type="button"
                className={styles.reportIconBtn}
                onClick={() => setShowReportForm((prev) => !prev)}
                title="รายงานผู้ใช้ (Report)"
              >
                <Flag size={16} />
              </button>
            </div>
          )}
        </section>

        {/* Report Form Drawer */}
        {showReportForm && !isOwnProfile && (
          <form className={styles.reportCard} onSubmit={handleReportSubmit}>
            <h3 className={styles.reportTitle}>🚩 รายงานพฤติกรรมไม่เหมาะสม (Report)</h3>
            <p className={styles.reportSub}>
              หากผู้ใช้ถูกรายงานครบ 3 ครั้ง บัญชีจะถูกระงับชั่วคราวเพื่อให้ Admin ตรวจสอบ
              (ปัจจุบันถูกรายงาน {student.reportCount}/3 ครั้ง)
            </p>
            <select
              className={styles.input}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="ทิ้งงาน / ไม่มาตามนัดหมาย">ทิ้งงาน / ไม่มาตามนัดหมาย</option>
              <option value="ใช้คำหยาบคาย / พฤติกรรมไม่เหมาะสม">
                ใช้คำหยาบคาย / พฤติกรรมไม่เหมาะสม
              </option>
              <option value="ให้ช่องทางติดต่อปลอม">ให้ช่องทางติดต่อปลอม</option>
            </select>
            <textarea
              className={styles.textarea}
              rows={2}
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              required
            />
            <div className={styles.formBtns}>
              <button type="submit" className={styles.dangerSubmitBtn}>
                ส่งรายงาน (Report)
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowReportForm(false)}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}

        {/* Stats Row */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <Star size={16} fill="var(--primary)" color="var(--primary)" />
              <span className={styles.statNum}>{ratingStats.average.toFixed(2)}</span>
            </div>
            <span className={styles.statSub}>จาก {ratingStats.count} รีวิว</span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <Handshake size={16} color="var(--primary)" />
              <span className={styles.statNum}>{student.exchangeCount}</span>
            </div>
            <span className={styles.statSub}>แลกเปลี่ยนสำเร็จ</span>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <Zap size={15} color="var(--primary)" />
              <span className={styles.statTextVal}>{student.responseTime}</span>
            </div>
            <span className={styles.statSub}>เวลาตอบกลับ</span>
          </div>
        </section>

        {/* Skills Card */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Lightbulb size={17} color="var(--primary)" />
            <h2 className={styles.sectionTitle}>ทักษะที่พร้อมแลกเปลี่ยน (Skills)</h2>
          </div>
          <div className={styles.skillsWrap}>
            {student.skills.map((sk, idx) => (
              <div key={idx} className={styles.skillPill}>
                <span className={styles.skillDot}></span>
                <span className={styles.skillName}>{sk.name}</span>
                <span className={styles.skillLevel}>{sk.level}</span>
              </div>
            ))}
          </div>
          {student.skillWanted && (
            <div className={styles.wantedBox}>
              <span>🎯 ทักษะที่สนใจอยากแลกเปลี่ยน: {student.skillWanted}</span>
            </div>
          )}
        </section>

        {/* Portfolio Card */}
        {(student.portfolioItems?.length > 0 || hasPortfolioLinks) && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Folder size={17} color="var(--primary)" />
              <h2 className={styles.sectionTitle}>ผลงานและ Portfolio</h2>
            </div>
            {student.portfolioItems?.map((item) => {
              const itemHref = normalizeExternalUrl(item.url);
              return (
                <div key={item.id} className={styles.portfolioRow}>
                  <div className={styles.portfolioLeft}>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className={styles.portfolioImg}
                      />
                    )}
                    <div>
                      <h4 className={styles.portfolioTitle}>{item.title}</h4>
                      <p className={styles.portfolioDesc}>{item.description}</p>
                      <span className={styles.portfolioTag}>{item.tag}</span>
                    </div>
                  </div>
                  {itemHref && (
                    <a
                      href={itemHref}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.portfolioLinkChip}
                      title="เปิดลิงก์ผลงาน"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              );
            })}

            {hasPortfolioLinks && (
              <div className={styles.portfolioLinksRow}>
                {student.portfolioLinks?.githubOrWebsite && (
                  <a
                    href={normalizeExternalUrl(student.portfolioLinks.githubOrWebsite)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.portfolioLinkChip}
                  >
                    <Code size={13} />
                    <span>{student.portfolioLinks.githubOrWebsite}</span>
                    <ExternalLink size={11} />
                  </a>
                )}
                {student.portfolioLinks?.dribbble && (
                  <a
                    href={normalizeExternalUrl(student.portfolioLinks.dribbble)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.portfolioLinkChip}
                  >
                    <Palette size={13} />
                    <span>{student.portfolioLinks.dribbble}</span>
                    <ExternalLink size={11} />
                  </a>
                )}
                {student.portfolioLinks?.googleDrive && (
                  <a
                    href={normalizeExternalUrl(student.portfolioLinks.googleDrive)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.portfolioLinkChip}
                  >
                    <Folder size={13} />
                    <span>Google Drive Portfolio</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        {/* Private Contact Section (Enforces Privacy Rule) */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeaderBetween}>
            <div className={styles.sectionHeader}>
              {contactUnlocked ? (
                <Unlock size={17} color="#16a34a" />
              ) : (
                <Lock size={17} color="var(--primary)" />
              )}
              <h2 className={styles.sectionTitle}>ช่องทางติดต่อ (Contact)</h2>
            </div>
            <span className={contactUnlocked ? styles.unlockedBadge : styles.lockedBadge}>
              {contactUnlocked ? 'ปลดล็อกแล้ว (Accepted)' : 'ซ่อนเพื่อความเป็นส่วนตัว'}
            </span>
          </div>

          <p className={styles.privacyNote}>
            {contactUnlocked
              ? 'คุณมีคำขอที่ได้รับการยอมรับ (Accepted/Completed) กับนักศึกษาคนนี้แล้ว สามารถติดต่อนัดหมายได้ทันที'
              : 'ช่องทางติดต่อถูกซ่อนไว้ และจะแสดงก็ต่อเมื่อผู้รับตกลงรับคำขอ (Accepted) แล้วเท่านั้น'}
          </p>

          <div className={styles.contactList}>
            <div className={styles.contactRow}>
              <span>
                <MessageSquare size={14} color="var(--primary)" /> LINE ID
              </span>
              <strong>
                {contactUnlocked ? student.contact.lineId : '•••••••• (รอการตอบรับคำขอ)'}
              </strong>
            </div>
            <div className={styles.contactRow}>
              <span>
                <Phone size={14} color="var(--primary)" /> เบอร์โทรศัพท์
              </span>
              <strong>
                {contactUnlocked ? student.contact.phone : '08x-xxx-xxxx (รอการตอบรับคำขอ)'}
              </strong>
            </div>
            {student.contact.facebook && (
              <div className={styles.contactRow}>
                <span>
                  <Globe size={14} color="var(--primary)" /> Facebook
                </span>
                <strong>
                  {contactUnlocked ? student.contact.facebook : 'ซ่อนอยู่'}
                </strong>
              </div>
            )}
          </div>
        </section>

        {/* Reviews & Rating Section */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeaderBetween}>
            <div className={styles.sectionHeader}>
              <Star size={17} color="var(--primary)" />
              <h2 className={styles.sectionTitle}>
                รีวิวและความคิดเห็น ({ratingStats.count})
              </h2>
            </div>
            {!isOwnProfile && (
              <button
                type="button"
                className={styles.writeReviewToggleBtn}
                onClick={() => setShowReviewForm((prev) => !prev)}
              >
                + เขียนรีวิว
              </button>
            )}
          </div>

          {showReviewForm && !isOwnProfile && (
            <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
              {!hasCompletedExchange && (
                <div className={styles.ruleNotice}>
                  หมายเหตุ: ระบบอนุญาตให้รีวิวได้เฉพาะเมื่อมีคำขอที่สถานะเป็น{' '}
                  <strong>Completed (แลกเปลี่ยนสำเร็จแล้ว)</strong> กับนักศึกษาคนนี้เท่านั้น
                </div>
              )}

              <div className={styles.starPickerRow}>
                <div className={styles.starButtons}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={styles.starBtn}
                      onClick={() => setRateValue(star)}
                      aria-label={`ให้คะแนน ${star} ดาว`}
                    >
                      <Star
                        size={20}
                        fill={rateValue >= star ? '#f59e0b' : 'none'}
                        color={rateValue >= star ? '#f59e0b' : '#9ca3af'}
                      />
                    </button>
                  ))}
                </div>
                <div className={styles.rateFieldRow}>
                  <label>คะแนนทศนิยม:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={rateValue}
                    onChange={(e) => setRateValue(parseFloat(e.target.value) || 5.0)}
                    className={styles.rateInput}
                    required
                  />
                </div>
              </div>

              <input
                type="text"
                className={styles.input}
                placeholder="ทักษะที่แลกเปลี่ยน เช่น Python Data, Blender 3D"
                value={reviewSkill}
                onChange={(e) => setReviewSkill(e.target.value)}
              />

              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="เขียนความคิดเห็นหรือคำชมจากการแลกเปลี่ยนทักษะ (รีวิวที่บันทึกแล้วไม่สามารถลบเองได้)..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
              />

              <button type="submit" className={styles.submitReviewBtn}>
                บันทึกรีวิวลง JSON (+15 XP)
              </button>
            </form>
          )}

          <div className={styles.reviewsList}>
            {ratingStats.reviews.length === 0 ? (
              <p className={styles.privacyNote}>ยังไม่มีรีวิวสำหรับนักศึกษาคนนี้</p>
            ) : (
              ratingStats.reviews.map((rev) => (
                <div key={rev.id} className={styles.reviewItem}>
                  <div className={styles.reviewTop}>
                    <div className={styles.reviewerInfo}>
                      <img
                        src={rev.reviewerAvatar}
                        alt={rev.reviewerName}
                        className={styles.reviewerAvatar}
                      />
                      <div>
                        <h4 className={styles.reviewerName}>{rev.reviewerName}</h4>
                        <span className={styles.reviewSkill}>
                          แลกเปลี่ยน: {rev.skillExchanged}
                        </span>
                      </div>
                    </div>
                    <div className={styles.reviewRight}>
                      <span className={styles.reviewRate}>★ {rev.rate.toFixed(1)}</span>
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          className={styles.adminDeleteBtn}
                          onClick={() => deleteReviewByAdmin(rev.id)}
                          title="ลบรีวิวไม่เหมาะสม (เฉพาะ Admin)"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={styles.reviewComment}>"{rev.comment}"</p>
                  <span className={styles.reviewTime}>{rev.timeAgo || 'เมื่อเร็วๆ นี้'}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default StudentProfileDetailsPage;
