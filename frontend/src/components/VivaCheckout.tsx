import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface VivaCheckoutProps {
  onSuccess: (data: { orderCode: string; token: string }) => void;
  onError: (error: any) => void;
}

const VivaCheckout: React.FC<VivaCheckoutProps> = ({ onSuccess, onError }) => {
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vivaForm, setVivaForm] = useState<any>(null);

  // Create payment order
  const createOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://drugalert.gr/api'}/auth/subscription/checkout`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setOrderCode(response.data.order_code);
      return response.data.order_code;
    } catch (error) {
      onError(error);
      setLoading(false);
    }
  };

  // Initialize Viva Native Checkout
  useEffect(() => {
    if (!orderCode) return;

    // Load Viva Native SDK if not already loaded
    if (!window.VivaPayments) {
      const script = document.createElement('script');
      script.src = 'https://www.vivapayments.com/web/checkout/v2/js';
      script.async = true;
      script.onload = () => initializeVivaForm();
      document.body.appendChild(script);
    } else {
      initializeVivaForm();
    }
  }, [orderCode]);

  const initializeVivaForm = () => {
    if (!window.VivaPayments || !orderCode) return;

    // Initialize the payment form
    const form = window.VivaPayments.forms.setup({
      authToken: 'Bearer ' + orderCode, // Order code acts as auth token
      baseURL: process.env.NEXT_PUBLIC_VIVA_MODE === 'production' ? 'https://www.vivapayments.com' : 'https://demo.vivapayments.com',
      cardTokenHandler: (response) => {
        // This is called when payment is successful
        handlePaymentSuccess(response);
      },
      installments: 0,
      paymentMethod: 'card',
      customerEmail: '', // Will be pre-filled from order
      styles: {
        // Custom styling to match your site
        base: {
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });

    // Mount the form elements
    const cardNumber = form.create('cardNumber');
    cardNumber.mount('#card-number');

    const cardExpiry = form.create('cardExpiry');
    cardExpiry.mount('#card-expiry');

    const cardCvc = form.create('cardCvc');
    cardCvc.mount('#card-cvc');

    setVivaForm(form);
    setLoading(false);
  };

  const handlePaymentSuccess = async (response) => {
    // Payment was successful
    // The actual subscription activation happens via webhook
    onSuccess({
      orderCode: orderCode,
      token: response.chargeToken
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vivaForm) return;

    setLoading(true);
    
    // Create token and process payment
    vivaForm.createToken((result) => {
      if (result.error) {
        onError(result.error);
        setLoading(false);
      }
      // Success is handled by cardTokenHandler above
    });
  };

  return (
    <div className="viva-checkout-container">
      <h2>Ετήσια Συνδρομή - €14.99</h2>
      
      {!orderCode ? (
        <button 
          onClick={createOrder} 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Προετοιμασία...' : 'Έναρξη Πληρωμής'}
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label htmlFor="card-number">Αριθμός Κάρτας</label>
            <div id="card-number" className="viva-input"></div>
          </div>

          <div className="form-row">
            <div className="form-group col-6">
              <label htmlFor="card-expiry">Ημερομηνία Λήξης</label>
              <div id="card-expiry" className="viva-input"></div>
            </div>

            <div className="form-group col-6">
              <label htmlFor="card-cvc">CVV</label>
              <div id="card-cvc" className="viva-input"></div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-success btn-block"
          >
            {loading ? 'Επεξεργασία...' : 'Πληρωμή €14.99'}
          </button>

          <div className="security-info">
            <small className="text-muted">
              <i className="fas fa-lock"></i> Η πληρωμή σας είναι ασφαλής και κρυπτογραφημένη
            </small>
          </div>
        </form>
      )}

      <style jsx>{`
        .viva-checkout-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }

        .payment-form {
          margin-top: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: flex;
          gap: 15px;
        }

        .viva-input {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          background: white;
          min-height: 45px;
        }

        .viva-input.viva-invalid {
          border-color: #fa755a;
        }

        .viva-input.viva-complete {
          border-color: #28a745;
        }

        .security-info {
          text-align: center;
          margin-top: 20px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-success {
          background: #28a745;
          color: white;
          width: 100%;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
};

export default VivaCheckout;
