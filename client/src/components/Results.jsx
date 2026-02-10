import React, { useState, useEffect } from 'react';

function Results({ sessionData, results, participantName, onNewSession }) {
  const [activeTab, setActiveTab] = useState('group');

  if (!results) {
    return (
      <div className="min-h-screen bg-vt-black flex flex-col px-6 py-8">
        {/* Skeleton Header */}
        <div className="mb-6">
          <div className="skeleton skeleton-text w-20 mb-2"></div>
          <div className="skeleton skeleton-title"></div>
        </div>

        {/* Skeleton Tabs */}
        <div className="flex gap-2 mb-6">
          <div className="skeleton w-16 h-10"></div>
          <div className="skeleton w-16 h-10"></div>
        </div>

        {/* Skeleton Summary */}
        <div className="mb-8">
          <div className="skeleton skeleton-text w-24 mb-3"></div>
          <div className="skeleton skeleton-text w-full"></div>
          <div className="skeleton skeleton-text w-3/4"></div>
        </div>

        {/* Skeleton Recommendations */}
        <div className="skeleton skeleton-text w-20 mb-3"></div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-title mb-2"></div>
              <div className="skeleton skeleton-text w-full"></div>
              <div className="skeleton skeleton-text w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { group_summary, recommendations, individual_writeups, update_reason } = results;
  const myWriteup = individual_writeups?.find(w => w.name === participantName);

  return (
    <div className="min-h-screen bg-vt-black flex flex-col px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <span className="text-vt-gray text-xs uppercase tracking-wider">{sessionData?.category}</span>
        <h1 className="text-xl text-vt-white mt-1">results</h1>
        {update_reason && (
          <p className="text-vt-gray text-xs mt-1">updated: {update_reason}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('group')}
          className={`py-2 px-4 text-sm border transition-all ${
            activeTab === 'group'
              ? 'border-vt-white bg-vt-white text-vt-black'
              : 'border-vt-darkgray text-vt-gray hover:border-vt-light'
          }`}
        >
          group
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`py-2 px-4 text-sm border transition-all ${
            activeTab === 'personal'
              ? 'border-vt-white bg-vt-white text-vt-black'
              : 'border-vt-darkgray text-vt-gray hover:border-vt-light'
          }`}
        >
          yours
        </button>
      </div>

      {/* Group Results */}
      {activeTab === 'group' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          {/* Group Summary */}
          <div className="mb-8">
            <h2 className="text-vt-white text-sm mb-3">group vibe</h2>
            <p className="text-vt-light leading-relaxed">{group_summary}</p>
          </div>

          {/* Recommendations */}
          <h2 className="text-vt-white text-sm mb-3">top picks</h2>
          <div className="flex flex-col gap-4 mb-8">
            {recommendations?.map((rec, idx) => (
              <div key={idx} className="result-card">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-vt-white font-medium">{rec.item}</span>
                    {rec.verified && (
                      <span className="text-xs text-green-500">verified</span>
                    )}
                  </div>
                  <span className="text-vt-gray text-xs">#{rec.rank}</span>
                </div>
                <p className="text-vt-gray text-sm mb-2">{rec.reason}</p>

                {/* Verified place details */}
                {rec.verified && (
                  <div className="mt-3 pt-3 border-t border-vt-darkgray">
                    {rec.address && (
                      <p className="text-vt-light text-xs mb-1">{rec.address}</p>
                    )}
                    {rec.hours && (
                      <p className="text-vt-gray text-xs mb-1">{rec.hours}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {rec.website && (
                        <a
                          href={rec.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-vt-light hover:text-vt-white underline"
                        >
                          website
                        </a>
                      )}
                      {rec.tel && (
                        <a
                          href={`tel:${rec.tel}`}
                          className="text-xs text-vt-light hover:text-vt-white underline"
                        >
                          {rec.tel}
                        </a>
                      )}
                      {(rec.lat && rec.lon) && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.name || rec.item)}${rec.address ? '+' + encodeURIComponent(rec.address) : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-vt-light hover:text-vt-white underline"
                        >
                          open in maps
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* All Writeups Preview */}
          <h2 className="text-vt-white text-sm mb-3">everyone</h2>
          <div className="flex flex-col gap-3">
            {individual_writeups?.map((writeup, idx) => (
              <div key={idx} className="writeup-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-vt-white font-medium">{writeup.name}</span>
                  {writeup.name === participantName && (
                    <span className="text-vt-gray text-xs">(you)</span>
                  )}
                </div>
                <p className="text-vt-gray text-sm">{writeup.taste_summary}</p>
                {writeup.most_similar_to && (
                  <p className="text-vt-gray text-xs mt-2">
                    closest match: {writeup.most_similar_to}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Results */}
      {activeTab === 'personal' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          {myWriteup ? (
            <>
              {/* Personal Summary */}
              <div className="mb-8">
                <h2 className="text-vt-white text-sm mb-3">your vibe</h2>
                <p className="text-vt-light leading-relaxed">{myWriteup.taste_summary}</p>
              </div>

              {/* Personal Recommendations */}
              <h2 className="text-vt-white text-sm mb-3">for you</h2>
              <div className="flex flex-col gap-4 mb-8">
                {myWriteup.personal_recs?.map((rec, idx) => (
                  <div key={idx} className="result-card">
                    <p className="text-vt-white">{rec}</p>
                  </div>
                ))}
              </div>

              {/* Similarity */}
              {myWriteup.most_similar_to && (
                <div>
                  <h2 className="text-vt-white text-sm mb-3">your people</h2>
                  <div className="result-card">
                    <p className="text-vt-light">
                      you vibe most with <span className="text-vt-white font-medium">{myWriteup.most_similar_to}</span>
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-vt-gray">writeup not found</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-vt-darkgray">
        <button
          onClick={onNewSession}
          className="w-full py-3 bg-vt-white text-vt-black font-medium"
        >
          new session
        </button>
      </div>
    </div>
  );
}

export default Results;