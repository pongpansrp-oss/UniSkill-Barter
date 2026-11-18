import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import initialDbData from '../data/db.json';
import demoSeedData from '../data/demoSeed.json';
import type {
  DatabaseSchema,
  User,
  Review,
  HelpRequest,
  RequestStatus,
  SkillItem,
} from '../types/database';

const LOCAL_STORAGE_DB_KEY = 'use_json_database_v3';
const LOCAL_STORAGE_SESSION_KEY = 'use_auth_session_v3';
const LOCAL_STORAGE_REMEMBER_EMAIL_KEY = 'use_remembered_email_v3';
const LOCAL_STORAGE_FAV_KEY = 'use_favorite_users_v3';

// Base rating stats from screenshots so initial display matches the UI mockups
// while dynamically recalculating when new reviews are added!
const BASE_RATING_STATS: Record<string, { baseCount: number; baseTotalScore: number }> = {
  'u-kawin': { baseCount: 32, baseTotalScore: 32 * 4.95 },
  'u-phawita': { baseCount: 41, baseTotalScore: 41 * 4.98 },
  'u-teeraphat': { baseCount: 28, baseTotalScore: 28 * 4.92 },
  'u-alisa': { baseCount: 34, baseTotalScore: 34 * 4.88 },
  'u-warinthon': { baseCount: 31, baseTotalScore: 31 * 4.90 },
  'u-pachara': { baseCount: 26, baseTotalScore: 26 * 4.95 },
};

interface SessionState {
  userId: string | null;
  isGuest: boolean;
}

export interface MatchScoreResult {
  percent: number;
  mySkillToTeach: string;
  theirSkillToTeach: string;
  isDirectMatch: boolean;
}

export function inferSkillCategory(skillName: string): SkillItem['category'] {
  const s = skillName.toLowerCase();
  if (
    s.includes('python') ||
    s.includes('code') ||
    s.includes('coding') ||
    s.includes('web') ||
    s.includes('node') ||
    s.includes('data') ||
    s.includes('sql') ||
    s.includes('react') ||
    s.includes('java') ||
    s.includes('js') ||
    s.includes('html') ||
    s.includes('css') ||
    s.includes('ai') ||
    s.includes('ml') ||
    s.includes('เขียนเว็บ') ||
    s.includes('เว็บไซต์') ||
    s.includes('โปรแกรม') ||
    s.includes('โค้ด') ||
    s.includes('แอป') ||
    s.includes('ฐานข้อมูล')
  ) {
    return 'coding';
  }
  if (
    s.includes('ux') ||
    s.includes('ui') ||
    s.includes('figma') ||
    s.includes('3d') ||
    s.includes('design') ||
    s.includes('blender') ||
    s.includes('sketchup') ||
    s.includes('render') ||
    s.includes('art') ||
    s.includes('กราฟิก') ||
    s.includes('ออกแบบ') ||
    s.includes('วาด') ||
    s.includes('โมเดล')
  ) {
    return 'design';
  }
  if (
    s.includes('toeic') ||
    s.includes('ielts') ||
    s.includes('ภาษา') ||
    s.includes('อังกฤษ') ||
    s.includes('ญี่ปุ่น') ||
    s.includes('จีน') ||
    s.includes('เกาหลี') ||
    s.includes('แปล') ||
    s.includes('english') ||
    s.includes('japanese') ||
    s.includes('n1') ||
    s.includes('n2') ||
    s.includes('n3') ||
    s.includes('n4') ||
    s.includes('n5')
  ) {
    return 'language';
  }
  if (
    s.includes('กีตาร์') ||
    s.includes('ดนตรี') ||
    s.includes('เพลง') ||
    s.includes('ตัดต่อ') ||
    s.includes('วิดีโอ') ||
    s.includes('เปียโน') ||
    s.includes('ร้องเพลง') ||
    s.includes('กลอง') ||
    s.includes('ถ่ายภาพ') ||
    s.includes('กล้อง') ||
    s.includes('premiere') ||
    s.includes('capcut') ||
    s.includes('music') ||
    s.includes('video')
  ) {
    return 'music';
  }
  return 'academic';
}

function getLevelTitleFromXp(xp: number): string {
  if (xp >= 1800) return 'Lv.5 Master Mentor';
  if (xp >= 1200) return 'Lv.4 Peer Mentor';
  if (xp >= 800) return 'Lv.3 Active Sharer';
  if (xp >= 600) return 'Lv.2 Skill Explorer';
  return 'Lv.1 Newcomer Peer';
}

