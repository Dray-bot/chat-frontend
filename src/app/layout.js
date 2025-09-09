import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata = {
  title: 'Ping Chat App',
  description:
    'Real-time chat application with private messaging, online users, and interactive animations.',
  icons: {
    icon: '/img/ping.png',
    shortcut: '/img/ping.png',
    apple: '/img/ping.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
