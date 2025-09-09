'use client';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import ChatComponent from '../../components/ChatComponent';

export default function ChatPage() {
  return (
    <>
      <SignedIn>
        <div className="flex flex-col h-screen bg-gray-50">
          <ChatComponent />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
