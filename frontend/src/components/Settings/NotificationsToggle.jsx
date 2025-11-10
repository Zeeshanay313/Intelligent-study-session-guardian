import React, { useState, useEffect } from 'react';

const NotificationsToggle = () => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [visualEnabled, setVisualEnabled] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const storedAudio = localStorage.getItem('notifications_audio');
    const storedVisual = localStorage.getItem('notifications_visual');

    if (storedAudio !== null) {
      setAudioEnabled(storedAudio === 'true');
    }
    if (storedVisual !== null) {
      setVisualEnabled(storedVisual === 'true');
    }
  }, []);

  const handleAudioToggle = (enabled) => {
    setAudioEnabled(enabled);
    localStorage.setItem('notifications_audio', enabled.toString());
  };

  const handleVisualToggle = (enabled) => {
    setVisualEnabled(enabled);
    localStorage.setItem('notifications_visual', enabled.toString());
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Session End Notifications</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">🔊 Audio Alert</div>
            <div className="text-sm text-gray-500">Play sound when session completes</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => handleAudioToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">👁️ Visual Modal</div>
            <div className="text-sm text-gray-500">Show completion modal with summary</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={visualEnabled}
              onChange={(e) => handleVisualToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default NotificationsToggle;
