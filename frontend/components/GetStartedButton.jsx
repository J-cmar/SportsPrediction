'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function GetStartedButton({ session, className = "" }) {
  const router = useRouter();

  const handleClick = () => {
    // Always navigate to the get-started page
    router.push('/get-started');
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg text-sm ${className}`}
    >
      Get Started
    </button>
  );
}