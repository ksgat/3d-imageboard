'use client';
import NewestPostsList from '@/app/components/MostRecentPosts';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-serif p-6 space-y-6">
      <h1 className="text-4xl font-bold">Welcome to Your Forum</h1>
      <p className="text-gray-400 text-lg">Start exploring by visiting the board.</p>
      <div className=" items-center w-400">
      {}
      
      <NewestPostsList/>
      </div>
    </main>
  );
}

