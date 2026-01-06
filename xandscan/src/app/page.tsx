import Dashboard from '@/components/Dashboard';
import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Dashboard />
      <ChatWidget />
    </main>
  );
}
