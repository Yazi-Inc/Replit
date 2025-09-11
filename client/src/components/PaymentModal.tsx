import React, { useState } from 'react';
import { X, CreditCard, Shield, Clock, Download, Smartphone, Monitor } from 'lucide-react';
import { FirestoreVideo } from '../lib/firestore';

const res = await fetch("/config");
const config = await res.json();



interface PaymentModalProps {
  video: FirestoreVideo;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (reference: string) => void;
  userEmail: string;
  userName: string;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  video,
  isOpen,
  onClose,
  onPaymentSuccess,
  userEmail,
  userName
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePayment = () => {
    setIsProcessing(true);

    const paystackPublicKey = config.paystackPublicKey;
    
    if (!paystackPublicKey) {
      console.error('Paystack public key not found');
      setIsProcessing(false);
      return;
    }
    
    if (!window.PaystackPop) {
      console.error('Paystack script not loaded');
      setIsProcessing(false);
      return;
    }

    const paystackInstance = new window.PaystackPop();

    paystackInstance.newTransaction({
      key: paystackPublicKey,
      email: userEmail,
      amount: video.price, // Amount already in pesewas
      currency: 'GHS',
      firstName: userName.split(' ')[0] || 'User',
      lastName: userName.split(' ')[1] || '',
      metadata: {
        videoId: video.id,
        videoTitle: video.title,
        platform: 'GIS Video Platform'
      },
      onSuccess: (transaction: any) => {
        console.log('Payment successful:', transaction);
        onPaymentSuccess(transaction.reference);
        setIsProcessing(false);
      },
      onCancel: () => {
        console.log('Payment cancelled');
        setIsProcessing(false);
      },
      onError: (error: any) => {
        console.error('Payment error:', error);
        setIsProcessing(false);
      }
    });
  };

  const formatPrice = (priceInPesewas: number) => {
    return (priceInPesewas / 100).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="modal-payment">
      <div className="bg-card rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-bold">Complete Payment</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video Info */}
          <div className="flex space-x-3">
            {video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-16 h-12 object-cover rounded-lg"
                data-testid="img-payment-video-thumbnail"
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium" data-testid="text-payment-video-title">{video.title}</h4>
              <p className="text-sm text-muted-foreground" data-testid="text-payment-video-duration">
                {video.duration} minutes • {video.level}
              </p>
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center py-4 bg-muted rounded-lg">
            <div className="bg-primary/10 rounded-full p-3 inline-block mb-3">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">24-Hour Access</p>
            <p className="text-3xl font-bold text-primary" data-testid="text-payment-amount">
              GH₵{formatPrice(video.price)}
            </p>
            <p className="text-sm text-muted-foreground">One-time payment</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
              <span>24 hours unlimited viewing</span>
            </div>
            <div className="flex items-center text-sm">
              <Monitor className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
              <span>HD quality streaming</span>
            </div>
            <div className="flex items-center text-sm">
              <Smartphone className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
              <span>Multiple device access</span>
            </div>
            <div className="flex items-center text-sm">
              <Monitor className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
              <span>Mobile and desktop access</span>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold hover:bg-primary/90 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            data-testid="button-pay-with-paystack"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </span>
            ) : (
              <>
                <CreditCard className="inline w-5 h-5 mr-2" />
                Pay with Paystack
              </>
            )}
          </button>

          {/* Security Notice */}
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            <Shield className="w-4 h-4 mr-1" />
            <span>Secure payment powered by <strong>Paystack</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
