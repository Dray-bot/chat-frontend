'use client';
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white shadow rounded">
        <SignUp
          routing="path" // keeps path-based routing
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
