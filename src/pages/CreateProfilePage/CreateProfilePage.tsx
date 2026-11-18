import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreateProfilePage.module.css';
import {
  ArrowLeft,
  GraduationCap,
  User,
  ShieldCheck,
  Camera,
  IdCard,
  CloudUpload,
  Star,
  Plus,
  X,
  Folder,
  Link as LinkIcon,
  Lock,
  CheckCircle2,
  Phone,
  MessageSquare,
  Globe,
  Tag,
  Sparkles,
  Palette,
} from 'lucide-react';
import { useDatabase, inferSkillCategory } from '../../context/DatabaseContext';
import type { SkillItem } from '../../types/database';

const SUGGESTED_SKILLS = [
  'UX/UI Design',
  'Python Data',
  'สถิติวิจัย SPSS',
  'กีตาร์โปร่ง',
  'ติว TOEIC',
  'เขียนเว็บ React',
  'ตัดต่อวิดีโอ',
];

const WANTED_SUGGESTIONS = [
  'Python Data',
  'Data Science',
  'UX/UI Figma',
  '3D Blender',
  'ภาษาอังกฤษ IELTS',
  'สถิติวิจัย SPSS',
];

function compressImageFile(file: File, maxDim = 500, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const CreateProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useDatabase();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80'
  );
  const [studentCardName, setStudentCardName] = useState('');
  const [studentCardDataUrl, setStudentCardDataUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('3');

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<SkillItem[]>([
    { name: 'UX/UI Design (Figma)', level: 'Advanced', category: 'design' },
  ]);
  const [skillWanted, setSkillWanted] = useState('Python Data');

  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioDesc, setPortfolioDesc] = useState('');
  const [githubOrWebsite, setGithubOrWebsite] = useState('');
  const [googleDrive, setGoogleDrive] = useState('');
  const [dribbble, setDribbble] = useState('');

  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [facebook, setFacebook] = useState('');

  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSkill = (nameToAdd?: string) => {
    const raw = (nameToAdd ?? skillInput).trim();
    if (!raw) return;
    if (skills.some((s) => s.name.toLowerCase() === raw.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkills((prev) => [
      ...prev,
      { name: raw, level: 'Advanced', category: inferSkillCategory(raw) },
    ]);
    if (!nameToAdd) setSkillInput('');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleLevelChange = (index: number, newLevel: string) => {
    setSkills((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, level: newLevel } : item))
    );
  };

  const handleCategoryChange = (index: number, newCat: SkillItem['category']) => {
    setSkills((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, category: newCat } : item))
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 360, 0.8);
      setAvatarUrl(compressed);
    } catch {
      // ignore
    }
  };

  const handleCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudentCardName(file.name);
    try {
      const compressed = await compressImageFile(file, 700, 0.78);
      setStudentCardDataUrl(compressed);
    } catch {
      // ignore
    }
  };

  const filledCount = [
    email.trim() || studentCardDataUrl,
    fullName.trim(),
    university.trim(),
    faculty.trim(),
    major.trim(),
    skills.length > 0,
    phone.trim(),
    lineId.trim(),
  ].filter(Boolean).length;
  const completionPercent = Math.max(65, Math.min(100, Math.round((filledCount / 8) * 100)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!acceptedTerms) {
      setErrorMsg('กรุณาติ๊กยืนยันว่าเป็นนักศึกษาปัจจุบันและยอมรับกติกาการแลกเปลี่ยนทักษะ');
      return;
    }

    setIsSubmitting(true);
    const hasCustomPortfolio = Boolean(portfolioTitle.trim() || githubOrWebsite.trim());
    const result = await registerUser({
      name: fullName.trim(),
      nickname: nickname.trim() || fullName.trim().split(' ')[0],
      email: email.trim(),
      password: password || 'password123',
      role: 'student',
      university: university.trim() || 'จุฬาลงกรณ์มหาวิทยาลัย',
      faculty: faculty.trim(),
      major: major.trim() || 'ไม่ระบุสาขา',
      year: year || '3',
      picture: avatarUrl,
      studentCardImage: studentCardDataUrl || undefined,
      isVerified: true,
      responseTime: 'ตอบกลับไว',
      isAvailable: true,
      skills,
      skillWanted: skillWanted.trim() || 'Python Data',
      portfolioItems: hasCustomPortfolio
        ? [
            {
              id: `port-${Date.now()}`,
              title: portfolioTitle.trim() || 'Student Portfolio Showcase',
              description:
                portfolioDesc.trim() || `ผลงานแลกเปลี่ยนทักษะของ ${fullName.trim()}`,
              tag: skills[0]?.name || 'Portfolio',
              url: githubOrWebsite.trim() || undefined,
            },
          ]
        : [],
      portfolioLinks: {
        githubOrWebsite: githubOrWebsite.trim() || undefined,
        googleDrive: googleDrive.trim() || undefined,
        dribbble: dribbble.trim() || undefined,
      },
      contact: {
        phone: phone.trim(),
        email: email.trim(),
        lineId: lineId.trim(),
        facebook: facebook.trim() || undefined,
      },
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMsg(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    navigate('/profile');
  };

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/')}
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft size={18} />
          </button>
          <div className={styles.logoMiniBox}>
            <GraduationCap size={14} color="var(--primary)" />
            <span>USE</span>
          </div>
          <span className={styles.topTitle}>Skill Details</span>
        </div>

        <div className={styles.userCircle}>
          <User size={18} color="#ffffff" />
        </div>
      </header>

      <form className={styles.formContainer} onSubmit={handleSubmit}>
        {/* Step Progress Card */}
        <div className={styles.card}>
          <div className={styles.stepRow}>
            <div className={styles.stepLeft}>
              <span className={styles.purpleDot}></span>
              <span>ขั้นตอนที่ 2 จาก 2</span>
            </div>
            <span className={styles.stepPercent}>{completionPercent}% สมบูรณ์</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${completionPercent}%` }}
            ></div>
          </div>
          <p className={styles.stepDesc}>
            กรอกข้อมูลนักศึกษาให้ครบถ้วน เพื่อสร้างเครือข่ายแลกเปลี่ยนความรู้ที่ปลอดภัยและน่าเชื่อถือ
          </p>
        </div>

        {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

        {/* Section 1: Verification */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <ShieldCheck size={18} color="var(--primary)" />
            <h2 className={styles.sectionTitle}>ยืนยันตัวตนนักศึกษา (Verification)</h2>
          </div>

          <div className={styles.avatarUploader}>
            <div
              className={styles.avatarCircle}
              onClick={() => avatarInputRef.current?.click()}
            >
              <img src={avatarUrl} alt="Profile preview" className={styles.avatarImg} />
              <button
                type="button"
                className={styles.cameraBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  avatarInputRef.current?.click();
                }}
              >
                <Camera size={14} color="#fff" />
              </button>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
            <span className={styles.avatarCaption}>แตะเพื่ออัปโหลดรูปโปรไฟล์สุภาพ</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              บัตรนักศึกษา หรือ อีเมลมหาวิทยาลัย <span className={styles.req}>*</span>
            </label>

            <div
              className={styles.uploadBox}
              onClick={() => cardInputRef.current?.click()}
            >
              <div className={styles.uploadIconCircle}>
                <IdCard size={18} color="var(--primary)" />
              </div>
              <div className={styles.uploadTexts}>
                <span className={styles.uploadMainText}>
                  {studentCardName ? `อัปโหลดแล้ว: ${studentCardName}` : 'อัปโหลดภาพบัตร นศ.'}
                </span>
                <span className={styles.uploadSubText}>
                  JPG, PNG (ย่อขนาดอัตโนมัติเพื่อความรวดเร็ว)
                </span>
              </div>
              <CloudUpload size={18} color="var(--text-secondary)" />
              <input
                ref={cardInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCardUpload}
              />
            </div>

            {studentCardDataUrl && (
              <div className={styles.cardPreviewBox}>
                <img
                  src={studentCardDataUrl}
                  alt="Student card preview"
                  className={styles.cardPreviewImg}
                />
                <button
                  type="button"
                  className={styles.removePreviewBtn}
                  onClick={() => {
                    setStudentCardDataUrl('');
                    setStudentCardName('');
                  }}
                >
                  ลบภาพบัตร
                </button>
              </div>
            )}

            <div className={styles.inputWithIcon}>
              <input
                type="email"
                className={styles.input}
                placeholder="ชื่อคุณ@student.university.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <GraduationCap size={18} color="var(--primary)" />
            </div>

            <div className={styles.inputWithIcon}>
              <input
                type="password"
                className={styles.input}
                placeholder="รหัสผ่านสำหรับเข้าสู่ระบบ (ค่าเริ่มต้น: password123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={16} color="var(--text-muted)" />
            </div>
          </div>
        </section>

        {/* Section 2: Basic Student Info */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <User size={18} color="var(--primary)" />
            <h2 className={styles.sectionTitle}>ข้อมูลพื้นฐานนักศึกษา</h2>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              ชื่อ - นามสกุล <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              className={styles.textInput}
              placeholder="เช่น ณภัทร สุขสมบูรณ์"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className={styles.twoColRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>ชื่อเล่น (Nickname)</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="เช่น ภัทร"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>ชั้นปี (Year)</label>
              <select
                className={styles.selectInput}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="1">ชั้นปีที่ 1</option>
                <option value="2">ชั้นปีที่ 2</option>
                <option value="3">ชั้นปีที่ 3</option>
                <option value="4">ชั้นปีที่ 4</option>
                <option value="5">ชั้นปีที่ 5+</option>
              </select>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              สถาบัน / มหาวิทยาลัย <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              className={styles.textInput}
              placeholder="เช่น จุฬาลงกรณ์มหาวิทยาลัย, ม.เกษตรศาสตร์, ม.ศรีปทุม"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              คณะ (Faculty) <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              className={styles.textInput}
              placeholder="เช่น วิศวกรรมศาสตร์, เทคโนโลยีสารสนเทศ"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              สาขาวิชา (Major) <span className={styles.req}>*</span>
            </label>
            <input
              type="text"
              className={styles.textInput}
              placeholder="เช่น วิทยาการคอมพิวเตอร์"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              required
            />
          </div>
        </section>

        {/* Section 3: Skills & Skill Wanted */}
        <section className={styles.card}>
          <div className={styles.sectionHeaderBetween}>
            <div className={styles.sectionHeader}>
              <Star size={18} color="var(--primary)" />
              <h2 className={styles.sectionTitle}>ทักษะที่คุณพร้อมแบ่งปัน (Skills)</h2>
            </div>
            <span className={styles.skillCountBadge}>{skills.length} สกิล</span>
          </div>
          <p className={styles.sectionSub}>
            เลือกหรือพิมพ์ทักษะที่คุณสามารถสอนหรือแลกเปลี่ยนความรู้ (อย่างน้อย 1 รายการ)
          </p>

          <div className={styles.skillAddRow}>
            <input
              type="text"
              className={styles.skillTextInput}
              placeholder="พิมพ์ทักษะ เช่น สถิติวิจัย, Python, กีตาร์..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
            />
            <button
              type="button"
              className={styles.addSkillBtn}
              onClick={() => handleAddSkill()}
            >
              <Plus size={15} />
              <span>เพิ่ม</span>
            </button>
          </div>

          <div className={styles.suggestedChips}>
            {SUGGESTED_SKILLS.map((sug) => (
              <button
                key={sug}
                type="button"
                className={styles.sugChip}
                onClick={() => handleAddSkill(sug)}
              >
                + {sug}
              </button>
            ))}
          </div>

          <div className={styles.addedSkillsList}>
            {skills.map((sk, index) => (
              <div key={`${sk.name}-${index}`} className={styles.addedSkillItem}>
                <div className={styles.addedSkillLeft}>
                  <span className={styles.purpleDot}></span>
                  <span className={styles.addedSkillName}>{sk.name}</span>
                </div>
                <div className={styles.addedSkillRight}>
                  <select
                    className={styles.categorySelect}
                    value={sk.category || 'academic'}
                    onChange={(e) =>
                      handleCategoryChange(
                        index,
                        e.target.value as SkillItem['category']
                      )
                    }
                    title="หมวดหมู่ทักษะ"
                  >
                    <option value="coding">Coding</option>
                    <option value="design">Design</option>
                    <option value="language">Language</option>
                    <option value="music">Music/Media</option>
                    <option value="academic">Academic</option>
                  </select>
                  <select
                    className={styles.levelSelect}
                    value={sk.level}
                    onChange={(e) => handleLevelChange(index, e.target.value)}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Lv.3">Lv.3</option>
                    <option value="Lv.4">Lv.4</option>
                    <option value="Lv.5">Lv.5</option>
                  </select>
                  <button
                    type="button"
                    className={styles.removeSkillBtn}
                    onClick={() => handleRemoveSkill(index)}
                    aria-label="ลบทักษะ"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Skill Wanted for Smart Match */}
          <div className={styles.wantedSectionBox}>
            <div className={styles.sectionHeader}>
              <Sparkles size={16} color="var(--primary)" />
              <label className={styles.fieldLabel}>
                ทักษะที่คุณสนใจอยากแลกเปลี่ยน/เรียนรู้ (ใช้จับคู่ Smart Match)
              </label>
            </div>
            <input
              type="text"
              className={styles.textInput}
              placeholder="เช่น Python Data, 3D Blender, ภาษาอังกฤษ IELTS"
              value={skillWanted}
              onChange={(e) => setSkillWanted(e.target.value)}
            />
            <div className={styles.suggestedChips}>
              {WANTED_SUGGESTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`${styles.sugChip} ${
                    skillWanted === w ? styles.sugChipActive : ''
                  }`}
                  onClick={() => setSkillWanted(w)}
                >
                  🎯 {w}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Portfolio / Social Proof */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <Folder size={18} color="var(--primary)" />
            <h2 className={styles.sectionTitle}>ผลงานและลิงก์ (Portfolio / Social Proof)</h2>
          </div>
          <p className={styles.sectionSub}>เพิ่มความน่าเชื่อถือด้วยผลงานจริง (ไม่บังคับ)</p>

          <div className={styles.fieldGroup}>
            <input
              type="text"
              className={styles.textInput}
              placeholder="ชื่อโปรเจกต์/ผลงานเด่น เช่น ระบบเว็บแลกเปลี่ยนทักษะ"
              value={portfolioTitle}
              onChange={(e) => setPortfolioTitle(e.target.value)}
            />
          </div>

          {portfolioTitle.trim() && (
            <div className={styles.fieldGroup}>
              <input
                type="text"
                className={styles.textInput}
                placeholder="คำอธิบายสั้นๆ เกี่ยวกับผลงานของคุณ"
                value={portfolioDesc}
                onChange={(e) => setPortfolioDesc(e.target.value)}
              />
            </div>
          )}

          <div className={styles.iconInputRow}>
            <div className={styles.leftIconCircle}>
              <LinkIcon size={15} color="var(--primary)" />
            </div>
            <input
              type="text"
              className={styles.iconRowInput}
              placeholder="GitHub, Behance, Notion หรือ Website"
              value={githubOrWebsite}
              onChange={(e) => setGithubOrWebsite(e.target.value)}
            />
          </div>

          <div className={styles.iconInputRow}>
            <div className={styles.leftIconCircle}>
              <Palette size={15} color="var(--primary)" />
            </div>
            <input
              type="text"
              className={styles.iconRowInput}
              placeholder="Dribbble หรือพอร์ตงานดีไซน์ (ถ้ามี)"
              value={dribbble}
              onChange={(e) => setDribbble(e.target.value)}
            />
          </div>

          <div className={styles.iconInputRow}>
            <div className={styles.leftIconCircle}>
              <LinkIcon size={15} color="var(--primary)" />
            </div>
            <input
              type="text"
              className={styles.iconRowInput}
              placeholder="Google Drive Link แฟ้มสะสมงาน (ถ้ามี)"
              value={googleDrive}
              onChange={(e) => setGoogleDrive(e.target.value)}
            />
          </div>
        </section>

        {/* Section 5: Private Contacts */}
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <Lock size={18} color="var(--primary)" />
            <h2 className={styles.sectionTitle}>ช่องทางติดต่อ (Private Contacts)</h2>
          </div>
          <p className={styles.sectionSub}>ใช้สำหรับการนัดหมายเมื่อจับคู่สำเร็จ</p>

          <div className={styles.privacyBanner}>
            <CheckCircle2 size={16} color="var(--primary)" className={styles.privacyIcon} />
            <p className={styles.privacyText}>
              🔒 <strong>Privacy Guaranteed:</strong> ข้อมูลติดต่อส่วนบุคคลทั้งหมดจะถูกปกปิดเป็นความลับ
              และจะเปิดเผยให้อีกฝ่ายเห็นเมื่อมีการ{' '}
              <span className={styles.highlightLink}>ยอมรับคำขอ (Accepted)</span> แลกเปลี่ยนทักษะเท่านั้น
            </p>
          </div>

          <div className={styles.iconInputRow}>
            <div className={styles.leftIconCircle}>
              <Phone size={15} color="#374151" />
            </div>
            <input
              type="tel"
              className={styles.iconRowInput}
              placeholder="เบอร์โทรศัพท์ (บังคับ)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className={styles.iconInputRow}>
            <div className={styles.leftIconCircle}>
              <MessageSquare size={15} color="#374151" />
            </div>
            <input
              type="text"
              className={styles.iconRowInput}
              placeholder="LINE ID (บังคับ)"
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              required
            />
          </div>

          <div className={styles.iconInputRow}>
            <div className={styles.leftIconCircle}>
              <Globe size={15} color="#374151" />
            </div>
            <input
              type="text"
              className={styles.iconRowInput}
              placeholder="Facebook Profile / Messenger"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
            />
          </div>
        </section>

        {/* Terms Confirmation */}
        <label className={styles.termsRow}>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className={styles.checkbox}
          />
          <span>
            ข้าพเจ้ายืนยันว่าเป็นนักศึกษาปัจจุบัน และยอมรับกติกาการแลกเปลี่ยนทักษะอย่างสร้างสรรค์
          </span>
        </label>

        {/* Submit Button */}
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          <Tag size={18} />
          <span>
            {isSubmitting
              ? 'กำลังบันทึกข้อมูลลง JSON...'
              : 'บันทึกและเริ่มต้นแลกเปลี่ยนทักษะ (Complete Profile)'}
          </span>
        </button>
      </form>
    </div>
  );
};

export default CreateProfilePage;
