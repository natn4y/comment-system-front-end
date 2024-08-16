'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [nickname, setNickname] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname) {
      router.push(`/comments?nickname=${encodeURIComponent(nickname)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Enter your nickname</h1>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          placeholder="Nickname"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Join Comments
        </button>
      </form>
    </div>
  );
}