interface DatabaseContextType {
  db: DatabaseSchema;
  currentUser: User | null;
  isGuest: boolean;
  isLoading: boolean;
  favoriteUserIds: string[];
  toggleFavoriteUser: (targetUserId: string) => void;
  rememberedEmail: string;
  login: (
    email: string,
    password?: string,
    rememberMe?: boolean
  ) => { ok: boolean; message?: string; user?: User };
  resetPassword: (params: {
    email: string;
    verifyIdentity: string;
    newPassword: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  loginAsGuest: () => void;
  logout: () => void;
  registerUser: (
    userData: Omit<User, 'id' | 'createdAt' | 'reportCount' | 'isSuspended' | 'xp' | 'levelTitle' | 'exchangeCount'>
  ) => Promise<{ ok: boolean; message?: string; user?: User }>;
  updateCurrentUser: (updates: Partial<User>) => Promise<void>;
  createRequest: (
    reqData: Omit<HelpRequest, 'id' | 'createdAt' | 'status' | 'requesterId' | 'requesterName' | 'requesterInitials' | 'requesterFaculty' | 'requesterAvatar'>
  ) => Promise<{ ok: boolean; message?: string }>;
  updateRequestStatus: (requestId: string, status: RequestStatus) => Promise<{ ok: boolean; message?: string }>;
  deleteRequest: (requestId: string) => Promise<{ ok: boolean; message?: string }>;
  renewRequest: (requestId: string) => Promise<{ ok: boolean; message?: string }>;
  offerHelpOnRequest: (requestId: string) => Promise<{ ok: boolean; message?: string }>;
  addReview: (params: {
    requestId?: string;
    targetUserId: string;
    rate: number;
    comment: string;
    skillExchanged: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  deleteReviewByAdmin: (reviewId: string) => Promise<{ ok: boolean; message?: string }>;
  reportUser: (params: {
    targetUserId: string;
    reason: string;
    detail: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  resolveReportByAdmin: (reportId: string) => Promise<{ ok: boolean; message?: string }>;
  toggleSuspendUserByAdmin: (userId: string) => Promise<void>;
  toggleVerifyUserByAdmin: (userId: string) => Promise<{ ok: boolean; message?: string }>;
  cycleUserBadgeByAdmin: (userId: string) => Promise<{ ok: boolean; message?: string }>;
  adjustUserXpByAdmin: (userId: string, deltaXp: number) => Promise<{ ok: boolean; message?: string }>;
  deleteUserByAdmin: (userId: string) => Promise<{ ok: boolean; message?: string }>;
  updateAnnouncementByAdmin: (text: string, active: boolean) => Promise<{ ok: boolean; message?: string }>;
  clearAllDataByAdmin: () => Promise<{ ok: boolean; message?: string }>;
  restoreDemoDataByAdmin: () => Promise<{ ok: boolean; message?: string }>;
  getUserById: (userId: string) => User | undefined;
  getUserRatingStats: (userId: string) => { average: number; count: number; reviews: Review[] };
  canViewPrivateContact: (targetUserId: string) => boolean;
  isProfileComplete: (user: User | null) => boolean;
  calculateMatchScore: (otherUser: User) => MatchScoreResult;
  exportDatabaseJson: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

const DEFAULT_ADMIN_USER: User = {
  id: 'u-admin',
  name: 'ผู้ดูแลระบบ (Admin USE)',
  nickname: 'Admin',
  email: 'admin@spumail.net',
  password: '123456',
  role: 'admin',
  university: 'มหาวิทยาลัยศรีปทุม',
  faculty: 'ฝ่ายกิจการนักศึกษา',
  major: 'ระบบดูแลความปลอดภัย',
  year: '4',
  picture:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  isVerified: true,
  verifiedDomain: '@spumail.net',
  badgeText: 'Admin',
  badgeType: 'verified',
  xp: 9999,
  levelTitle: 'System Admin',
  exchangeCount: 0,
  responseTime: 'ตลอด 24 ชม.',
  isAvailable: true,
  skills: [{ name: 'Community Management', level: 'Lv.5', category: 'academic' }],
  portfolioItems: [],
  portfolioLinks: {},
  contact: {
    phone: '02-579-1111',
    email: 'admin@spumail.net',
    lineId: '@use_admin',
  },
  reportCount: 0,
  isSuspended: false,
  createdAt: '2026-11-10T10:00:00.000Z',
};

function normalizeDatabaseSchema(raw: Partial<DatabaseSchema> | null | undefined): DatabaseSchema {
  const users = Array.isArray(raw?.users) ? [...raw.users] : [];
  if (!users.some((u) => u.role === 'admin')) {
    users.push(DEFAULT_ADMIN_USER);
  }
  return {
    users,
    reviews: Array.isArray(raw?.reviews) ? raw.reviews : [],
    requests: Array.isArray(raw?.requests) ? raw.requests : [],
    reports: Array.isArray(raw?.reports) ? raw.reports : [],
    announcement: raw?.announcement,
  };
}

function applyRequestExpirationRules(rawDb: DatabaseSchema): { db: DatabaseSchema; changed: boolean } {
  const db = normalizeDatabaseSchema(rawDb);
  const now = new Date();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  let changed = false;

  const updatedRequests = db.requests.map((req) => {
    if (req.status !== 'Pending') return req;

    const createdDate = new Date(req.createdAt);
    const isOlderThan3Days = now.getTime() - createdDate.getTime() > threeDaysMs;

    let isPastMeetingDate = false;
    if (req.date) {
      const meetingEndOfDay = new Date(`${req.date}T23:59:59`);
      if (!isNaN(meetingEndOfDay.getTime()) && now > meetingEndOfDay) {
        isPastMeetingDate = true;
      }
    }

    // If a request has a valid future meeting date and is one of the active university board items,
    // only expire it if it's past the meeting date OR if createdAt is older than 3 days and no future meeting date is within 7 days.
    const hasUpcomingMeeting =
      req.date && !isPastMeetingDate && new Date(`${req.date}T23:59:59`).getTime() - now.getTime() <= 14 * 24 * 60 * 60 * 1000;

    if (isPastMeetingDate || (isOlderThan3Days && !hasUpcomingMeeting)) {
      changed = true;
      return { ...req, status: 'Expired' as RequestStatus };
    }
    return req;
  });

  // Also ensure skill categories are properly inferred if any skill was saved with wrong category
  const updatedUsers = db.users.map((u) => {
    let userChanged = false;
    const fixedSkills = (u.skills || []).map((sk) => {
      const inferred = inferSkillCategory(sk.name);
      if (sk.name === 'เขียนเว็บ' && sk.category !== 'coding') {
        userChanged = true;
        return { ...sk, category: inferred };
      }
      if (!sk.category) {
        userChanged = true;
        return { ...sk, category: inferred };
      }
      return sk;
    });
    if (userChanged) {
      changed = true;
      return { ...u, skills: fixedSkills };
    }
    return u;
  });

  return {
    db: changed ? { ...db, requests: updatedRequests, users: updatedUsers } : db,
    changed,
  };
}

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<DatabaseSchema>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      if (cached) {
        return normalizeDatabaseSchema(JSON.parse(cached) as DatabaseSchema);
      }
    } catch {
      // ignore parse errors
    }
    return normalizeDatabaseSchema(initialDbData as unknown as DatabaseSchema);
  });

  const [session, setSession] = useState<SessionState>(() => {
    try {
      const savedSession = sessionStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (savedSession) {
        return JSON.parse(savedSession) as SessionState;
      }
      const savedLocal = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (savedLocal) {
        return JSON.parse(savedLocal) as SessionState;
      }
    } catch {
      // ignore
    }
    return { userId: null, isGuest: false };
  });

  const [rememberedEmail, setRememberedEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_REMEMBER_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });

  const [favoriteUserIds, setFavoriteUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FAV_KEY);
      if (saved) {
        return JSON.parse(saved) as string[];
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const toggleFavoriteUser = useCallback((targetUserId: string) => {
    setFavoriteUserIds((prev) => {
      const next = prev.includes(targetUserId)
        ? prev.filter((id) => id !== targetUserId)
        : [...prev, targetUserId];
      try {
        localStorage.setItem(LOCAL_STORAGE_FAV_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const getLatestDb = useCallback(async (): Promise<DatabaseSchema> => {
    try {
      const res = await fetch('/api/db', { cache: 'no-store' });
      if (res.ok) {
        const serverDb = (await res.json()) as DatabaseSchema;
        return normalizeDatabaseSchema(serverDb);
      }
    } catch {
      // fallback to in-memory state
    }
    return db;
  }, [db]);

  const persistDb = useCallback(async (nextDb: DatabaseSchema) => {
    setDb(nextDb);
    try {
      localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(nextDb));
    } catch {
      // ignore storage quota errors
    }
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextDb),
      });
    } catch {
      // fallback to localStorage when offline or static preview
    }
  }, []);

  // Load real JSON from /api/db on startup and keep synced across tabs/windows/accounts
  useEffect(() => {
    let mounted = true;
    async function fetchDb(isInitial = false) {
      try {
        const res = await fetch('/api/db', { cache: 'no-store' });
        if (res.ok) {
          const serverDb = (await res.json()) as DatabaseSchema;
          const { db: checkedDb, changed } = applyRequestExpirationRules(serverDb);
          if (mounted) {
            setDb((prev) => {
              const prevJson = JSON.stringify(prev);
              const nextJson = JSON.stringify(checkedDb);
              return prevJson === nextJson ? prev : checkedDb;
            });
            try {
              localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(checkedDb));
            } catch {
              // ignore quota error
            }
          }
          if (changed) {
            await fetch('/api/db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(checkedDb),
            });
          }
        }
      } catch {
        // Fallback to local state if static
        if (mounted && isInitial) {
          setDb((prev) => applyRequestExpirationRules(prev).db);
        }
      } finally {
        if (mounted && isInitial) setIsLoading(false);
      }
    }

    fetchDb(true);

    // Poll every 1.5s and sync on window focus / localStorage events so requests sent between 2 accounts appear immediately
    const intervalId = window.setInterval(() => {
      fetchDb(false);
    }, 1500);

    const handleFocus = () => {
      fetchDb(false);
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_DB_KEY && e.newValue) {
        try {
          const parsed = normalizeDatabaseSchema(JSON.parse(e.newValue) as DatabaseSchema);
          if (mounted) setDb(parsed);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateSession = (nextSession: SessionState, persistLocal = true) => {
    setSession(nextSession);
    try {
      sessionStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(nextSession));
      if (persistLocal) {
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(nextSession));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }
    } catch {
      // ignore
    }
  };

  const currentUser = session.userId
    ? db.users.find((u) => u.id === session.userId) || null
    : null;

  const isProfileComplete = useCallback((user: User | null): boolean => {
    if (!user) return false;
    const hasName = Boolean(user.name && user.name.trim().length > 0);
    const hasFaculty = Boolean(user.faculty && user.faculty.trim().length > 0);
    const hasSkill = Boolean(user.skills && user.skills.length >= 1);
    const hasContact = Boolean(
      (user.contact?.phone && user.contact.phone.trim().length > 0) ||
        (user.contact?.lineId && user.contact.lineId.trim().length > 0)
    );
    return hasName && hasFaculty && hasSkill && hasContact;
  }, []);

  const login: DatabaseContextType['login'] = (email, password, rememberMe = true) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, message: 'กรุณากรอกอีเมลมหาวิทยาลัย' };
    }
    if (!password || !password.trim()) {
      return { ok: false, message: 'กรุณากรอกรหัสผ่านของคุณ' };
    }

    const isAdminAlias =
      cleanEmail === 'admin@spumail.net' || cleanEmail === 'admin@student.university.ac.th';
    const found = db.users.find(
      (u) => u.email.toLowerCase() === cleanEmail || (isAdminAlias && u.role === 'admin')
    );
    if (!found) {
      return {
        ok: false,
        message: 'ไม่พบบัญชีอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่',
      };
    }

    const expectedPassword = found.password || '123456';
    const isPasswordValid =
      expectedPassword === password ||
      (found.role === 'admin' && (password === '123456' || password === 'admin123'));
    if (!isPasswordValid) {
      return { ok: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    if (found.isSuspended) {
      return {
        ok: false,
        message:
          'บัญชีของคุณถูกระงับชั่วคราวเนื่องจากถูกรายงานเกิน 3 ครั้ง กรุณารอผู้ดูแลระบบ (Admin) ตรวจสอบ',
      };
    }

    try {
      if (rememberMe) {
        localStorage.setItem(LOCAL_STORAGE_REMEMBER_EMAIL_KEY, found.email);
        setRememberedEmail(found.email);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_REMEMBER_EMAIL_KEY);
        setRememberedEmail('');
      }
    } catch {
      // ignore
    }

    updateSession({ userId: found.id, isGuest: false }, rememberMe);
    return { ok: true, user: found };
  };

  const resetPassword: DatabaseContextType['resetPassword'] = async ({
    email,
    verifyIdentity,
    newPassword,
  }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanVerify = verifyIdentity.trim().toLowerCase();
    const cleanVerifyDigits = verifyIdentity.replace(/\D/g, '');

    if (!cleanEmail) {
      return { ok: false, message: 'กรุณากรอกอีเมลที่ลงทะเบียนไว้' };
    }
    const latestDb = await getLatestDb();
    const found = latestDb.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      return { ok: false, message: 'ไม่พบอีเมลนี้ในระบบฐานข้อมูล' };
    }

    if (!cleanVerify) {
      return { ok: false, message: 'กรุณากรอกเบอร์โทรศัพท์ หรือ LINE ID เพื่อยืนยันตัวตน' };
    }

    const userPhoneDigits = (found.contact?.phone || '').replace(/\D/g, '');
    const userLine = (found.contact?.lineId || '').trim().toLowerCase();
    const userName = (found.name || '').trim().toLowerCase();

    const phoneMatched =
      cleanVerifyDigits.length >= 4 &&
      userPhoneDigits.length >= 4 &&
      (userPhoneDigits === cleanVerifyDigits || userPhoneDigits.endsWith(cleanVerifyDigits));
    const lineMatched = Boolean(userLine && userLine === cleanVerify);
    const nameMatched = Boolean(userName && userName === cleanVerify);

    if (!phoneMatched && !lineMatched && !nameMatched) {
      return {
        ok: false,
        message:
          'ข้อมูลยืนยันตัวตนไม่ตรงกับที่ลงทะเบียนไว้ (กรุณาระบุเบอร์โทรศัพท์, เลขท้าย 4 ตัว หรือ LINE ID ที่ผูกกับบัญชีนี้)',
      };
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return { ok: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
    }

    const updatedUsers = latestDb.users.map((u) =>
      u.id === found.id ? { ...u, password: newPassword.trim() } : u
    );
    await persistDb({ ...latestDb, users: updatedUsers });
    return {
      ok: true,
      message: `ตั้งรหัสผ่านใหม่สำหรับบัญชี ${found.email} สำเร็จแล้ว! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่`,
    };
  };

  const loginAsGuest = () => {
    updateSession({ userId: null, isGuest: true }, false);
  };

  const logout = () => {
    updateSession({ userId: null, isGuest: false }, false);
    try {
      sessionStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    } catch {
      // ignore
    }
  };

  const registerUser: DatabaseContextType['registerUser'] = async (userData) => {
    const cleanEmail = userData.email.trim().toLowerCase();
    if (!cleanEmail) {
      return { ok: false, message: 'กรุณาระบุอีเมลมหาวิทยาลัย' };
    }

    // Condition: นักศึกษาต้องใช้อีเมลมหาวิทยาลัย (.ac.th / .edu / .th / mail) หรืออัปโหลดบัตรนักศึกษา
    const isUniEmail =
      cleanEmail.endsWith('.ac.th') ||
      cleanEmail.endsWith('.edu') ||
      cleanEmail.endsWith('.ku.th') ||
      cleanEmail.endsWith('spumail.net') ||
      cleanEmail.includes('university') ||
      cleanEmail.includes('.ac.');
    if (!isUniEmail && !userData.studentCardImage) {
      return {
        ok: false,
        message:
          'ต้องใช้อีเมลของมหาวิทยาลัย (เช่น @student.university.ac.th) หรืออัปโหลดภาพบัตรนักศึกษาเพื่อยืนยันตัวตน',
      };
    }

    const latestDb = await getLatestDb();
    if (latestDb.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { ok: false, message: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ' };
    }

    if (!userData.name.trim() || !userData.faculty.trim()) {
      return { ok: false, message: 'กรุณากรอกชื่อ-นามสกุล และคณะให้ครบถ้วน' };
    }

    if (!userData.skills || userData.skills.length === 0) {
      return { ok: false, message: 'กรุณาเพิ่มทักษะที่คุณพร้อมแบ่งปันอย่างน้อย 1 ทักษะ' };
    }

    if (!userData.contact.phone.trim() || !userData.contact.lineId.trim()) {
      return { ok: false, message: 'กรุณากรอกเบอร์โทรศัพท์และ LINE ID สำหรับติดต่อเมื่อจับคู่สำเร็จ' };
    }

    const domainPart = cleanEmail.includes('@') ? `@${cleanEmail.split('@')[1]}` : '@student.university.ac.th';

    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
      email: cleanEmail,
      verifiedDomain: domainPart,
      isVerified: true,
      badgeText: 'Verified',
      badgeType: 'verified',
      xp: 500,
      levelTitle: 'Lv.1 Newcomer Peer',
      exchangeCount: 0,
      responseTime: 'ตอบกลับไว',
      reportCount: 0,
      isSuspended: false,
      createdAt: new Date().toISOString(),
    };

    const nextDb: DatabaseSchema = {
      ...latestDb,
      users: [newUser, ...latestDb.users],
    };

    await persistDb(nextDb);
    updateSession({ userId: newUser.id, isGuest: false });
    return { ok: true, user: newUser };
  };

  const updateCurrentUser = async (updates: Partial<User>) => {
    if (!currentUser) return;
    const latestDb = await getLatestDb();
    const nextUsers = latestDb.users.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u));
    await persistDb({ ...latestDb, users: nextUsers });
  };

