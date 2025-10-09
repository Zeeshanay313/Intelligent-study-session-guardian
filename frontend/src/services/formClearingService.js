// Nuclear form clearing service to override all browser autofill
class FormClearingService {
  static clearAllForms() {
    try {
      // Clear all email and password inputs
      const selectors = [
        'input[type="email"]',
        'input[type="password"]',
        'input[name*="email"]',
        'input[name*="password"]',
        'input[id*="email"]',
        'input[id*="password"]',
        'input[autocomplete="email"]',
        'input[autocomplete="current-password"]',
        'input[autocomplete="new-password"]'
      ];

      selectors.forEach(selector => {
        const inputs = document.querySelectorAll(selector);
        inputs.forEach(input => {
          // Multiple clearing approaches
          input.value = '';
          input.setAttribute('value', '');
          input.removeAttribute('value');
          input.defaultValue = '';
          
          // Trigger all possible events
          ['input', 'change', 'blur', 'focus'].forEach(eventType => {
            const event = new Event(eventType, { bubbles: true });
            input.dispatchEvent(event);
          });
        });
      });

      // Clear storage
      this.clearStorage();
      
      // Clear form data
      this.clearFormData();
      
    } catch (error) {
      console.log('Form clearing error:', error);
    }
  }

  static clearStorage() {
    try {
      const keysToRemove = [
        'loginEmail',
        'loginPassword',
        'email',
        'password',
        'userEmail',
        'userPassword',
        'formEmail',
        'formPassword'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.log('Storage clearing error:', error);
    }
  }

  static clearFormData() {
    try {
      // Clear any FormData instances
      const formData = new FormData();
      formData.delete('email');
      formData.delete('password');
    } catch (error) {
      console.log('FormData clearing error:', error);
    }
  }

  static smartClearing() {
    // Clear immediately
    this.clearAllForms();
    
    // Set up gentle clearing intervals only
    const intervals = [100, 500];
    
    intervals.forEach(delay => {
      setTimeout(() => {
        // Only clear if inputs appear to be autofilled (not user-entered)
        this.clearIfAutofilled();
      }, delay);
    });
  }

  static clearIfAutofilled() {
    try {
      const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
      inputs.forEach(input => {
        // Only clear if the input has a value but React state doesn't
        // This indicates browser autofill
        if (input.value && !input.matches(':focus')) {
          // Check if this looks like autofill (has value but user isn't typing)
          const reactStateEmpty = !input.getAttribute('data-has-state-value');
          if (reactStateEmpty) {
            input.value = '';
            input.setAttribute('value', '');
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
          }
        }
      });
    } catch (error) {
      console.log('Smart clearing error:', error);
    }
  }

  static onPageEvents() {
    // Clear only on page load events, not focus/blur which interfere with typing
    const events = [
      'load', 
      'DOMContentLoaded',
      'pageshow'
    ];

    events.forEach(event => {
      window.addEventListener(event, () => {
        setTimeout(() => this.clearAllForms(), 10);
      });
    });
  }
}

export default FormClearingService;