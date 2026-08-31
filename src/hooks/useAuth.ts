import { useState, useEffect, useCallback } from "react";

export interface UserProfile {
  id: string;
  username: string;
  passwordHash: string;
  phone: string;
  name?: string;
  createdAt: string;
}

const STORAGE_KEY_USERS = "wbr_registered_users_v1";
const STORAGE_KEY_CURRENT_USER = "wbr_current_session_user_v1";

// 기본 데모 계정
const DEFAULT_DEMO_USER: UserProfile = {
  id: "demo-user-rich",
  username: "richuser",
  passwordHash: "123456",
  phone: "010-8888-9999",
  name: "워너비리치",
  createdAt: new Date().toISOString(),
};

export const useAuth = () => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse users", e);
    }
    return [DEFAULT_DEMO_USER];
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse current user", e);
    }
    // 기본적으로 로그인된 상태 유지 (없으면 null)
    return null;
  });

  // SMS 인증번호 임시 저장소 (전화번호 -> { code, expiresAt, verified })
  const [verificationMap, setVerificationMap] = useState<Record<string, { code: string; expiresAt: number; verified: boolean }>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  // 1. 아이디 중복 확인
  const checkUsernameAvailable = useCallback((username: string): boolean => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) return false;
    return !users.some(u => u.username.toLowerCase() === trimmed);
  }, [users]);

  // 2. 전화번호 SMS 인증번호 발송 (6자리)
  const sendSmsCode = useCallback((phone: string): { success: boolean; code: string; message: string } => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      return { success: false, code: "", message: "올바른 휴대폰 번호를 입력해주세요." };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 3 * 60 * 1000; // 3분

    setVerificationMap(prev => ({
      ...prev,
      [cleanPhone]: { code, expiresAt, verified: false }
    }));

    return {
      success: true,
      code,
      message: `[Wanna Be Rich] 인증번호 [${code}]를 입력해주세요. (유효시간 3분)`
    };
  }, []);

  // 3. SMS 인증번호 검증
  const verifySmsCode = useCallback((phone: string, inputCode: string): { success: boolean; message: string } => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const record = verificationMap[cleanPhone];

    if (!record) {
      return { success: false, message: "인증번호를 먼저 요청해주세요." };
    }
    if (Date.now() > record.expiresAt) {
      return { success: false, message: "인증 유효시간(3분)이 만료되었습니다. 다시 요청해주세요." };
    }
    if (record.code !== inputCode.trim()) {
      return { success: false, message: "인증번호가 일치하지 않습니다." };
    }

    setVerificationMap(prev => ({
      ...prev,
      [cleanPhone]: { ...record, verified: true }
    }));

    return { success: true, message: "휴대폰 본인 인증이 성공적으로 완료되었습니다!" };
  }, [verificationMap]);

  // 4. 회원가입
  const signup = useCallback((data: {
    username: string;
    password: string;
    phone: string;
    name?: string;
  }): { success: boolean; error?: string } => {
    const trimmedUser = data.username.trim();
    const cleanPhone = data.phone.replace(/[^0-9]/g, "");

    if (!checkUsernameAvailable(trimmedUser)) {
      return { success: false, error: "이미 사용 중인 아이디입니다." };
    }
    if (data.password.length < 6) {
      return { success: false, error: "비밀번호는 최소 6자리 이상이어야 합니다." };
    }

    const record = verificationMap[cleanPhone];
    if (!record || !record.verified) {
      return { success: false, error: "휴대폰 번호 인증을 완료해주세요." };
    }

    const newUser: UserProfile = {
      id: "user-" + Date.now(),
      username: trimmedUser,
      passwordHash: data.password, // 로컬 환경용
      phone: data.phone,
      name: data.name || trimmedUser,
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true };
  }, [checkUsernameAvailable, verificationMap]);

  // 5. 로그인
  const login = useCallback((username: string, password: string): { success: boolean; error?: string } => {
    const trimmedUser = username.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === trimmedUser && u.passwordHash === password);

    if (!user) {
      return { success: false, error: "아이디 또는 비밀번호가 일치하지 않습니다." };
    }

    setCurrentUser(user);
    return { success: true };
  }, [users]);

  // 6. 데모 원클릭 로그인
  const loginDemo = useCallback(() => {
    setCurrentUser(DEFAULT_DEMO_USER);
  }, []);

  // 7. 로그아웃
  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return {
    users,
    currentUser,
    isAuthenticated: !!currentUser,
    checkUsernameAvailable,
    sendSmsCode,
    verifySmsCode,
    signup,
    login,
    loginDemo,
    logout,
  };
};
