import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { createUser } from '../lib/firestore';
import { useToast } from '../hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user.email);
      
      // Create user in Firestore if doesn't exist
      try {
        await createUser(result.user, {
          firstName: result.user.displayName?.split(' ')[0] || 'User',
          lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
        });
      } catch (createUserError) {
        console.log('User may already exist:', createUserError);
      }
      
      toast({
        title: "Welcome!",
        description: "You've been signed in with Google successfully.",
      });
      
      onClose();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google Sign-In is not enabled. Please contact support.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up blocked. Please allow pop-ups and try again.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google Sign-In.';
      }
      
      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <SiGoogle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Sign In with Google</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-muted-foreground mb-4">Sign in with your Google account to access premium educational content.</p>
            </div>
            
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-google-signin-modal"
            >
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <SiGoogle className="w-5 h-5" />
              )}
              <span className="font-medium">
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};