  const createRequest: DatabaseContextType['createRequest'] = async (reqData) => {
    if (session.isGuest || !currentUser) {
      return {
        ok: false,
        message: 'ผู้ใช้งานแบบ Guest ไม่สามารถส่งคำขอความช่วยเหลือได้ กรุณาเข้าสู่ระบบนักศึกษา',
      };
    }

    if (currentUser.isSuspended) {
      return {
        ok: false,
        message: 'บัญชีของคุณถูกระงับชั่วคราว ไม่สามารถสร้างคำขอได้',
      };
    }

    if (!isProfileComplete(currentUser)) {
      return {
        ok: false,
        message:
          'กรุณากรอกข้อมูลบังคับในโปรไฟล์ให้ครบ (ชื่อ, คณะ, ทักษะอย่างน้อย 1 อย่าง และช่องทางติดต่อ) ก่อนส่งคำขอ',
      };
    }

    if (reqData.targetUserId && reqData.targetUserId === currentUser.id) {
      return {
        ok: false,
        message: 'ไม่สามารถส่งคำขอความช่วยเหลือให้ตัวเองได้',
      };
    }

    const latestDb = await getLatestDb();
    const targetUserObj = reqData.targetUserId
      ? latestDb.users.find((u) => u.id === reqData.targetUserId)
      : undefined;

    const initials = currentUser.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newReq: HelpRequest = {
      ...reqData,
      targetUserId: reqData.targetUserId || undefined,
      targetUserName: reqData.targetUserName || targetUserObj?.name,
      targetUserAvatar: reqData.targetUserAvatar || targetUserObj?.picture,
      id: `req-${Date.now()}`,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterInitials: initials || 'US',
      requesterFaculty: currentUser.faculty,
      requesterAvatar: currentUser.picture,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      reviewedByRequester: false,
      reviewedByTarget: false,
    };

    const nextDb: DatabaseSchema = {
      ...latestDb,
      requests: [newReq, ...latestDb.requests],
    };

    await persistDb(nextDb);
    return { ok: true };
  };

