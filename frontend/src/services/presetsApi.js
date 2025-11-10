import api from './api';

// Storage adapter for offline support
const storageKey = 'focus_timer_presets';

const getFromStorage = () => {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading presets from storage:', error);
    return [];
  }
};

const saveToStorage = (presets) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(presets));
  } catch (error) {
    console.error('Error saving presets to storage:', error);
  }
};

/**
 * Get all presets for current user
 */
export const getPresets = async () => {
  try {
    const response = await api.get('/presets');
    
    if (response.data.success) {
      // Cache to localStorage
      saveToStorage(response.data.data);
      return response.data.data;
    }
    
    throw new Error('Failed to fetch presets');
  } catch (error) {
    console.error('Error fetching presets, using cached data:', error);
    // Fallback to localStorage
    return getFromStorage();
  }
};

/**
 * Create a new preset
 */
export const createPreset = async (presetData) => {
  try {
    const response = await api.post('/presets', presetData);
    
    if (response.data.success) {
      // Update cache
      const cached = getFromStorage();
      cached.push(response.data.data);
      saveToStorage(cached);
      
      return response.data.data;
    }
    
    throw new Error('Failed to create preset');
  } catch (error) {
    console.error('Error creating preset:', error);
    
    // Offline mode: create locally with temp ID
    if (!navigator.onLine) {
      const tempPreset = {
        ...presetData,
        _id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
        userId: 'offline'
      };
      
      const cached = getFromStorage();
      cached.push(tempPreset);
      saveToStorage(cached);
      
      return tempPreset;
    }
    
    throw error;
  }
};

/**
 * Update an existing preset
 */
export const updatePreset = async (id, updates) => {
  try {
    const response = await api.put(`/presets/${id}`, updates);
    
    if (response.data.success) {
      // Update cache
      const cached = getFromStorage();
      const index = cached.findIndex((p) => p._id === id);
      if (index !== -1) {
        cached[index] = { ...cached[index], ...updates };
        saveToStorage(cached);
      }
      
      return response.data.data;
    }
    
    throw new Error('Failed to update preset');
  } catch (error) {
    console.error('Error updating preset:', error);
    
    // Offline mode: update locally
    if (!navigator.onLine) {
      const cached = getFromStorage();
      const index = cached.findIndex((p) => p._id === id);
      if (index !== -1) {
        cached[index] = { ...cached[index], ...updates };
        saveToStorage(cached);
        return cached[index];
      }
    }
    
    throw error;
  }
};

/**
 * Delete a preset
 */
export const deletePreset = async (id) => {
  try {
    const response = await api.delete(`/presets/${id}`);
    
    if (response.data.success) {
      // Update cache
      const cached = getFromStorage();
      const filtered = cached.filter((p) => p._id !== id);
      saveToStorage(filtered);
      
      return true;
    }
    
    throw new Error('Failed to delete preset');
  } catch (error) {
    console.error('Error deleting preset:', error);
    
    // Offline mode: delete locally
    if (!navigator.onLine) {
      const cached = getFromStorage();
      const filtered = cached.filter((p) => p._id !== id);
      saveToStorage(filtered);
      return true;
    }
    
    throw error;
  }
};

export default {
  getPresets,
  createPreset,
  updatePreset,
  deletePreset
};
