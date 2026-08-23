import { useState, useEffect, useCallback } from "react";

export const useSecurity = () => {
  const [isPasswordEnabled, setIsPasswordEnabled] = useState<boolean>(() => {
    return localStorage.getItem("app_security_enabled") === "true";
  });

  const [savedPassword, setSavedPassword] = useState<string>(() => {
    return localStorage.getItem("app_security_pin") || "";
  });

  // 초기 상태: 비밀번호가 켜져 있으면 잠김(false), 꺼져 있으면 해제됨(true)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    const enabled = localStorage.getItem("app_security_enabled") === "true";
    const pin = localStorage.getItem("app_security_pin") || "";
    return !(enabled && pin);
  });

  useEffect(() => {
    localStorage.setItem("app_security_enabled", isPasswordEnabled ? "true" : "false");
  }, [isPasswordEnabled]);

  useEffect(() => {
    localStorage.setItem("app_security_pin", savedPassword);
  }, [savedPassword]);

  const setPassword = useCallback((newPin: string) => {
    setSavedPassword(newPin);
    setIsPasswordEnabled(true);
    setIsUnlocked(true);
  }, []);

  const disablePassword = useCallback(() => {
    setSavedPassword("");
    setIsPasswordEnabled(false);
    setIsUnlocked(true);
  }, []);

  const verifyPassword = useCallback((inputPin: string): boolean => {
    if (!isPasswordEnabled || !savedPassword) return true;
    return inputPin === savedPassword;
  }, [isPasswordEnabled, savedPassword]);

  const unlockApp = useCallback((inputPin: string): boolean => {
    if (!isPasswordEnabled || !savedPassword) {
      setIsUnlocked(true);
      return true;
    }
    if (inputPin === savedPassword) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, [isPasswordEnabled, savedPassword]);

  const lockApp = useCallback(() => {
    if (isPasswordEnabled && savedPassword) {
      setIsUnlocked(false);
    }
  }, [isPasswordEnabled, savedPassword]);

  return {
    isPasswordEnabled,
    savedPassword,
    isUnlocked,
    setPassword,
    disablePassword,
    verifyPassword,
    unlockApp,
    lockApp,
  };
};
