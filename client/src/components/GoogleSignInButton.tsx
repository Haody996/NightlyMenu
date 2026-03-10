import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// Capacitor sets window.Capacitor when running as a native app
const isNative = !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

export default function GoogleSignInButton() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);

  if (isNative) return null;

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  async function handleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return;
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential });
      const meRes = await api.request({
        url: '/auth/me',
        headers: { Authorization: `Bearer ${res.data.token}` },
      });
      login(res.data.token, res.data.user, meRes.data.household);
      navigate(meRes.data.household ? '/' : '/household');
    } catch {
      // GoogleLogin renders its own error state
    }
  }

  return (
    <div ref={wrapperRef} className="w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {}}
        useOneTap={false}
        shape="rectangular"
        size="large"
        width={width}
        text="continue_with"
      />
    </div>
  );
}
