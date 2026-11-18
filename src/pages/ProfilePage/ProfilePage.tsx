import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.css';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import {
  GraduationCap,
  Pencil,
  Star,
  Handshake,
  Zap,
  ArrowUpDown,
  Lightbulb,
  Plus,
  Folder,
  Code,
  Palette,
  Lock,
  MessageSquare,
  Phone,
  MessageCircle,
  Download,
  X,
  Camera,
  Sparkles,
  Award,
  Trash2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useDatabase, inferSkillCategory } from '../../context/DatabaseContext';
import type { SkillItem } from '../../types/database';

function maskLineId(lineId: string): string {
  if (!lineId) return 'ยังไม่ระบุ';
  if (lineId.length <= 4) return `${lineId}••••`;
  return `${lineId.slice(0, Math.min(11, lineId.length - 3))}••••`;
}

function maskPhone(phone: string): string {
  if (!phone) return 'ยังไม่ระบุ';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-xxx-${digits.slice(-4)}`;
  }
  return `${phone.slice(0, 3)}-xxx-xxxx`;
}

function compressAvatarImage(file: File, maxSize = 260, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const {
    currentUser,
    isGuest,
    updateCurrentUser,
    getUserRatingStats,
    exportDatabaseJson,
  } = useDatabase();

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Skills state
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('Lv.4');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillItem['category'] | 'auto'>('auto');

  // Edit Profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPicture, setEditPicture] = useState(currentUser?.picture || '');
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editNickname, setEditNickname] = useState(currentUser?.nickname || '');
  const [editUniversity, setEditUniversity] = useState(currentUser?.university || '');
  const [editFaculty, setEditFaculty] = useState(currentUser?.faculty || '');
  const [editMajor, setEditMajor] = useState(currentUser?.major || '');
  const [editYear, setEditYear] = useState(currentUser?.year || '3');
  const [editSkillWanted, setEditSkillWanted] = useState(currentUser?.skillWanted || '');
  const [editPhone, setEditPhone] = useState(currentUser?.contact?.phone || '');
  const [editLine, setEditLine] = useState(currentUser?.contact?.lineId || '');
  const [editFacebook, setEditFacebook] = useState(currentUser?.contact?.facebook || '');

  // Portfolio management state
  const [showPortfolioEditor, setShowPortfolioEditor] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTag, setProjTag] = useState('');
  const [projUrl, setProjUrl] = useState('');
  const [editGithub, setEditGithub] = useState(currentUser?.portfolioLinks?.githubOrWebsite || '');
  const [editDribbble, setEditDribbble] = useState(currentUser?.portfolioLinks?.dribbble || '');
  const [editDrive, setEditDrive] = useState(currentUser?.portfolioLinks?.googleDrive || '');

  const [showRealContact, setShowRealContact] = useState(false);

  if (isGuest || !currentUser) {
    return (
      <div className={styles.page}>
        <Header title="Profile" />
        <main className={styles.mainContent}>
          <div className={styles.guestCard}>
            <h2>คุณกำลังใช้งานในโหมด Guest</h2>
            <p>
              กรุณาเข้าสู่ระบบนักศึกษา หรือสมัครสมาชิกใหม่เพื่อสร้างโปรไฟล์ เพิ่มทักษะ
              และเริ่มส่งคำขอแลกเปลี่ยนความรู้กับเพื่อนต่างคณะ
            </p>
            <div className={styles.guestBtnGroup}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => navigate('/')}
              >
                เข้าสู่ระบบนักศึกษา
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => navigate('/create-profile')}
              >
                สมัครสมาชิกและสร้างโปรไฟล์
              </button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const ratingStats = getUserRatingStats(currentUser.id);
  const portfolioItems = currentUser.portfolioItems || [];

  const handleToggleAvailable = async () => {
    await updateCurrentUser({ isAvailable: !currentUser.isAvailable });
    setFeedbackMsg(
      !currentUser.isAvailable
        ? 'เปิดรับคำขอแลกเปลี่ยนทักษะในสัปดาห์นี้แล้ว'
        : 'เปลี่ยนสถานะเป็นคิวเต็มชั่วคราวแล้ว'
    );
  };

  const handleAddSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const resolvedCategory =
      newSkillCategory === 'auto'
        ? inferSkillCategory(newSkillName.trim())
        : newSkillCategory;

    const updatedSkills: SkillItem[] = [
      ...currentUser.skills,
      {
        name: newSkillName.trim(),
        level: newSkillLevel,
        category: resolvedCategory,
      },
    ];
    await updateCurrentUser({ skills: updatedSkills });
    setNewSkillName('');
    setNewSkillCategory('auto');
    setShowAddSkill(false);
    setFeedbackMsg(`เพิ่มทักษะ "${newSkillName.trim()}" ลงโปรไฟล์เรียบร้อยแล้ว!`);
  };

  const handleRemoveSkill = async (idx: number) => {
    if (currentUser.skills.length <= 1) {
      alert('ต้องมีทักษะอย่างน้อย 1 อย่างในโปรไฟล์');
      return;
    }
    const updatedSkills = currentUser.skills.filter((_, i) => i !== idx);
    await updateCurrentUser({ skills: updatedSkills });
  };

  const openEditModal = () => {
    setEditPicture(currentUser.picture);
    setEditName(currentUser.name);
    setEditNickname(currentUser.nickname || '');
    setEditUniversity(currentUser.university);
    setEditFaculty(currentUser.faculty);
    setEditMajor(currentUser.major);
    setEditYear(currentUser.year || '3');
    setEditSkillWanted(currentUser.skillWanted || '');
    setEditPhone(currentUser.contact.phone);
    setEditLine(currentUser.contact.lineId);
    setEditFacebook(currentUser.contact.facebook || '');
    setIsEditingProfile(true);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarImage(file);
      setEditPicture(compressed);
    } catch {
      // ignore
    }
  };

  const handleSaveProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentUser({
      picture: editPicture || currentUser.picture,
      name: editName.trim() || currentUser.name,
      nickname: editNickname.trim() || currentUser.nickname,
      university: editUniversity.trim() || currentUser.university,
      faculty: editFaculty.trim() || currentUser.faculty,
      major: editMajor.trim() || currentUser.major,
      year: editYear.trim() || currentUser.year,
      skillWanted: editSkillWanted.trim() || currentUser.skillWanted,
      contact: {
        ...currentUser.contact,
        phone: editPhone.trim() || currentUser.contact.phone,
        lineId: editLine.trim() || currentUser.contact.lineId,
        facebook: editFacebook.trim() || undefined,
      },
    });
    setIsEditingProfile(false);
    setFeedbackMsg('บันทึกข้อมูลส่วนตัวลงไฟล์ฐานข้อมูล JSON เรียบร้อยแล้ว!');
  };

  const openPortfolioEditor = () => {
    setEditGithub(currentUser.portfolioLinks?.githubOrWebsite || '');
    setEditDribbble(currentUser.portfolioLinks?.dribbble || '');
    setEditDrive(currentUser.portfolioLinks?.googleDrive || '');
    setShowPortfolioEditor((prev) => !prev);
  };

  const handleAddPortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedLinks = {
      githubOrWebsite: editGithub.trim() || undefined,
      dribbble: editDribbble.trim() || undefined,
      googleDrive: editDrive.trim() || undefined,
    };

    let updatedItems = [...portfolioItems];
    if (projTitle.trim()) {
      updatedItems = [
        ...updatedItems,
        {
          id: `p-${Date.now()}`,
          title: projTitle.trim(),
          description: projDesc.trim() || 'ผลงานแลกเปลี่ยนทักษะและโปรเจกต์ของนักศึกษา',
          tag: projTag.trim() || currentUser.skills[0]?.name || 'Project',
          imageUrl:
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&auto=format&fit=crop&q=80',
          url: projUrl.trim() || undefined,
        },
      ];
    }

    await updateCurrentUser({
      portfolioItems: updatedItems,
      portfolioLinks: updatedLinks,
    });

    setProjTitle('');
    setProjDesc('');
    setProjTag('');
    setProjUrl('');
    setShowPortfolioEditor(false);
    setFeedbackMsg('อัปเดตข้อมูลผลงานและลิงก์ Portfolio เรียบร้อยแล้ว!');
  };

  const handleDeletePortfolioItem = async (itemId: string) => {
    const updatedItems = portfolioItems.filter((item) => item.id !== itemId);
    await updateCurrentUser({ portfolioItems: updatedItems });
  };

  return (
    <div className={styles.page}>
      <Header title="Profile" />

      <main className={styles.mainContent}>
        {feedbackMsg && (
          <div className={styles.feedbackBanner}>
            <span>{feedbackMsg}</span>
            <button type="button" onClick={() => setFeedbackMsg(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Main Hero Card */}
        <section className={styles.heroCard}>
          <div className={styles.verifiedDomainPill}>
            นักศึกษายืนยันตัวตนแล้ว ({currentUser.verifiedDomain || '@university.ac.th'})
          </div>

          <div className={styles.avatarContainer}>
            <img
              src={currentUser.picture}
              alt={currentUser.name}
              className={styles.avatarImg}
            />
            <span
              className={currentUser.isAvailable ? styles.statusDot : styles.statusDotBusy}
            ></span>
          </div>

          <h1 className={styles.userName}>
            {currentUser.name}
            {currentUser.nickname ? ` (${currentUser.nickname})` : ''}
          </h1>
          <p className={styles.userFaculty}>
            {currentUser.faculty} • {currentUser.major}
          </p>
          <div className={styles.userUniversityRow}>
            <GraduationCap size={15} color="var(--text-secondary)" />
            <span>
              ชั้นปีที่ {currentUser.year || '3'} • {currentUser.university}
            </span>
          </div>

          <div className={styles.heroBtnRow}>
            <button
              type="button"
              className={styles.editProfileBtn}
              onClick={openEditModal}
            >
              <Pencil size={13} />
              <span>แก้ไขข้อมูลส่วนตัว</span>
            </button>
            <button
              type="button"
              className={styles.editProfileBtn}
              onClick={() => navigate(`/student/${currentUser.id}`)}
            >
              <ExternalLink size={13} />
              <span>ดูมุมมองสาธารณะ</span>
            </button>
          </div>
        </section>

        {/* Quick Shortcuts to Credit Wallet & Smart Match / Admin */}
        <section className={styles.shortcutGrid}>
          <button
            type="button"
            className={styles.shortcutCard}
            onClick={() => navigate('/credit')}
          >
            <div className={styles.shortcutIcon}>
              <Award size={18} />
            </div>
            <div>
              <div className={styles.shortcutTitle}>Time Credit & XP</div>
              <div className={styles.shortcutSub}>
                {currentUser.xp.toLocaleString()} XP • {(currentUser.exchangeCount * 1.5).toFixed(1)} ชม.
              </div>
            </div>
          </button>

          <button
            type="button"
            className={styles.shortcutCard}
            onClick={() => navigate('/match')}
          >
            <div className={styles.shortcutIcon}>
              <Sparkles size={18} />
            </div>
            <div>
              <div className={styles.shortcutTitle}>
                {currentUser.role === 'admin' ? 'Admin Moderation' : 'Smart Match'}
              </div>
              <div className={styles.shortcutSub}>
                {currentUser.role === 'admin'
                  ? 'จัดการผู้ใช้และรายงาน'
                  : 'จับคู่แลกทักษะอัตโนมัติ'}
              </div>
            </div>
          </button>
        </section>

        {/* Edit Profile Inline Drawer */}
        {isEditingProfile && (
          <form className={styles.editFormCard} onSubmit={handleSaveProfileEdit}>
            <div className={styles.editFormHeader}>
              <h3>แก้ไขข้อมูลส่วนตัว (บันทึกลง JSON)</h3>
              <button type="button" onClick={() => setIsEditingProfile(false)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.editAvatarRow}>
              <img
                src={editPicture || currentUser.picture}
                alt="Avatar preview"
                className={styles.editAvatarPreview}
              />
              <div>
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFileChange}
                />
                <button
                  type="button"
                  className={styles.uploadAvatarBtn}
                  onClick={() => avatarFileRef.current?.click()}
                >
                  <Camera size={13} />
                  <span>อัปโหลดรูปโปรไฟล์ใหม่</span>
                </button>
              </div>
            </div>

            <div className={styles.editTwoCol}>
              <div className={styles.editField}>
                <label>ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.editField}>
                <label>ชื่อเล่น</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="เช่น กวิน"
                />
              </div>
            </div>

            <div className={styles.editTwoCol}>
              <div className={styles.editField}>
                <label>มหาวิทยาลัย</label>
                <input
                  type="text"
                  value={editUniversity}
                  onChange={(e) => setEditUniversity(e.target.value)}
                  required
                />
              </div>
              <div className={styles.editField}>
                <label>ชั้นปี</label>
                <select value={editYear} onChange={(e) => setEditYear(e.target.value)}>
                  <option value="1">ปี 1</option>
                  <option value="2">ปี 2</option>
                  <option value="3">ปี 3</option>
                  <option value="4">ปี 4</option>
                  <option value="5+">ปี 5+</option>
                </select>
              </div>
            </div>

            <div className={styles.editTwoCol}>
              <div className={styles.editField}>
                <label>คณะ</label>
                <input
                  type="text"
                  value={editFaculty}
                  onChange={(e) => setEditFaculty(e.target.value)}
                  required
                />
              </div>
              <div className={styles.editField}>
                <label>สาขาวิชา</label>
                <input
                  type="text"
                  value={editMajor}
                  onChange={(e) => setEditMajor(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.editField}>
              <label>🎯 ทักษะที่สนใจอยากเรียนรู้แลกเปลี่ยน (Skill Wanted)</label>
              <input
                type="text"
                value={editSkillWanted}
                onChange={(e) => setEditSkillWanted(e.target.value)}
                placeholder="เช่น Python, UX/UI Design, ภาษาอังกฤษ"
              />
            </div>

            <div className={styles.editTwoCol}>
              <div className={styles.editField}>
                <label>LINE ID</label>
                <input
                  type="text"
                  value={editLine}
                  onChange={(e) => setEditLine(e.target.value)}
                  required
                />
              </div>
              <div className={styles.editField}>
                <label>เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.editField}>
              <label>Facebook / ช่องทางติดต่อสำรอง</label>
              <input
                type="text"
                value={editFacebook}
                onChange={(e) => setEditFacebook(e.target.value)}
                placeholder="เช่น Kawin Chula"
              />
            </div>

            <button type="submit" className={styles.saveEditBtn}>
              บันทึกการเปลี่ยนแปลงลงฐานข้อมูล
            </button>
          </form>
        )}

        {/* 3 Stats Row */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <Star size={16} fill="var(--primary)" color="var(--primary)" />
              <span className={styles.statValue}>{ratingStats.average.toFixed(2)}</span>
            </div>
            <span className={styles.statLabel}>จาก {ratingStats.count} รีวิว</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <Handshake size={16} color="var(--primary)" />
              <span className={styles.statValue}>{currentUser.exchangeCount}</span>
            </div>
            <span className={styles.statLabel}>แลกเปลี่ยนสำเร็จ</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <Zap size={15} color="var(--primary)" />
              <span className={styles.statValueText}>{currentUser.responseTime || 'ตอบกลับไว'}</span>
            </div>
            <span className={styles.statLabel}>Fast Responder</span>
          </div>
        </section>

        {/* Availability Toggle Card */}
        <section className={styles.availCard}>
          <div className={styles.availLeft}>
            <div className={styles.availIconCircle}>
              <ArrowUpDown size={16} color="var(--primary)" />
            </div>
            <div>
              <h3 className={styles.availTitle}>เปิดรับคำขอแลกเปลี่ยนทักษะ</h3>
              <p className={styles.availSub}>
                สถานะปัจจุบัน:{' '}
                {currentUser.isAvailable
                  ? 'ว่างนัดสัปดาห์นี้ (แสดงในระบบจับคู่)'
                  : 'คิวเต็มชั่วคราว'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`${styles.toggleSwitch} ${
              currentUser.isAvailable ? styles.toggleOn : styles.toggleOff
            }`}
            onClick={handleToggleAvailable}
            aria-label="เปิดหรือปิดรับคำขอแลกเปลี่ยนทักษะ"
          >
            <span className={styles.toggleKnob}></span>
          </button>
        </section>

        {/* My Skills Card */}
        <section className={styles.sectionCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleGroup}>
              <Lightbulb size={17} color="var(--primary)" />
              <h2 className={styles.cardTitle}>ทักษะที่ฉันเชี่ยวชาญ (My Skills)</h2>
            </div>
            <button
              type="button"
              className={styles.addSkillPillBtn}
              onClick={() => setShowAddSkill((prev) => !prev)}
            >
              <Plus size={13} />
              <span>{showAddSkill ? 'เสร็จสิ้น' : 'จัดการทักษะ'}</span>
            </button>
          </div>

          {showAddSkill && (
            <form className={styles.inlineAddSkill} onSubmit={handleAddSkillSubmit}>
              <input
                type="text"
                placeholder="ชื่อทักษะ เช่น SQL, ตัดต่อวิดีโอ..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className={styles.inlineSkillInput}
              />
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
                className={styles.inlineSkillSelect}
              >
                <option value="Lv.3">Lv.3</option>
                <option value="Lv.4">Lv.4</option>
                <option value="Lv.5">Lv.5</option>
                <option value="Advanced">Advanced</option>
              </select>
              <select
                value={newSkillCategory}
                onChange={(e) =>
                  setNewSkillCategory(e.target.value as SkillItem['category'] | 'auto')
                }
                className={styles.inlineSkillSelect}
              >
                <option value="auto">หมวดอัตโนมัติ</option>
                <option value="coding">Coding / Tech</option>
                <option value="design">Design / Art</option>
                <option value="language">Language</option>
                <option value="music">Music / Video</option>
                <option value="academic">Academic / ติววิชา</option>
              </select>
              <button type="submit" className={styles.inlineSkillSaveBtn}>
                + เพิ่ม
              </button>
            </form>
          )}

          <div className={styles.skillsWrap}>
            {currentUser.skills.map((sk, idx) => (
              <div key={`${sk.name}-${idx}`} className={styles.skillPill}>
                <span className={styles.skillDot}></span>
                <span className={styles.skillName}>{sk.name}</span>
                <span className={styles.skillLevel}>{sk.level}</span>
                {showAddSkill && (
                  <button
                    type="button"
                    className={styles.deleteSkillMini}
                    onClick={() => handleRemoveSkill(idx)}
                    title="ลบทักษะนี้"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={styles.wantedBanner}>
            <span>🎯 ทักษะที่อยากเรียนแลกเปลี่ยน: {currentUser.skillWanted || 'ยังไม่ระบุ'}</span>
            <button
              type="button"
              onClick={openEditModal}
              style={{ fontSize: '11px', textDecoration: 'underline', color: 'var(--primary)' }}
            >
              เปลี่ยน
            </button>
          </div>
        </section>

        {/* Portfolio Card (Real Data + Add/Edit) */}
        <section className={styles.sectionCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleGroup}>
              <Folder size={17} color="var(--primary)" />
              <h2 className={styles.cardTitle}>ผลงานและ Portfolio</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.cardRightCount}>{portfolioItems.length} ชิ้นงาน</span>
              <button
                type="button"
                className={styles.addSkillPillBtn}
                onClick={openPortfolioEditor}
              >
                <Plus size={12} />
                <span>{showPortfolioEditor ? 'ปิด' : 'เพิ่ม/แก้ไข'}</span>
              </button>
            </div>
          </div>

          {showPortfolioEditor && (
            <form className={styles.portfolioFormBox} onSubmit={handleAddPortfolioItem}>
              <div className={styles.editField}>
                <label>เพิ่มผลงานใหม่ (เว้นว่างได้หากต้องการแก้เฉพาะลิงก์ด้านล่าง)</label>
                <input
                  type="text"
                  placeholder="ชื่อผลงาน เช่น ระบบจองห้องติว React..."
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                />
              </div>
              {projTitle.trim() && (
                <>
                  <div className={styles.editField}>
                    <label>คำอธิบายผลงานสั้นๆ</label>
                    <input
                      type="text"
                      placeholder="รายละเอียดเทคโนโลยีหรือบทบาทในโปรเจกต์..."
                      value={projDesc}
                      onChange={(e) => setProjDesc(e.target.value)}
                    />
                  </div>
                  <div className={styles.editTwoCol}>
                    <div className={styles.editField}>
                      <label>ป้ายกำกับ (Tag)</label>
                      <input
                        type="text"
                        placeholder="เช่น React + TypeScript"
                        value={projTag}
                        onChange={(e) => setProjTag(e.target.value)}
                      />
                    </div>
                    <div className={styles.editField}>
                      <label>ลิงก์ผลงาน (URL)</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={projUrl}
                        onChange={(e) => setProjUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className={styles.editTwoCol}>
                <div className={styles.editField}>
                  <label>GitHub / Website</label>
                  <input
                    type="text"
                    placeholder="เช่น @username หรือ https://..."
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                  />
                </div>
                <div className={styles.editField}>
                  <label>Dribbble / Behance</label>
                  <input
                    type="text"
                    placeholder="เช่น myportfolio.design"
                    value={editDribbble}
                    onChange={(e) => setEditDribbble(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.editField}>
                <label>ลิงก์ Google Drive รวมผลงาน</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={editDrive}
                  onChange={(e) => setEditDrive(e.target.value)}
                />
              </div>

              <button type="submit" className={styles.saveEditBtn}>
                บันทึกข้อมูล Portfolio
              </button>
            </form>
          )}

          {portfolioItems.length === 0 ? (
            <p className={styles.emptyReviewText}>
              ยังไม่มีชิ้นงานใน Portfolio กดปุ่ม "+ เพิ่ม/แก้ไข" เพื่อเพิ่มผลงานชิ้นแรกของคุณ
            </p>
          ) : (
            portfolioItems.map((item) => (
              <div key={item.id} className={styles.featuredProject}>
                <div className={styles.projectLeft}>
                  <img
                    src={
                      item.imageUrl ||
                      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&auto=format&fit=crop&q=80'
                    }
                    alt={item.title}
                    className={styles.projectThumb}
                  />
                  <div className={styles.projectInfo}>
                    <h4 className={styles.projectTitle}>{item.title}</h4>
                    <p className={styles.projectDesc}>{item.description}</p>
                    <span className={styles.projectTag}>{item.tag}</span>
                  </div>
                </div>
                {showPortfolioEditor && (
                  <button
                    type="button"
                    className={styles.deleteSkillMini}
                    onClick={() => handleDeletePortfolioItem(item.id)}
                    title="ลบผลงานชิ้นนี้"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}

          <div className={styles.socialLinksGrid}>
            <div className={styles.socialLinkCard}>
              <div className={styles.socialIconCircle}>
                <Code size={15} color="var(--primary)" />
              </div>
              <div className={styles.socialTexts}>
                <span className={styles.socialName}>GitHub / Web</span>
                <span className={styles.socialHandle}>
                  {currentUser.portfolioLinks?.githubOrWebsite || 'ยังไม่ระบุ'}
                </span>
              </div>
            </div>

            <div className={styles.socialLinkCard}>
              <div className={styles.socialIconCircle}>
                <Palette size={15} color="var(--primary)" />
              </div>
              <div className={styles.socialTexts}>
                <span className={styles.socialName}>Dribbble / Design</span>
                <span className={styles.socialHandle}>
                  {currentUser.portfolioLinks?.dribbble || 'ยังไม่ระบุ'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Private Contacts Card */}
        <section className={styles.sectionCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleGroup}>
              <Lock size={17} color="var(--primary)" />
              <h2 className={styles.cardTitle}>ช่องทางติดต่อส่วนตัวของฉัน</h2>
            </div>
            <button
              type="button"
              className={styles.privateBadge}
              onClick={() => setShowRealContact((prev) => !prev)}
            >
              {showRealContact ? 'ซ่อนข้อมูล' : 'แสดงข้อมูลจริง'}
            </button>
          </div>

          <p className={styles.contactNotice}>
            ข้อมูลจะถูกเปิดเผยต่อเพื่อนคู่สนทนาโดยอัตโนมัติเฉพาะเมื่อคุณกดยืนยัน{' '}
            <span className={styles.purpleText}>"ยอมรับคำขอแลกเปลี่ยน"</span> เท่านั้น
          </p>

          <div className={styles.contactRows}>
            <div className={styles.contactRowItem}>
              <div className={styles.contactLeft}>
                <MessageSquare size={15} color="var(--primary)" />
                <span>LINE ID</span>
              </div>
              <span className={styles.contactMaskedVal}>
                {showRealContact
                  ? currentUser.contact.lineId
                  : maskLineId(currentUser.contact.lineId)}
              </span>
            </div>

            <div className={styles.contactRowItem}>
              <div className={styles.contactLeft}>
                <Phone size={15} color="var(--primary)" />
                <span>เบอร์โทรศัพท์</span>
              </div>
              <span className={styles.contactMaskedVal}>
                {showRealContact
                  ? currentUser.contact.phone
                  : maskPhone(currentUser.contact.phone)}
              </span>
            </div>

            {currentUser.contact.facebook && (
              <div className={styles.contactRowItem}>
                <div className={styles.contactLeft}>
                  <Globe size={15} color="var(--primary)" />
                  <span>Facebook</span>
                </div>
                <span className={styles.contactMaskedVal}>
                  {showRealContact ? currentUser.contact.facebook : '•••••• (ส่วนตัว)'}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Recent Reviews Card */}
        <section className={styles.sectionCard}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleGroup}>
              <MessageCircle size={17} color="var(--primary)" />
              <h2 className={styles.cardTitle}>รีวิวล่าสุดจากเพื่อนนักศึกษา</h2>
            </div>
            <span className={styles.seeAllReviews}>ทั้งหมด ({ratingStats.count})</span>
          </div>

          <div className={styles.reviewsList}>
            {ratingStats.reviews.length > 0 ? (
              ratingStats.reviews.map((rev) => (
                <div key={rev.id} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerInfo}>
                      <img
                        src={rev.reviewerAvatar}
                        alt={rev.reviewerName}
                        className={styles.reviewerAvatar}
                      />
                      <div>
                        <h4 className={styles.reviewerName}>{rev.reviewerName}</h4>
                        <p className={styles.reviewSkill}>
                          แลกเปลี่ยน: {rev.skillExchanged}
                        </p>
                      </div>
                    </div>
                    <div className={styles.reviewScorePill}>
                      <Star size={12} fill="var(--primary)" color="var(--primary)" />
                      <span>{rev.rate.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className={styles.reviewComment}>"{rev.comment}"</p>
                  <span className={styles.reviewTime}>{rev.timeAgo || 'เมื่อเร็วๆ นี้'}</span>
                </div>
              ))
            ) : (
              <p className={styles.emptyReviewText}>
                ยังไม่มีรีวิวสำหรับบัญชีนี้ เริ่มแลกเปลี่ยนทักษะเพื่อสะสมรีวิวแรกของคุณ!
              </p>
            )}
          </div>
        </section>

        {/* Export JSON Utility Button */}
        <button
          type="button"
          className={styles.exportJsonBtn}
          onClick={exportDatabaseJson}
        >
          <Download size={15} />
          <span>ดาวน์โหลดไฟล์ฐานข้อมูล JSON (use-database.json)</span>
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