  const updateRequestStatus: DatabaseContextType['updateRequestStatus'] = async (requestId, status) => {
    if (!currentUser || session.isGuest) {
      return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    const latestDb = await getLatestDb();
    const targetReq = latestDb.requests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { ok: false, message: 'ไม่พบคำขอนี้ในระบบ' };
    }

    const isParticipant =
      targetReq.requesterId === currentUser.id ||
      targetReq.targetUserId === currentUser.id ||
      currentUser.role === 'admin';

    if (!isParticipant) {
      return { ok: false, message: 'คุณไม่มีสิทธิ์เปลี่ยนสถานะคำขอนี้' };
    }

    const nextRequests = latestDb.requests.map((r) => (r.id === requestId ? { ...r, status } : r));

    let nextUsers = latestDb.users;
    if (status === 'Completed' && targetReq.status !== 'Completed') {
      nextUsers = latestDb.users.map((u) => {
        if (u.id === targetReq.requesterId || u.id === targetReq.targetUserId) {
          const nextXp = (u.xp || 0) + 80;
          return {
            ...u,
            exchangeCount: (u.exchangeCount || 0) + 1,
            xp: nextXp,
            levelTitle: u.role === 'admin' ? u.levelTitle : getLevelTitleFromXp(nextXp),
          };
        }
        return u;
      });
    }

    await persistDb({
      ...latestDb,
      requests: nextRequests,
      users: nextUsers,
    });
    return { ok: true };
  };

