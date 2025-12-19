import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <main className='min-h-screen p-8'>
      <h1 className='mb-8 text-3xl font-bold tracking-tight text-primary'>XandScan <span className='text-foreground text-lg font-normal'>Node Analytics</span></h1>
      <Dashboard />
    </main>
  );
}
