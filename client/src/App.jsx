import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Landing from './components/Landing';
import SessionLobby from './components/SessionLobby';
import MovieQuiz from './components/MovieQuiz';
import Results from './components/Results';

const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

function App() {
  const [view, setView] = useState('landing');
  const [sessionId, setSessionId] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [participantName, setParticipantName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/session/')) {
      const id = path.split('/session/')[1];
      setSessionId(id);
      setView('lobby');
      fetchSession(id);
      socket.emit('join_session', id);

      const storedName = localStorage.getItem(`vibe_participant_${id}`);
      if (storedName) {
        setParticipantName(storedName);
      }

      socket.on('connect', () => {
        socket.emit('join_session', id);
      });
    }

    return () => {
      socket.off('connect');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (sessionId) {
      socket.on('questions_ready', () => {
        fetchSession(sessionId);
      });

      socket.on('participant_joined', () => {
        fetchSession(sessionId);
      });

      socket.on('answer_submitted', () => {
        fetchSession(sessionId);
      });

      socket.on('results_ready', (data) => {
        setResults(data.results);
        setView('results');
      });

      return () => {
        socket.emit('leave_session', sessionId);
        socket.off('questions_ready');
        socket.off('participant_joined');
        socket.off('answer_submitted');
        socket.off('results_ready');
      };
    }
  }, [sessionId]);

  const fetchSession = async (id) => {
    try {
      const res = await fetch(`/api/session/${id}`);
      const data = await res.json();
      setSessionData(data);
      if (data.status === 'complete' && data.results) {
        setResults(JSON.parse(data.results));
        setView('results');
      }
    } catch (err) {
      console.error('Failed to fetch session:', err);
    }
  };

  const createSession = async (config) => {
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setSessionId(data.id);
      setParticipantId(data.participantId);
      setParticipantName(config.hostName);
      setIsHost(true);
      setView('lobby');
      window.history.pushState({}, '', `/session/${data.id}`);
      localStorage.setItem(`vibe_participant_${data.id}`, config.hostName);
      socket.emit('join_session', data.id);
      fetchSession(data.id);
      return data;
    } catch (err) {
      console.error('Failed to create session:', err);
      throw err;
    }
  };

  const joinSession = async (id, name) => {
    try {
      const res = await fetch(`/api/session/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      setParticipantId(data.id);
      setParticipantName(name);
      setIsHost(false);
      setSessionData(data.session);
      localStorage.setItem(`vibe_participant_${id}`, name);
      socket.emit('join_session', id);
      return data;
    } catch (err) {
      console.error('Failed to join session:', err);
      throw err;
    }
  };

  const generateQuestions = async () => {
    const res = await fetch(`/api/session/${sessionId}/generate`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to start quiz');
    }
  };

  const submitQuiz = async (answers) => {
    try {
      const res = await fetch(`/api/session/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, answers })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      throw err;
    }
  };

  const goHome = () => {
    setView('landing');
    setSessionId(null);
    setParticipantId(null);
    setSessionData(null);
    setParticipantName('');
    setResults(null);
    window.history.pushState({}, '', '/');
  };

  const startQuiz = () => {
    setView('quiz');
  };

  const closeVoting = async () => {
    try {
      const res = await fetch(`/api/session/${sessionId}/close`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to close voting');
      }
      if (data.results) {
        setResults(data.results);
        setView('results');
      }
    } catch (err) {
      console.error('Failed to close voting:', err);
      throw err;
    }
  };

  switch (view) {
    case 'lobby':
      return (
        <SessionLobby
          sessionData={sessionData}
          participantId={participantId}
          participantName={participantName}
          isHost={isHost}
          onJoin={joinSession}
          onGenerate={generateQuestions}
          onStartQuiz={startQuiz}
          onViewResults={() => setView('results')}
          onCloseVoting={closeVoting}
        />
      );
    case 'quiz':
      return (
        <MovieQuiz
          onSubmit={submitQuiz}
          onComplete={() => fetchSession(sessionId).then(() => setView('lobby'))}
          onBack={() => setView('lobby')}
        />
      );
    case 'results':
      return (
        <Results
          sessionData={sessionData}
          results={results}
          participantName={participantName}
          onNewSession={goHome}
        />
      );
    default:
      return <Landing onCreate={createSession} />;
  }
}

export default App;
