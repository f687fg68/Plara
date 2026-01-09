/**
 * Polar.sh Checkout Integration Module
 * Handles payment flow with Polar embedded checkout
 */

export class PolarCheckout {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api';
    this.theme = options.theme || 'light'; // 'light' or 'dark'
    this.onSuccess = options.onSuccess || this.defaultSuccessHandler;
    this.onError = options.onError || this.defaultErrorHandler;
    this.onCancel = options.onCancel || this.defaultCancelHandler;
    this.activeCheckout = null;
    this.checkoutWindow = null;
  }

  /**
   * Fetch available products from backend
   */
  async getProducts() {
    try {
      const response = await fetch(`${this.apiBase}/products`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      this.onError(error);
      throw error;
    }
  }

  /**
   * Create checkout session and redirect to payment
   */
  async checkout(productId, options = {}) {
    try {
      // Show loading state
      this.showLoadingState(options.buttonElement);

      // Create checkout session via backend
      const response = await fetch(`${this.apiBase}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          email: options.email || null,
          customer_name: options.customerName || null,
          metadata: options.metadata || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create checkout');
      }

      const data = await response.json();
      
      // Store checkout ID for later verification
      sessionStorage.setItem('polar_checkout_id', data.checkout_id);
      sessionStorage.setItem('polar_product_id', productId);

      // Redirect to Polar checkout
      window.location.href = data.checkout_url;

    } catch (error) {
      console.error('Checkout error:', error);
      this.hideLoadingState(options.buttonElement);
      this.onError(error);
      throw error;
    }
  }

  /**
   * Open checkout in a popup window (alternative to redirect)
   */
  async checkoutPopup(productId, options = {}) {
    try {
      const response = await fetch(`${this.apiBase}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          email: options.email || null,
          customer_name: options.customerName || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }

      const data = await response.json();

      // Open in popup
      const width = 600;
      const height = 800;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;

      this.checkoutWindow = window.open(
        data.checkout_url,
        'polar_checkout',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // Poll for window close
      const pollTimer = setInterval(() => {
        if (this.checkoutWindow && this.checkoutWindow.closed) {
          clearInterval(pollTimer);
          this.handlePopupClose();
        }
      }, 500);

    } catch (error) {
      console.error('Checkout popup error:', error);
      this.onError(error);
      throw error;
    }
  }

  /**
   * Verify checkout completion
   */
  async verifyCheckout(checkoutId) {
    try {
      const response = await fetch(`${this.apiBase}/checkout/${checkoutId}`);
      
      if (!response.ok) {
        throw new Error('Failed to verify checkout');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(email) {
    try {
      const response = await fetch(`${this.apiBase}/orders/${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Format price for display
   */
  formatPrice(amount, currency = 'USD', interval = null) {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount / 100);

    if (interval) {
      const intervalText = {
        'month': '/mo',
        'year': '/yr',
        'week': '/wk',
        'day': '/day'
      }[interval] || `/${interval}`;
      
      return `${formattedAmount}${intervalText}`;
    }

    return formattedAmount;
  }

  /**
   * Render product cards with buy buttons
   */
  renderProducts(container, products) {
    if (!container) {
      console.error('Container element not found');
      return;
    }

    container.innerHTML = products.map(product => `
      <div class="product-card input-box" data-product-id="${product.id}">
        <div class="product-header">
          <h3 class="product-name">${this.escapeHtml(product.name)}</h3>
          ${product.is_recurring ? '<span class="badge-recurring">Subscription</span>' : ''}
        </div>
        
        ${product.description ? `
          <p class="product-description">${this.escapeHtml(product.description)}</p>
        ` : ''}
        
        <div class="product-price">
          ${this.formatPrice(product.price_amount, product.price_currency, product.interval)}
        </div>
        
        <button 
          class="btn-signin product-buy-btn" 
          data-product-id="${product.id}"
          data-price="${product.price_amount}"
          data-currency="${product.price_currency}">
          Buy Now
        </button>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.product-buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.dataset.productId;
        this.checkout(productId, { buttonElement: e.target });
      });
    });
  }

  /**
   * Show loading state on button
   */
  showLoadingState(buttonElement) {
    if (buttonElement) {
      buttonElement.disabled = true;
      buttonElement.dataset.originalText = buttonElement.textContent;
      buttonElement.innerHTML = '<span class="spinner"></span> Processing...';
    }
  }

  /**
   * Hide loading state on button
   */
  hideLoadingState(buttonElement) {
    if (buttonElement && buttonElement.dataset.originalText) {
      buttonElement.disabled = false;
      buttonElement.textContent = buttonElement.dataset.originalText;
    }
  }

  /**
   * Handle popup close
   */
  handlePopupClose() {
    // Check if checkout was completed
    const checkoutId = sessionStorage.getItem('polar_checkout_id');
    if (checkoutId) {
      this.verifyCheckout(checkoutId).then(data => {
        if (data.status === 'confirmed') {
          this.onSuccess(data);
        } else {
          this.onCancel();
        }
      });
    }
  }

  /**
   * Default success handler
   */
  defaultSuccessHandler(data) {
    console.log('✅ Payment successful:', data);
    alert('Thank you for your purchase!');
  }

  /**
   * Default error handler
   */
  defaultErrorHandler(error) {
    console.error('❌ Payment error:', error);
    alert('Payment failed. Please try again.');
  }

  /**
   * Default cancel handler
   */
  defaultCancelHandler() {
    console.log('Payment cancelled by user');
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Check if we're on success page
   */
  static isSuccessPage() {
    const params = new URLSearchParams(window.location.search);
    return params.has('checkout_id');
  }

  /**
   * Get checkout ID from URL
   */
  static getCheckoutIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('checkout_id');
  }
}

// Auto-export for use in HTML
if (typeof window !== 'undefined') {
  window.PolarCheckout = PolarCheckout;
}
