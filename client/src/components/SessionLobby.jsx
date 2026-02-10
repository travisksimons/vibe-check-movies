import React, { useState, useEffect } from 'react';

function SessionLobby({ sessionData, participantId, participantName, isHost, onJoin, onGenerate, onStartQuiz, onViewResults, onCloseVoting }) {
  const [joinName, setJoinName] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(null);

  useEffect(() => {
    if (joinName && !participantId) {
      setJoinName('');
    }
  }, [participantId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (joinName.trim()) {
      await onJoin(sessionData.id, joinName.trim());
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      await onGenerate();
    } catch (err) {
      setGenerateError(
        sessionData?.mode === 'locals'
          ? 'Could not find places. Try again or use a larger radius.'
          : 'Failed to generate questions. Please try again.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCloseVoting = async () => {
    setClosing(true);
    setCloseError(null);
    try {
      await onCloseVoting();
    } catch (err) {
      setCloseError(err.message || 'Failed to close voting');
    } finally {
      setClosing(false);
    }
  };

  const shareUrl = window.location.href;

  // Guest joined but quiz not started yet
  if (!participantId && !isHost) {
    return (
      <div className="min-h-screen bg-vt-black flex flex-col px-6 py-12">
        <span className="text-vt-gray text-xs uppercase tracking-wider mb-2">
          {sessionData?.category}
        </span>
        <h1 className="text-xl text-vt-white mb-8">join the vibe check</h1>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="your name"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            className="w-full bg-transparent border-b border-vt-darkgray py-3 text-lg text-vt-white placeholder-vt-gray focus:outline-none focus:border-vt-white transition-colors"
            autoFocus
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={joinName.trim().length === 0}
            className="mt-4 py-3 px-6 bg-vt-white text-vt-black font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            join
          </button>
        </form>
      </div>
    );
  }

  // Quiz not started yet - show lobby
  if (sessionData?.status === 'lobby' || sessionData?.status === 'collecting') {
    const allParticipants = sessionData?.participants || [];
    const completedCount = sessionData?.completedCount || 0;
    const totalCount = allParticipants.length;
    const allCompleted = totalCount > 0 && completedCount === totalCount;
    const waitingOn = allParticipants.filter(p => !p.completed);
    const currentParticipant = allParticipants.find(p => p.id === participantId);
    const hasCompletedQuiz = currentParticipant?.completed;

    // Show waiting screen if user completed quiz but waiting on others
    if (hasCompletedQuiz && !allCompleted && sessionData?.status === 'collecting') {
      return (
        <div className="min-h-screen bg-vt-black flex flex-col items-center justify-center px-6 py-12">
          <span className="text-vt-gray text-xs uppercase tracking-wider mb-2">
            {sessionData?.category}
          </span>
          <h1 className="text-xl text-vt-white mb-8">you're done!</h1>

          <div className="w-full max-w-sm">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 bg-vt-white rounded-full animate-pulse" />
              <span className="text-vt-gray text-sm">
                waiting on {waitingOn.length === 1 ? waitingOn[0].name : `${waitingOn.length} people`}
              </span>
            </div>

            <div className="bg-vt-dark rounded-lg p-4 mb-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {allParticipants.map((p) => (
                  <div
                    key={p.id}
                    className={`px-3 py-1 rounded-full text-sm ${
                      p.completed
                        ? 'bg-vt-darkgray text-vt-gray'
                        : 'bg-vt-white text-vt-black'
                    }`}
                  >
                    {p.name} {p.completed ? '✓' : '...'}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-vt-gray text-xs text-center">
              {completedCount}/{totalCount} finished
            </p>
          </div>
        </div>
      );
    }

    // Show generating results screen if all completed
    if (allCompleted && sessionData?.status === 'collecting') {
      return (
        <div className="min-h-screen bg-vt-black flex flex-col items-center justify-center px-6 py-12">
          <span className="text-vt-gray text-xs uppercase tracking-wider mb-2">
            {sessionData?.category}
          </span>
          <h1 className="text-xl text-vt-white mb-8">everyone's done!</h1>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-vt-white rounded-full animate-ping" />
            <span className="text-vt-gray">generating results...</span>
          </div>

          <p className="text-vt-gray text-xs text-center">
            this may take a moment
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-vt-black flex flex-col px-6 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className="text-vt-gray text-xs uppercase tracking-wider">
              {sessionData?.category}
            </span>
            <h1 className="text-xl text-vt-white mt-1">vibe check</h1>
          </div>
          {isHost && (
            <button onClick={copyLink} className="text-vt-gray text-xs hover:text-vt-white">
              {copied ? 'copied' : 'share'}
            </button>
          )}
        </div>

        {isHost ? (
          <>
            <p className="text-vt-gray text-sm mb-6">share this link with your crew</p>
            <div className="bg-vt-dark p-4 rounded-lg mb-6">
              <code className="text-vt-light text-sm break-all">{shareUrl}</code>
            </div>

            <h2 className="text-vt-white mb-4 text-sm">participants ({totalCount})</h2>
            <div className="flex flex-col gap-2 mb-8">
              {allParticipants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2">
                  <div className="avatar-circle">{p.name.charAt(0).toUpperCase()}</div>
                  <span className="text-vt-white">{p.name}</span>
                  {p.name === sessionData?.host_name && (
                    <span className="text-vt-gray text-xs">(host)</span>
                  )}
                  {p.completed && (
                    <span className="text-vt-gray text-xs">done</span>
                  )}
                </div>
              ))}
            </div>

            {sessionData?.status === 'complete' || (allParticipants.length > 0 && allParticipants.every(p => p.completed)) ? (
              <button
                onClick={onViewResults}
                className="py-4 bg-vt-white text-vt-black font-medium"
              >
                view results
              </button>
            ) : sessionData?.status === 'collecting' ? (
              <>
                <button
                  onClick={onStartQuiz}
                  className="py-4 bg-vt-white text-vt-black font-medium mb-4"
                >
                  take quiz
                </button>
                {totalCount > 0 && (
                  <p className="text-vt-gray text-sm text-center mb-4">
                    waiting for everyone to finish ({completedCount}/{totalCount} done)
                  </p>
                )}
                {completedCount > 0 && completedCount < totalCount && (
                  <>
                    <button
                      onClick={handleCloseVoting}
                      disabled={closing}
                      className="py-3 border border-vt-darkgray text-vt-gray hover:border-vt-light hover:text-vt-white transition-colors disabled:opacity-50"
                    >
                      {closing ? 'closing...' : 'close voting early'}
                    </button>
                    <p className="text-vt-gray text-xs text-center mt-2">
                      generate results with {completedCount} participant{completedCount !== 1 ? 's' : ''}
                    </p>
                    {closeError && (
                      <p className="text-red-400 text-sm text-center mt-2">{closeError}</p>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {totalCount < 1 ? (
                  <>
                    <button
                      disabled
                      className="py-4 bg-vt-darkgray text-vt-gray font-medium cursor-not-allowed"
                    >
                      start quiz
                    </button>
                    <p className="text-vt-gray text-sm text-center mt-3">
                      waiting for you to join...
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="py-4 bg-vt-white text-vt-black font-medium disabled:opacity-50"
                    >
                      {generating
                        ? (sessionData?.mode === 'locals' ? 'finding places nearby...' : 'starting...')
                        : (sessionData?.mode === 'locals' ? 'find places' : 'start quiz')
                      }
                    </button>
                    {generateError && (
                      <p className="text-red-400 text-sm text-center mt-3">{generateError}</p>
                    )}
                    {sessionData?.mode === 'locals' && generating && (
                      <p className="text-vt-gray text-xs text-center mt-3">this may take up to 60 seconds...</p>
                    )}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="text-vt-white mb-4 text-sm">participants ({totalCount})</h2>
            <div className="flex flex-wrap gap-2 mb-8">
              {allParticipants.map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-vt-dark px-3 py-2 rounded-full">
                  <span className="text-vt-white text-sm">{p.name}</span>
                  {p.completed && <span className="text-vt-gray text-xs">done</span>}
                </div>
              ))}
            </div>

            {sessionData?.status === 'lobby' ? (
              <p className="text-vt-gray text-sm text-center">waiting for host to start the quiz...</p>
            ) : (
              <button
                onClick={onStartQuiz}
                className="py-4 bg-vt-white text-vt-black font-medium"
              >
                start quiz
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Default - show lobby
  return (
    <div className="min-h-screen bg-vt-black flex flex-col px-6 py-12">
      <span className="text-vt-gray text-xs uppercase tracking-wider">{sessionData?.category}</span>
      <h1 className="text-xl text-vt-white mt-1">vibe check</h1>

      <p className="text-vt-gray text-sm mt-8">share this link with your crew</p>
      <div className="bg-vt-dark p-4 rounded-lg mt-2">
        <code className="text-vt-light text-sm break-all">{shareUrl}</code>
      </div>

      <p className="text-vt-gray text-sm mt-8">participants: {sessionData?.participants?.length || 0}</p>
    </div>
  );
}

export default SessionLobby;