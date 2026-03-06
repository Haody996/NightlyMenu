import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function GoogleSignInButton() {
  const { login } = useAuth();
  const navigate = useNavigate();

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
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => {}}
      useOneTap={false}
      shape="rectangular"
      size="large"
      width="100%"
      text="continue_with"
    />
  );
}
