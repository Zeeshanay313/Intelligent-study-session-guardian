import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PresetDropdown from '../../components/timer/PresetDropdown';
import * as presetsApi from '../../services/presetsApi';

// Mock the API
jest.mock('../../services/presetsApi');

describe('PresetDropdown Component', () => {
  const mockPresets = [
    {
      _id: '1',
      name: 'Pomodoro',
      workDuration: 25,
      breakDuration: 5,
      isDefault: true
    },
    {
      _id: '2',
      name: 'Deep Work',
      workDuration: 90,
      breakDuration: 15,
      isDefault: false
    }
  ];

  const mockOnPresetChange = jest.fn();
  const mockOnDurationChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    presetsApi.getPresets.mockResolvedValue(mockPresets);
  });

  it('should render and load presets', async () => {
    render(
      <PresetDropdown
        selectedPreset={null}
        onPresetChange={mockOnPresetChange}
        onDurationChange={mockOnDurationChange}
      />
    );

    expect(screen.getByText('Loading presets...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Pomodoro/)).toBeInTheDocument();
    });

    expect(presetsApi.getPresets).toHaveBeenCalledTimes(1);
  });

  it('should call onPresetChange when preset is selected', async () => {
    render(
      <PresetDropdown
        selectedPreset={null}
        onPresetChange={mockOnPresetChange}
        onDurationChange={mockOnDurationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Pomodoro/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(mockOnPresetChange).toHaveBeenCalledWith(mockPresets[0]);
      expect(mockOnDurationChange).toHaveBeenCalledWith(25);
    });
  });

  it('should show edit and delete buttons when preset is selected', async () => {
    render(
      <PresetDropdown
        selectedPreset={mockPresets[0]}
        onPresetChange={mockOnPresetChange}
        onDurationChange={mockOnDurationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('should open modal when "Add Custom" is selected', async () => {
    render(
      <PresetDropdown
        selectedPreset={null}
        onPresetChange={mockOnPresetChange}
        onDurationChange={mockOnDurationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Pomodoro/)).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'custom' } });

    await waitFor(() => {
      expect(screen.getByText('Create Preset')).toBeInTheDocument();
    });
  });
});
