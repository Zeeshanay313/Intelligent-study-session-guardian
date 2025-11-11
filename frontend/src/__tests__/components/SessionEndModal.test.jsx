import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionEndModal from '../../components/timer/SessionEndModal';
import * as sessionsApi from '../../services/sessionsApi';

// Mock the API
jest.mock('../../services/sessionsApi');

// Mock Audio
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  volume: 0.5
}));

describe('SessionEndModal Component', () => {
  const mockSessionData = {
    durationSeconds: 1500,
    presetName: 'Pomodoro',
    todayCount: 3
  };

  const mockSuggestion = {
    suggestedBreakMinutes: 8,
    confidence: 'high',
    reason: 'Based on your last 5 sessions',
    streak: 3
  };

  const mockOnClose = jest.fn();
  const mockOnAcceptSuggestion = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    sessionsApi.getSuggestion.mockResolvedValue(mockSuggestion);
  });

  it('should not render when closed', () => {
    const { container } = render(
      <SessionEndModal
        isOpen={false}
        onClose={mockOnClose}
        sessionData={mockSessionData}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render session summary when open', async () => {
    render(
      <SessionEndModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        playAudio={false}
      />
    );

    expect(screen.getByText('🎉 Session Complete!')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('Pomodoro')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('8 minutes')).toBeInTheDocument();
    });
  });

  it('should display suggestion with confidence badge', async () => {
    render(
      <SessionEndModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        playAudio={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('high confidence')).toBeInTheDocument();
      expect(screen.getByText('Based on your last 5 sessions')).toBeInTheDocument();
    });
  });

  it('should show streak if available', async () => {
    render(
      <SessionEndModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        playAudio={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('🔥 3')).toBeInTheDocument();
    });
  });

  it('should call onAcceptSuggestion when button clicked', async () => {
    render(
      <SessionEndModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        playAudio={false}
        onAcceptSuggestion={mockOnAcceptSuggestion}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Start.*-Minute Break/)).toBeInTheDocument();
    });

    const acceptButton = screen.getByText(/Start.*-Minute Break/);
    acceptButton.click();

    expect(mockOnAcceptSuggestion).toHaveBeenCalledWith(8);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should attempt to play audio when playAudio is true', () => {
    render(
      <SessionEndModal
        isOpen={true}
        onClose={mockOnClose}
        sessionData={mockSessionData}
        playAudio={true}
      />
    );

    expect(global.Audio).toHaveBeenCalledWith('/assets/session-end.mp3');
  });
});
