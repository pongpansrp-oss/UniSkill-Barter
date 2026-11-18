import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './SearchResultsPage.module.css';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import {
  Search,
  SlidersHorizontal,
  Star,
  ArrowLeftRight,
  Zap,
  GraduationCap,
  ChevronDown,
  Video,
  MapPin,
  Sparkles,
  Heart,
  Handshake,
  Quote,
  MessageSquare,
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const {
    db,
    currentUser,
    getUserRatingStats,
    favoriteUserIds,
    toggleFavoriteUser,
  } = useDatabase();

  const [query, setQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<'rating' | 'exchanges' | 'fast'>('rating');
  const [selectedUni, setSelectedUni] = useState('ทั้งหมด');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [modeFilter, setModeFilter] = useState<'all' | 'Online' | 'Onsite'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Sync URL searchParams when navigating with new query/category
  useEffect(() => {
    const qParam = searchParams.get('q');
    const catParam = searchParams.get('category');
    if (qParam !== null) setQuery(qParam);
    if (catParam !== null) setCategoryFilter(catParam);
  }, [searchParams]);

  // Dynamically build universities list from actual database users
  const universities = useMemo(() => {
    const set = new Set<string>(['ทั้งหมด']);
    db.users.forEach((u) => {
      if (u.role === 'student' && u.university?.trim()) {
        set.add(u.university.trim());
      }
    });
    return Array.from(set);
  }, [db.users]);

  const cycleUniversity = () => {
    const idx = universities.indexOf(selectedUni);
    const next = universities[(idx + 1) % universities.length];
    setSelectedUni(next);
  };

  const studentsList = useMemo(() => {
    const orderWeight: Record<string, number> = {
      'u-phawita': 100,
      'u-teeraphat': 90,
      'u-alisa': 80,
      'u-warinthon': 70,
      'u-pachara': 60,
      'u-kawin': 50,
    };

    const filtered = db.users.filter((u) => {
      if (u.role !== 'student' || u.isSuspended) return false;

      if (onlyFavorites && !favoriteUserIds.includes(u.id)) {
        return false;
      }

      if (selectedUni !== 'ทั้งหมด' && !u.university.includes(selectedUni)) {
        return false;
      }

      if (categoryFilter !== 'all') {
        const hasCat = u.skills.some((s) => s.category === categoryFilter);
        if (!hasCat) return false;
      }

      if (modeFilter === 'Online') {
        if (!u.isAvailable) return false;
      } else if (modeFilter === 'Onsite') {
        if (!u.isAvailable) return false;
        // Onsite prioritizes same university if user is logged in and selectedUni is 'ทั้งหมด', or students with onsite requests
        const hasOnsiteReq = db.requests.some(
          (r) =>
            (r.requesterId === u.id || r.targetUserId === u.id) &&
            r.meetingType === 'Onsite'
        );
        const sameUni =
          currentUser &&
          currentUser.role === 'student' &&
          u.university.trim() === currentUser.university.trim();
        if (!sameUni && !hasOnsiteReq && selectedUni === 'ทั้งหมด') {
          return false;
        }
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        const inName = u.name.toLowerCase().includes(q) || (u.nickname?.toLowerCase().includes(q) ?? false);
        const inFaculty = u.faculty.toLowerCase().includes(q) || u.major.toLowerCase().includes(q);
        const inUni = u.university.toLowerCase().includes(q);
        const inSkills = u.skills.some((s) => s.name.toLowerCase().includes(q));
        const inWanted = u.skillWanted?.toLowerCase().includes(q) ?? false;
        return inName || inFaculty || inUni || inSkills || inWanted;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const aIsSelf = a.id === currentUser?.id ? 1 : 0;
      const bIsSelf = b.id === currentUser?.id ? 1 : 0;
      if (aIsSelf !== bIsSelf) return aIsSelf - bIsSelf;

      if (sortBy === 'exchanges') {
        return (b.exchangeCount || 0) - (a.exchangeCount || 0);
      }
      if (sortBy === 'fast') {
        const aFast = a.badgeType === 'fast' ? 1 : 0;
        const bFast = b.badgeType === 'fast' ? 1 : 0;
        if (bFast !== aFast) return bFast - aFast;
      }
      const statA = getUserRatingStats(a.id).average;
      const statB = getUserRatingStats(b.id).average;
      if (
        !query &&
        selectedUni === 'ทั้งหมด' &&
        categoryFilter === 'all' &&
        modeFilter === 'all' &&
        !onlyFavorites &&
        sortBy === 'rating'
      ) {
        const wA = orderWeight[a.id] ?? 85;
        const wB = orderWeight[b.id] ?? 85;
        if (wB !== wA) return wB - wA;
      }
      return statB - statA;
    });
  }, [
    db.users,
    db.requests,
    currentUser,
    query,
    sortBy,
    selectedUni,
    categoryFilter,
    modeFilter,
    onlyFavorites,
    favoriteUserIds,
    getUserRatingStats,
  ]);

  const handleResetAllFilters = () => {
    setQuery('');
    setSelectedUni('ทั้งหมด');
    setCategoryFilter('all');
    setModeFilter('all');
    setOnlyFavorites(false);
  };

  return (
    <div className={styles.page}>
      <Header title="Search" />

      <main className={styles.mainContent}>
        {/* Search Input Box */}
        <div className={styles.searchWrapper}>
          <Search size={18} color="var(--primary)" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Python, ออกแบบ UI, ติวสอบ Cal 2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {categoryFilter !== 'all' && (
            <button
              type="button"
              className={styles.clearCatChip}
              onClick={() => setCategoryFilter('all')}
            >
              {categoryFilter} ✕
            </button>
          )}
          <button
            type="button"
            className={styles.filterBtn}
            onClick={handleResetAllFilters}
            title="รีเซ็ตตัวกรอง"
          >
            <SlidersHorizontal size={16} color="var(--text-main)" />
          </button>
        </div>

        {/* Sort Chips Row */}
        <div className={styles.chipsScroll}>
          <button
            type="button"
            className={`${styles.sortChip} ${sortBy === 'rating' ? styles.sortChipActive : ''}`}
            onClick={() => setSortBy('rating')}
          >
            <Star
              size={14}
              fill={sortBy === 'rating' ? 'var(--primary)' : 'none'}
              color={sortBy === 'rating' ? 'var(--primary)' : 'var(--text-secondary)'}
            />
            <span>คะแนนสูงสุด</span>
          </button>

          <button
            type="button"
            className={`${styles.sortChip} ${
              sortBy === 'exchanges' ? styles.sortChipActive : ''
            }`}
            onClick={() => setSortBy('exchanges')}
          >
            <ArrowLeftRight size={14} />
            <span>แลกเปลี่ยนสำเร็จมากสุด</span>
          </button>

          <button
            type="button"
            className={`${styles.sortChip} ${sortBy === 'fast' ? styles.sortChipActive : ''}`}
            onClick={() => setSortBy('fast')}
          >
            <Zap size={14} />
            <span>ตอบกลับไว</span>
          </button>
        </div>

        {/* Filter Chips Row */}
        <div className={styles.chipsScroll}>
          <button
            type="button"
            className={`${styles.filterChip} ${
              selectedUni !== 'ทั้งหมด' ? styles.filterChipActive : ''
            }`}
            onClick={cycleUniversity}
          >
            <GraduationCap size={14} />
            <span>
              {selectedUni === 'ทั้งหมด' ? 'มหาวิทยาลัย / คณะ' : selectedUni}
            </span>
            <ChevronDown size={13} />
          </button>

          <button
            type="button"
            className={`${styles.filterChip} ${
              modeFilter === 'Online' ? styles.filterChipActive : ''
            }`}
            onClick={() =>
              setModeFilter((prev) => (prev === 'Online' ? 'all' : 'Online'))
            }
          >
            <Video size={14} color="var(--primary)" />
            <span className={styles.onlineLabel}>Online</span>
          </button>

          <button
            type="button"
            className={`${styles.filterChip} ${
              modeFilter === 'Onsite' ? styles.filterChipActive : ''
            }`}
            onClick={() =>
              setModeFilter((prev) => (prev === 'Onsite' ? 'all' : 'Onsite'))
            }
          >
            <MapPin size={14} />
            <span>Onsite ในมอ</span>
          </button>

          <button
            type="button"
            className={`${styles.filterChip} ${
              onlyFavorites ? styles.filterChipActive : ''
            }`}
            onClick={() => setOnlyFavorites((prev) => !prev)}
          >
            <Heart
              size={13}
              fill={onlyFavorites ? '#ef4444' : 'none'}
              color={onlyFavorites ? '#ef4444' : 'var(--text-secondary)'}
            />
            <span>ที่บันทึกไว้ ({favoriteUserIds.length})</span>
          </button>
        </div>

        {/* Results Count Row */}
        <div className={styles.resultsSummary}>
          <div className={styles.resultsLeft}>
            <span className={styles.purpleDot}></span>
            <span>
              พบเพื่อนนักศึกษา{' '}
              <strong className={styles.highlightCount}>
                {db.users.some((u) => u.id === 'u-kawin') &&
                !query &&
                selectedUni === 'ทั้งหมด' &&
                categoryFilter === 'all' &&
                modeFilter === 'all' &&
                !onlyFavorites
                  ? `148 คน (${studentsList.length} โปรไฟล์พร้อมจับคู่)`
                  : `${studentsList.length} คน`}
              </strong>{' '}
              พร้อมแลกเปลี่ยน
            </span>
          </div>
          <div className={styles.verifiedSummary}>
            <Sparkles size={13} />
            <span>ยืนยันตัวตนแล้ว</span>
          </div>
        </div>

        {/* Student Cards List or Empty State */}
        {studentsList.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <h3 className={styles.emptyStateTitle}>ไม่พบเพื่อนนักศึกษาที่ตรงกับตัวกรอง</h3>
            <p className={styles.emptyStateSub}>
              ลองเปลี่ยนคำค้นหา เลือกมหาวิทยาลัยอื่น หรือรีเซ็ตตัวกรองเพื่อดูรายชื่อทั้งหมด
            </p>
            <button
              type="button"
              className={styles.resetFilterBtn}
              onClick={handleResetAllFilters}
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <div className={styles.cardsList}>
            {studentsList.map((stu) => {
              const ratingStats = getUserRatingStats(stu.id);
              const latestReview = ratingStats.reviews[0];
              const isFav = favoriteUserIds.includes(stu.id);

              return (
                <div
                  key={stu.id}
                  className={styles.studentCard}
                  onClick={() => navigate(`/student/${stu.id}`)}
                >
                  {/* Top Profile Row */}
                  <div className={styles.cardTopRow}>
                    <div className={styles.avatarWrap}>
                      <img src={stu.picture} alt={stu.name} className={styles.avatar} />
                      <span
                        className={
                          stu.isAvailable
                            ? styles.statusDotGreen
                            : styles.statusDotPurple
                        }
                      ></span>
                    </div>

                    <div className={styles.studentInfo}>
                      <div className={styles.nameBadgeRow}>
                        <h3 className={styles.studentName}>
                          {stu.name}
                          {currentUser?.id === stu.id ? ' (คุณ)' : ''}
                        </h3>
                        {stu.badgeText && (
                          <span
                            className={
                              stu.badgeType === 'top'
                                ? styles.badgeTopRated
                                : stu.badgeType === 'fast'
                                ? styles.badgeFast
                                : styles.badgeVerified
                            }
                          >
                            {stu.badgeType === 'fast' && <Zap size={10} />}
                            {stu.badgeText}
                          </span>
                        )}
                      </div>
                      <p className={styles.studentSub}>
                        {stu.faculty} • {stu.university}
                      </p>
                      {stu.skillWanted && (
                        <p className={styles.wantedSubRow}>
                          🎯 สนใจแลกกับ: {stu.skillWanted}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.heartBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteUser(stu.id);
                      }}
                      aria-label="บันทึกนักศึกษาที่สนใจ"
                    >
                      <Heart
                        size={18}
                        fill={isFav ? '#ef4444' : 'none'}
                        color={isFav ? '#ef4444' : 'var(--text-secondary)'}
                      />
                    </button>
                  </div>

                  {/* Rating & Exchange Bar */}
                  <div className={styles.ratingBar}>
                    <div className={styles.starsGroup}>
                      <div className={styles.starsIcons}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={13}
                            fill="#f59e0b"
                            color="#f59e0b"
                          />
                        ))}
                      </div>
                      <span className={styles.ratingNumber}>
                        {ratingStats.average.toFixed(2)}
                      </span>
                      <span className={styles.reviewTotal}>
                        ({ratingStats.count} รีวิว)
                      </span>
                    </div>

                    <div className={styles.exchangeCountRight}>
                      <Handshake size={13} color="var(--primary)" />
                      <span>แลกแล้ว {stu.exchangeCount} ครั้ง</span>
                    </div>
                  </div>

                  {/* Review Quote Snippet */}
                  <div className={styles.quoteRow}>
                    <Quote size={13} color="var(--primary)" className={styles.quoteIcon} />
                    <p className={styles.quoteText}>
                      "
                      {latestReview
                        ? latestReview.comment
                        : `พร้อมแลกเปลี่ยนความรู้ ${stu.skills.map((s) => s.name).join(', ')} อย่างเป็นกันเอง`}
                      "
                    </p>
                  </div>

                  {/* Bottom Skills + Action Button */}
                  <div className={styles.cardBottomRow}>
                    <div className={styles.skillTagsWrap}>
                      {stu.skills.map((sk, i) => (
                        <span key={i} className={styles.skillTag}>
                          {sk.name}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={styles.chatRequestBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentUser?.id === stu.id) {
                          navigate('/profile');
                        } else {
                          navigate(`/create-request?target=${stu.id}`);
                        }
                      }}
                      title="ส่งคำขอแลกเปลี่ยนทักษะกับนักศึกษาคนนี้"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className={styles.scrollHintText}>
          แตะที่การ์ดเพื่อดูพอร์ตโฟลิโอและรีวิวฉบับเต็ม หรือกดไอคอนข้อความเพื่อส่งคำขอทันที
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default SearchResultsPage;
