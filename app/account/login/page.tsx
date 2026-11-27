import type { Metadata } from 'next';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in | Chanakya Lens', robots: { index: false, follow: false } };

export default function AccountLoginPage() {
  // Until membership opens, new readers are pointed to the waitlist instead of creating an account.
  return <LoginForm signupOpen={process.env.MEMBERSHIP_PUBLIC === 'true'} />;
}
