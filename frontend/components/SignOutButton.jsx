'use client';

import { signOut } from "next-auth/react";

export default function SignOutButton({ fullWidth = false }) {
  const handleSignOut = () => {
    signOut({ 
      callbackUrl: '/',  // Redirect to home page after signout
      redirect: true     // Ensure redirect happens
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className={`bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg ${fullWidth ? 'w-full' : ''}`}
    >
      Sign Out
    </button>
  );
}