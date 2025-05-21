// ResetPassword.tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom'; // or useRouter in Next.js

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const [params] = useSearchParams(); // or use router.query in Next.js
  const uid = params.get('uid');
  const token = params.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords don't match.");
      return;
    }

    const response = await fetch('https://api.moneytrackr.ca/api/password-reset/done/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, password }),
    });

    if (response.ok) {
      setMessage('Password successfully changed!');
    } else {
      setMessage('Failed to reset password.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
      <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
      <button type="submit">Set New Password</button>
      {message && <p>{message}</p>}
    </form>
  );
}