  const deleteRequest: DatabaseContextType['deleteRequest'] = async (requestId) => {
    if (!currentUser || session.isGuest) {
      return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }
    const latestDb = await getLatestDb();
    const targetReq = latestDb.requests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { ok: false, message: 'ไม่พบคำขอนี้ในระบบ' };
    }
    if (targetReq.requesterId !== currentUser.id && currentUser.role !== 'admin') {
      return { ok: false, message: 'สามารถยกเลิกได้เฉพาะคำขอที่คุณเป็นผู้สร้างเท่านั้น' };
    }
    const nextRequests = latestDb.requests.filter((r) => r.id !== requestId);
    await persistDb({ ...latestDb, requests: nextRequests });
    return { ok: true, message: 'ยกเลิกและลบคำขอเรียบร้อยแล้ว' };
  };

  const renewRequest: DatabaseContextType['renewRequest'] = async (requestId) => {
    if (!currentUser || session.isGuest) {
      return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }
    const latestDb = await getLatestDb();
    const targetReq = latestDb.requests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { ok: false, message: 'ไม่พบคำขอนี้ในระบบ' };
    }
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextRequests = latestDb.requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'Pending' as RequestStatus,
            createdAt: new Date().toISOString(),
            date: r.date < new Date().toISOString().split('T')[0] ? futureDate : r.date,
          }
        : r
    );
    await persistDb({ ...latestDb, requests: nextRequests });
    return { ok: true, message: 'ต่ออายุคำขอเป็นสถานะ Pending (+7 วัน) เรียบร้อยแล้ว' };
  };

  const offerHelpOnRequest: DatabaseContextType['offerHelpOnRequest'] = async (requestId) => {
    if (session.isGuest || !currentUser) {
      return {
        ok: false,
        message: 'ผู้ใช้งานแบบ Guest ไม่สามารถเสนอตัวช่วยได้ กรุณาเข้าสู่ระบบนักศึกษา',
      };
    }

    if (currentUser.isSuspended) {
      return {
        ok: false,
        message: 'บัญชีของคุณถูกระงับชั่วคราว ไม่สามารถตอบรับคำขอได้',
      };
    }

    if (!isProfileComplete(currentUser)) {
      return {
        ok: false,
        message: 'กรุณากรอกข้อมูลโปรไฟล์ (ชื่อ, คณะ, ทักษะ, ช่องทางติดต่อ) ให้ครบก่อนเสนอตัวช่วย',
      };
    }

    const latestDb = await getLatestDb();
    const req = latestDb.requests.find((r) => r.id === requestId);
    if (!req) return { ok: false, message: 'ไม่พบคำขอนี้' };

    if (req.requesterId === currentUser.id) {
      return { ok: false, message: 'คุณเป็นเจ้าของคำขอนี้เอง ไม่สามารถกดรับคำขอตัวเองได้' };
    }

    if (req.targetUserId && req.targetUserId !== currentUser.id) {
      return { ok: false, message: 'คำขอนี้ถูกส่งเฉพาะเจาะจงถึงนักศึกษาคนอื่น' };
    }

    const nextRequests = latestDb.requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            targetUserId: currentUser.id,
            targetUserName: currentUser.name,
            targetUserAvatar: currentUser.picture,
            status: 'Accepted' as RequestStatus,
          }
        : r
    );

    await persistDb({ ...latestDb, requests: nextRequests });
    return { ok: true };
  };

  const addReview: DatabaseContextType['addReview'] = async ({
    requestId,
    targetUserId,
    rate,
    comment,
    skillExchanged,
  }) => {
    if (!currentUser || session.isGuest) {
      return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อนเขียนรีวิว' };
    }

    if (currentUser.id === targetUserId) {
      return { ok: false, message: 'ระบบไม่อนุญาตให้ผู้ใช้รีวิวตัวเอง' };
    }

    const latestDb = await getLatestDb();

    // Check completed request condition between currentUser and targetUserId
    const matchingCompletedRequests = latestDb.requests.filter(
      (r) =>
        (requestId ? r.id === requestId : true) &&
        r.status === 'Completed' &&
        ((r.requesterId === currentUser.id && r.targetUserId === targetUserId) ||
          (r.targetUserId === currentUser.id && r.requesterId === targetUserId))
    );

    if (matchingCompletedRequests.length === 0) {
      return {
        ok: false,
        message:
          'สามารถให้คะแนนและเขียนรีวิวได้เฉพาะเมื่อคำขอแลกเปลี่ยนทักษะเปลี่ยนสถานะเป็น Completed (เสร็จสิ้น) แล้วเท่านั้น',
      };
    }

    // Find an unreviewed completed request
    const unreviewedReq = matchingCompletedRequests.find((r) =>
      r.requesterId === currentUser.id ? !r.reviewedByRequester : !r.reviewedByTarget
    );

    if (!unreviewedReq) {
      return {
        ok: false,
        message: 'คุณได้ให้คะแนนและเขียนรีวิวสำหรับการแลกเปลี่ยนทักษะครั้งนี้ไปแล้ว',
      };
    }

    const clampedRate = Math.max(1, Math.min(5, Number(rate.toFixed(1))));

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      requestId: unreviewedReq.id,
      reviewerId: currentUser.id,
      reviewerName: `${currentUser.name.split(' ')[0]} (${currentUser.faculty.replace('คณะ', '')})`,
      reviewerFaculty: currentUser.faculty,
      reviewerAvatar: currentUser.picture,
      targetUserId,
      rate: clampedRate,
      comment: comment.trim(),
      skillExchanged: skillExchanged.trim() || unreviewedReq.skillNeeded,
      createdAt: new Date().toISOString(),
      timeAgo: 'เมื่อสักครู่',
    };

    const nextRequests = latestDb.requests.map((r) => {
      if (r.id !== unreviewedReq.id) return r;
      if (r.requesterId === currentUser.id) {
        return { ...r, reviewedByRequester: true };
      }
      return { ...r, reviewedByTarget: true };
    });

    // Also reward reviewer with +15 XP for contributing feedback
    const nextUsers = latestDb.users.map((u) => {
      if (u.id === currentUser.id) {
        const nextXp = (u.xp || 0) + 15;
        return {
          ...u,
          xp: nextXp,
          levelTitle: u.role === 'admin' ? u.levelTitle : getLevelTitleFromXp(nextXp),
        };
      }
      return u;
    });

    await persistDb({
      ...latestDb,
      reviews: [newReview, ...latestDb.reviews],
      requests: nextRequests,
      users: nextUsers,
    });

    return { ok: true };
  };

  const deleteReviewByAdmin: DatabaseContextType['deleteReviewByAdmin'] = async (reviewId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return {
        ok: false,
        message: 'รีวิวที่ถูกเขียนแล้วไม่สามารถลบได้ด้วยตนเอง เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ลบรีวิวที่ไม่เหมาะสมได้',
      };
    }

    const latestDb = await getLatestDb();
    const nextReviews = latestDb.reviews.filter((r) => r.id !== reviewId);
    await persistDb({ ...latestDb, reviews: nextReviews });
    return { ok: true };
  };

  const getUserById = useCallback(
    (userId: string): User | undefined => {
      if (!userId) return undefined;
      const existing = db.users.find((u) => u.id === userId);
      if (existing) return existing;

      // Fallback profile for public board request posters (e.g. u-thanakorn, u-kittiphong)
      const relatedReq = db.requests.find(
        (r) => r.requesterId === userId || r.targetUserId === userId
      );
      if (!relatedReq) return undefined;

      const isRequester = relatedReq.requesterId === userId;
      const displayName = isRequester
        ? relatedReq.requesterName
        : relatedReq.targetUserName || 'เพื่อนนักศึกษา';
      const faculty = isRequester ? relatedReq.requesterFaculty : 'คณะวิศวกรรมศาสตร์';
      const skillName = isRequester
        ? relatedReq.skillOffered || 'ทักษะแลกเปลี่ยน'
        : relatedReq.skillNeeded || 'ทักษะแลกเปลี่ยน';
      const wantedName = isRequester ? relatedReq.skillNeeded : relatedReq.skillOffered;
      const slug = userId.replace(/^u-/, '').toLowerCase() || 'student';

      const pendingReportsForUser = db.reports.filter((rep) => rep.targetUserId === userId).length;

      return {
        id: userId,
        name: displayName,
        nickname: displayName.split(' ')[0],
        email: `${slug}@student.university.ac.th`,
        role: 'student',
        university: 'จุฬาลงกรณ์มหาวิทยาลัย',
        faculty,
        major: faculty.replace(/^คณะ/, ''),
        year: '3',
        picture:
          (isRequester ? relatedReq.requesterAvatar : relatedReq.targetUserAvatar) ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
        isVerified: true,
        verifiedDomain: '@student.university.ac.th',
        badgeText: 'Verified',
        badgeType: 'verified',
        xp: 650,
        levelTitle: 'Lv.2 Skill Explorer',
        exchangeCount: 2,
        responseTime: 'ตอบกลับไว',
        isAvailable: true,
        skills: [
          {
            name: skillName,
            level: 'Lv.4',
            category: inferSkillCategory(skillName),
          },
        ],
        skillWanted: wantedName,
        portfolioItems: [],
        portfolioLinks: {},
        contact: {
          phone: userId === 'u-thanakorn' ? '089-741-2580' : '081-852-9630',
          email: `${slug}@student.university.ac.th`,
          lineId: `${slug}_use`,
        },
        reportCount: pendingReportsForUser,
        isSuspended: pendingReportsForUser >= 3,
        createdAt: relatedReq.createdAt,
      };
    },
    [db.users, db.requests, db.reports]
  );

  const reportUser: DatabaseContextType['reportUser'] = async ({ targetUserId, reason, detail }) => {
    if (!currentUser || session.isGuest) {
      return { ok: false, message: 'กรุณาเข้าสู่ระบบนักศึกษาก่อนกดรายงานผู้ใช้' };
    }

    if (currentUser.id === targetUserId) {
      return { ok: false, message: 'ไม่สามารถรายงานตัวเองได้' };
    }

    const latestDb = await getLatestDb();
    const targetUser = latestDb.users.find((u) => u.id === targetUserId) || getUserById(targetUserId);
    if (!targetUser) {
      return { ok: false, message: 'ไม่พบผู้ใช้นี้' };
    }

    // Check duplicate pending report by the same reporter
    const alreadyReported = latestDb.reports.some(
      (rep) =>
        rep.reporterId === currentUser.id &&
        rep.targetUserId === targetUserId &&
        rep.status === 'Pending'
    );
    if (alreadyReported) {
      return {
        ok: false,
        message: 'คุณได้ส่งรายงานผู้ใช้นี้ไปแล้ว และกำลังอยู่ในระหว่างการตรวจสอบของ Admin',
      };
    }

    const newReportCount = (targetUser.reportCount || 0) + 1;
    // Condition: หากถูก Report เกิน 3 ครั้ง (หรือครบ 3 ครั้งขึ้นไป) บัญชีจะถูกระงับชั่วคราว
    const shouldSuspend = newReportCount >= 3;

    const nextUsers = latestDb.users.map((u) =>
      u.id === targetUserId
        ? {
            ...u,
            reportCount: newReportCount,
            isSuspended: shouldSuspend ? true : u.isSuspended,
          }
        : u
    );

    const newReport = {
      id: `rep-${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      targetUserId,
      targetUserName: targetUser.name,
      reason,
      detail,
      createdAt: new Date().toISOString(),
      status: 'Pending' as const,
    };

    await persistDb({
      ...latestDb,
      users: nextUsers,
      reports: [newReport, ...latestDb.reports],
    });

    return {
      ok: true,
      message: shouldSuspend
        ? `ส่งรายงานสำเร็จ เนื่องจากผู้ใช้นี้ถูกรายงานครบ ${newReportCount} ครั้ง ระบบได้ระงับบัญชีชั่วคราวเพื่อให้ Admin ตรวจสอบแล้ว`
        : `ส่งรายงานสำเร็จ (ถูกรายงานสะสม ${newReportCount}/3 ครั้ง)`,
    };
  };

  const resolveReportByAdmin: DatabaseContextType['resolveReportByAdmin'] = async (reportId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ดำเนินการได้' };
    }
    const latestDb = await getLatestDb();
    const nextReports = latestDb.reports.map((rep) =>
      rep.id === reportId ? { ...rep, status: 'Resolved' as const } : rep
    );
    await persistDb({ ...latestDb, reports: nextReports });
    return { ok: true, message: 'อัปเดตสถานะรายงานเป็นตรวจสอบแล้ว (Resolved)' };
  };

  const toggleSuspendUserByAdmin = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const latestDb = await getLatestDb();
    const target = latestDb.users.find((u) => u.id === userId);
    if (!target) return;
    const willUnsuspend = target.isSuspended;

    const nextUsers = latestDb.users.map((u) =>
      u.id === userId
        ? {
            ...u,
            isSuspended: !u.isSuspended,
            reportCount: willUnsuspend ? 0 : u.reportCount,
          }
        : u
    );

    const nextReports = willUnsuspend
      ? latestDb.reports.map((rep) =>
          rep.targetUserId === userId ? { ...rep, status: 'Resolved' as const } : rep
        )
      : latestDb.reports;

    await persistDb({ ...latestDb, users: nextUsers, reports: nextReports });
  };

  const toggleVerifyUserByAdmin: DatabaseContextType['toggleVerifyUserByAdmin'] = async (userId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ดำเนินการได้' };
    }
    const latestDb = await getLatestDb();
    const target = latestDb.users.find((u) => u.id === userId);
    if (!target) return { ok: false, message: 'ไม่พบบัญชีผู้ใช้นี้' };

    const nextVerified = !target.isVerified;
    const nextUsers = latestDb.users.map((u) =>
      u.id === userId
        ? {
            ...u,
            isVerified: nextVerified,
            badgeText: nextVerified ? u.badgeText || 'Verified' : undefined,
            badgeType: nextVerified ? u.badgeType || 'verified' : undefined,
          }
        : u
    );

    await persistDb({ ...latestDb, users: nextUsers });
    return {
      ok: true,
      message: nextVerified
        ? `อนุมัติป้ายยืนยันตัวตน (Verified) ให้ ${target.name} เรียบร้อยแล้ว`
        : `ยกเลิกสถานะยืนยันตัวตนของ ${target.name} เรียบร้อยแล้ว`,
    };
  };

  const cycleUserBadgeByAdmin: DatabaseContextType['cycleUserBadgeByAdmin'] = async (userId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ดำเนินการได้' };
    }
    const latestDb = await getLatestDb();
    const target = latestDb.users.find((u) => u.id === userId);
    if (!target) return { ok: false, message: 'ไม่พบบัญชีผู้ใช้นี้' };

    const badgePresets: Array<{ badgeText: string; badgeType: 'verified' | 'top' | 'fast' }> = [
      { badgeText: 'Verified', badgeType: 'verified' },
      { badgeText: 'Top Rated', badgeType: 'top' },
      { badgeText: 'ตอบกลับใน 15 นาที', badgeType: 'fast' },
      { badgeText: 'Master Mentor', badgeType: 'top' },
    ];
    const currentIdx = badgePresets.findIndex((b) => b.badgeText === target.badgeText);
    const nextPreset = badgePresets[(currentIdx + 1) % badgePresets.length];

    const nextUsers = latestDb.users.map((u) =>
      u.id === userId
        ? {
            ...u,
            isVerified: true,
            badgeText: nextPreset.badgeText,
            badgeType: nextPreset.badgeType,
          }
        : u
    );

    await persistDb({ ...latestDb, users: nextUsers });
    return {
      ok: true,
      message: `เปลี่ยนป้ายพิเศษของ ${target.name} เป็น "${nextPreset.badgeText}" เรียบร้อยแล้ว`,
    };
  };

  const adjustUserXpByAdmin: DatabaseContextType['adjustUserXpByAdmin'] = async (
    userId,
    deltaXp
  ) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ดำเนินการได้' };
    }
    const latestDb = await getLatestDb();
    const target = latestDb.users.find((u) => u.id === userId);
    if (!target) return { ok: false, message: 'ไม่พบบัญชีผู้ใช้นี้' };

    const nextXp = Math.max(0, (target.xp || 0) + deltaXp);
    const nextLevelTitle =
      target.role === 'admin' ? target.levelTitle : getLevelTitleFromXp(nextXp);

    const nextUsers = latestDb.users.map((u) =>
      u.id === userId
        ? {
            ...u,
            xp: nextXp,
            levelTitle: nextLevelTitle,
          }
        : u
    );

    await persistDb({ ...latestDb, users: nextUsers });
    return {
      ok: true,
      message: `ปรับคะแนน XP ของ ${target.name} (${deltaXp >= 0 ? `+${deltaXp}` : deltaXp} XP → รวม ${nextXp} XP, ${nextLevelTitle})`,
    };
  };

  const deleteUserByAdmin: DatabaseContextType['deleteUserByAdmin'] = async (userId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ดำเนินการได้' };
    }
    const latestDb = await getLatestDb();
    const target = latestDb.users.find((u) => u.id === userId);
    if (!target) return { ok: false, message: 'ไม่พบบัญชีผู้ใช้นี้' };
    if (target.role === 'admin') {
      return { ok: false, message: 'ไม่สามารถลบบัญชีผู้ดูแลระบบ (Admin) ได้' };
    }

    const nextUsers = latestDb.users.filter((u) => u.id !== userId);
    const nextRequests = latestDb.requests.filter(
      (r) => r.requesterId !== userId && r.targetUserId !== userId
    );
    const nextReports = latestDb.reports.filter(
      (rep) => rep.targetUserId !== userId && rep.reporterId !== userId
    );
    const nextReviews = latestDb.reviews.filter(
      (rev) => rev.targetUserId !== userId && rev.reviewerId !== userId
    );

    await persistDb({
      ...latestDb,
      users: nextUsers,
      requests: nextRequests,
      reports: nextReports,
      reviews: nextReviews,
    });

    return {
      ok: true,
      message: `ลบบัญชีของ ${target.name} และข้อมูลคำขอที่เกี่ยวข้องออกจากระบบเรียบร้อยแล้ว`,
    };
  };

  const updateAnnouncementByAdmin: DatabaseContextType['updateAnnouncementByAdmin'] = async (
    text,
    active
  ) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ดำเนินการได้' };
    }
    const latestDb = await getLatestDb();
    const cleanText = text.trim();
    const nextAnnouncement = {
      text: cleanText,
      active: Boolean(active && cleanText),
      updatedAt: new Date().toISOString(),
    };
    await persistDb({
      ...latestDb,
      announcement: nextAnnouncement,
    });
    return {
      ok: true,
      message: nextAnnouncement.active
        ? 'อัปเดตแบนเนอร์ประกาศข่าวสารระดับมหาวิทยาลัยเรียบร้อยแล้ว (แสดงหน้าแรกทุกบัญชี)'
        : 'ปิดการแสดงผลแบนเนอร์ประกาศข่าวสารเรียบร้อยแล้ว',
    };
  };

  const clearAllDataByAdmin: DatabaseContextType['clearAllDataByAdmin'] = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ดำเนินการได้' };
    }
    const cleanPresentationDb = normalizeDatabaseSchema({
      users: (initialDbData as unknown as DatabaseSchema).users,
      reviews: [],
      requests: [],
      reports: [],
      announcement: undefined,
    });
    await persistDb(cleanPresentationDb);
    return {
      ok: true,
      message:
        'รีเซ็ตฐานข้อมูลเรียบร้อยแล้ว! ระบบเหลือเฉพาะ Admin และบัญชี Test 1 & Test 2 (ล้างคำขอ รีวิว และรายงานทั้งหมดเป็น 0)',
    };
  };

  const restoreDemoDataByAdmin: DatabaseContextType['restoreDemoDataByAdmin'] = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, message: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ดำเนินการได้' };
    }
    const restored = normalizeDatabaseSchema(demoSeedData as unknown as DatabaseSchema);
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const refreshedRequests = restored.requests.map((r) => ({
      ...r,
      createdAt: nowIso,
      date: r.date < futureDate ? futureDate : r.date,
      status: r.status === 'Expired' ? ('Pending' as RequestStatus) : r.status,
    }));
    await persistDb({
      ...restored,
      requests: refreshedRequests,
    });
    return {
      ok: true,
      message: 'กู้คืนข้อมูลตัวอย่าง (Demo Data) ทั้งหมดกลับสู่ระบบเรียบร้อยแล้ว!',
    };
  };

  const getUserRatingStats = useCallback(
    (userId: string) => {
      const userReviews = db.reviews.filter((r) => r.targetUserId === userId);
      const base = BASE_RATING_STATS[userId];

      if (!base) {
        if (userReviews.length === 0) {
          return { average: 5.0, count: 0, reviews: [] };
        }
        const sum = userReviews.reduce((acc, r) => acc + r.rate, 0);
        return {
          average: Number((sum / userReviews.length).toFixed(2)),
          count: userReviews.length,
          reviews: userReviews,
        };
      }

      const totalCount = base.baseCount + userReviews.length;
      const totalScore = base.baseTotalScore + userReviews.reduce((acc, r) => acc + r.rate, 0);
      return {
        average: Number((totalScore / totalCount).toFixed(2)),
        count: totalCount,
        reviews: userReviews,
      };
    },
    [db.reviews]
  );

  const canViewPrivateContact = useCallback(
    (targetUserId: string): boolean => {
      if (session.isGuest || !currentUser) return false;
      if (currentUser.id === targetUserId) return true;
      if (currentUser.role === 'admin') return true;

      // Condition: ช่องทางติดต่อจะแสดงก็ต่อเมื่อผู้รับตกลงรับคำขอ (Accepted) หรือเสร็จสิ้น (Completed) เท่านั้น
      return db.requests.some(
        (r) =>
          (r.status === 'Accepted' || r.status === 'Completed') &&
          ((r.requesterId === currentUser.id && r.targetUserId === targetUserId) ||
            (r.targetUserId === currentUser.id && r.requesterId === targetUserId))
      );
    },
    [currentUser, session.isGuest, db.requests]
  );

  const calculateMatchScore = useCallback(
    (otherUser: User): MatchScoreResult => {
      const mySkills = currentUser?.skills?.length
        ? currentUser.skills
        : [{ name: 'UX/UI Design', level: 'Lv.4', category: 'design' as const }];
      const myWanted = (currentUser?.skillWanted || 'Data Science').trim().toLowerCase();

      const theirSkills = otherUser.skills?.length
        ? otherUser.skills
        : [{ name: 'Python Data', level: 'Lv.4', category: 'coding' as const }];
      const theirWanted = (otherUser.skillWanted || '').trim().toLowerCase();

      const isKeywordMatch = (skillName: string, wantedText: string) => {
        if (!skillName || !wantedText) return false;
        const a = skillName.toLowerCase();
        const b = wantedText.toLowerCase();
        if (a.includes(b) || b.includes(a)) return true;
        const tokensA = a.split(/[\s,()/&-]+/).filter((t) => t.length >= 2);
        const tokensB = b.split(/[\s,()/&-]+/).filter((t) => t.length >= 2);
        return tokensA.some((ta) => tokensB.some((tb) => ta === tb || ta.includes(tb) || tb.includes(ta)));
      };

      // Check if they have what I want (exact keyword first, then category)
      const exactTheirSkill = theirSkills.find((sk) => isKeywordMatch(sk.name, myWanted));
      const catTheirSkill = theirSkills.find(
        (sk) => inferSkillCategory(sk.name) === inferSkillCategory(myWanted)
      );
      const matchedTheirSkill = exactTheirSkill || catTheirSkill;

      // Check if I have what they want (exact keyword first, then category)
      const exactMySkill = theirWanted
        ? mySkills.find((sk) => isKeywordMatch(sk.name, theirWanted))
        : undefined;
      const catMySkill = theirWanted
        ? mySkills.find((sk) => inferSkillCategory(sk.name) === inferSkillCategory(theirWanted))
        : undefined;
      const matchedMySkill = exactMySkill || catMySkill;

      let score = 72;
      if (exactTheirSkill && exactMySkill) {
        score = 96;
      } else if (matchedTheirSkill && matchedMySkill) {
        score = 90;
      } else if (exactTheirSkill || exactMySkill) {
        score = 86;
      } else if (matchedTheirSkill || matchedMySkill) {
        score = 82;
      }

      if (currentUser && otherUser.university === currentUser.university) {
        score += 2;
      }
      if (!otherUser.isAvailable) {
        score -= 8;
      }

      const clamped = Math.max(65, Math.min(99, score));
      return {
        percent: clamped,
        mySkillToTeach: (matchedMySkill || mySkills[0]).name,
        theirSkillToTeach: (matchedTheirSkill || theirSkills[0]).name,
        isDirectMatch: Boolean(matchedTheirSkill || matchedMySkill),
      };
    },
    [currentUser]
  );

  const exportDatabaseJson = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'use-database.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DatabaseContext.Provider
      value={{
        db,
        currentUser,
        isGuest: session.isGuest,
        isLoading,
        favoriteUserIds,
        toggleFavoriteUser,
        rememberedEmail,
        login,
        resetPassword,
        loginAsGuest,
        logout,
        registerUser,
        updateCurrentUser,
        createRequest,
        updateRequestStatus,
        deleteRequest,
        renewRequest,
        offerHelpOnRequest,
        addReview,
        deleteReviewByAdmin,
        reportUser,
        resolveReportByAdmin,
        toggleSuspendUserByAdmin,
        toggleVerifyUserByAdmin,
        cycleUserBadgeByAdmin,
        adjustUserXpByAdmin,
        deleteUserByAdmin,
        updateAnnouncementByAdmin,
        clearAllDataByAdmin,
        restoreDemoDataByAdmin,
        getUserById,
        getUserRatingStats,
        canViewPrivateContact,
        isProfileComplete,
        calculateMatchScore,
        exportDatabaseJson,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return ctx;
};
