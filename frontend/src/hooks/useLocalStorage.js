import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'system');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (themeValue) => {
      if (themeValue === 'dark' || 
          (themeValue === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const setThemeValue = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  return { theme, toggleTheme, setTheme: setThemeValue };
};

export const useFontSize = () => {
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 'medium');

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing font size classes
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    
    // Apply new font size
    switch (fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
    }
  }, [fontSize]);

  const setFontSizeValue = (newSize) => {
    if (['small', 'medium', 'large'].includes(newSize)) {
      setFontSize(newSize);
    }
  };

  return { fontSize, setFontSize: setFontSizeValue };
};

export const usePreferences = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const [preferences, setPreferences] = useLocalStorage('preferences', {
    language: 'en',
    notifications: {
      browser: true,
      email: false,
      sound: true
    },
    privacy: {
      analytics: false,
      marketing: false
    }
  });

  const updatePreferences = (newPreferences) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };

  return {
    theme,
    fontSize,
    preferences,
    toggleTheme,
    setTheme,
    setFontSize,
    updatePreferences
  };
};