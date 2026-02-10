import React, { useState } from 'react';

function Landing({ onCreate }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onCreate({
        mode: 'discover',
        category: 'movies',
        hostName: name.trim()
      });
    } catch (err) {
      console.error('Failed to create:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-vt-black flex flex-col justify-between px-6 py-12">
      <div>
        <h1 className="text-2xl text-vt-white mb-2">vibe check</h1>
        <p className="text-vt-accent text-lg">movies</p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-vt-gray mb-8">
          can't decide what to watch? swipe on movies, find what everyone actually wants.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-b border-vt-darkgray py-3 text-lg text-vt-white placeholder-vt-gray focus:outline-none focus:border-vt-white transition-colors"
            autoFocus
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={name.trim().length === 0 || loading}
            className="mt-4 py-4 bg-vt-white text-vt-black font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'creating...' : 'start session'}
          </button>
        </form>
      </div>

      <div className="text-center">
        <p className="text-vt-gray text-xs">
          create a session, share the link, everyone swipes, get recommendations.
        </p>
      </div>
    </div>
  );
}

export default Landing;
