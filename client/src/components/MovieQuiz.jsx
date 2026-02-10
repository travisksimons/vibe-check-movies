import React, { useState, useEffect } from 'react';

function MovieQuiz({ onSubmit, onComplete, onBack }) {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies/quiz?count=15');
      const data = await res.json();
      if (data.movies) {
        setMovies(data.movies);
      } else {
        setError('Could not load movies');
      }
    } catch (err) {
      setError('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vt-black flex flex-col items-center justify-center px-6">
        <div className="text-vt-gray mb-4">loading movies...</div>
        <div className="w-32 h-48 skeleton rounded-lg" />
      </div>
    );
  }

  if (error || movies.length === 0) {
    return (
      <div className="min-h-screen bg-vt-black flex flex-col items-center justify-center px-6 py-12">
        <div className="text-red-400 mb-4">{error || 'No movies available'}</div>
        {onBack && (
          <button onClick={onBack} className="text-vt-gray text-sm hover:text-vt-white">
            back to lobby
          </button>
        )}
      </div>
    );
  }

  const currentMovie = movies[currentIndex];
  const progress = ((currentIndex + 1) / movies.length) * 100;
  const isLastMovie = currentIndex === movies.length - 1;

  const handleVote = (vote) => {
    // vote: 'love', 'like', 'pass', 'havent_seen'
    setAnswers(prev => ({
      ...prev,
      [currentMovie.id]: {
        movieId: currentMovie.id,
        title: currentMovie.title,
        vote
      }
    }));

    if (!isLastMovie) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(answers);
      onComplete();
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentAnswer = answers[currentMovie?.id]?.vote;
  const allAnswered = Object.keys(answers).length === movies.length;

  return (
    <div className="min-h-screen bg-vt-black flex flex-col px-6 py-6">
      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-vt-gray text-xs">{currentIndex + 1} of {movies.length}</span>
          <span className="text-vt-gray text-xs">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Movie Card */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-xs">
          {/* Poster */}
          {currentMovie.poster ? (
            <img
              src={currentMovie.poster}
              alt={currentMovie.title}
              className="w-full aspect-[2/3] object-cover rounded-lg shadow-2xl"
            />
          ) : (
            <div className="w-full aspect-[2/3] bg-vt-dark rounded-lg flex items-center justify-center">
              <span className="text-vt-gray text-sm">No poster</span>
            </div>
          )}

          {/* Selected indicator */}
          {currentAnswer && (
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
              currentAnswer === 'love' ? 'bg-green-500 text-white' :
              currentAnswer === 'like' ? 'bg-blue-500 text-white' :
              currentAnswer === 'pass' ? 'bg-red-500 text-white' :
              'bg-vt-gray text-vt-black'
            }`}>
              {currentAnswer === 'love' ? '♥ must watch' :
               currentAnswer === 'like' ? 'interested' :
               currentAnswer === 'pass' ? 'not for me' :
               'haven\'t seen'}
            </div>
          )}
        </div>

        {/* Title and info */}
        <div className="mt-4 text-center">
          <h2 className="text-xl text-vt-white font-medium">{currentMovie.title}</h2>
          <p className="text-vt-gray text-sm mt-1">
            {currentMovie.year}
            {currentMovie.genres?.length > 0 && ` • ${currentMovie.genres.slice(0, 2).join(', ')}`}
          </p>
        </div>
      </div>

      {/* Vote Buttons */}
      <div className="mt-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleVote('love')}
            className={`py-4 rounded-lg font-medium transition-all ${
              currentAnswer === 'love'
                ? 'bg-green-500 text-white'
                : 'bg-vt-dark text-vt-white hover:bg-green-500/20 border border-vt-darkgray'
            }`}
          >
            ♥ must watch
          </button>
          <button
            onClick={() => handleVote('like')}
            className={`py-4 rounded-lg font-medium transition-all ${
              currentAnswer === 'like'
                ? 'bg-blue-500 text-white'
                : 'bg-vt-dark text-vt-white hover:bg-blue-500/20 border border-vt-darkgray'
            }`}
          >
            interested
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleVote('pass')}
            className={`py-4 rounded-lg font-medium transition-all ${
              currentAnswer === 'pass'
                ? 'bg-red-500 text-white'
                : 'bg-vt-dark text-vt-gray hover:bg-red-500/20 border border-vt-darkgray'
            }`}
          >
            not for me
          </button>
          <button
            onClick={() => handleVote('havent_seen')}
            className={`py-4 rounded-lg font-medium transition-all ${
              currentAnswer === 'havent_seen'
                ? 'bg-vt-gray text-vt-black'
                : 'bg-vt-dark text-vt-gray hover:bg-vt-darkgray border border-vt-darkgray'
            }`}
          >
            haven't seen
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex gap-3">
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="flex-1 py-3 border border-vt-darkgray text-vt-white rounded-lg hover:border-vt-white transition-colors"
          >
            back
          </button>
        )}

        {isLastMovie && allAnswered ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-vt-white text-vt-black font-medium rounded-lg disabled:opacity-50"
          >
            {submitting ? 'submitting...' : 'see results'}
          </button>
        ) : currentAnswer && !isLastMovie ? (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="flex-1 py-3 bg-vt-white text-vt-black font-medium rounded-lg"
          >
            next
          </button>
        ) : null}
      </div>

      {/* Progress dots */}
      <div className="mt-4 flex justify-center gap-1 flex-wrap">
        {movies.map((m, idx) => (
          <div
            key={m.id}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex
                ? 'bg-vt-white'
                : answers[m.id]
                  ? answers[m.id].vote === 'love' ? 'bg-green-500' :
                    answers[m.id].vote === 'like' ? 'bg-blue-500' :
                    answers[m.id].vote === 'pass' ? 'bg-red-500' :
                    'bg-vt-gray'
                  : 'bg-vt-dark'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default MovieQuiz;
