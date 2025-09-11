import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUser, createUser, getVideo, createPayment, createVideoAccess, updateUserStats, checkVideoAccess, subscribeToVideoAccess, FirestoreUser, FirestoreVideo, FirestoreVideoAccess } from '../lib/firestore';
import { VideoPlayer } from '../components/VideoPlayer';
import { PaymentModal } from '../components/PaymentModal';
import { AuthModal } from '../components/AuthModal';
import { UserDashboard } from '../components/UserDashboard';
import { useToast } from '../hooks/use-toast';
import { LogOut, User, Youtube, Facebook, Twitter } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';

const SAMPLE_VIDEO: FirestoreVideo = {
  id: 'gis_documentary_001',
  title: 'Ghana International School Documentary',
  description: 'An exclusive documentary showcasing the rich history and excellence of Ghana International School. Experience the journey of one of Ghana\'s premier educational institutions.',
  duration: 3275, // 54 minutes 35 seconds (54:35 total)
  price: 10000, // GH₵100.00 in pesewas
  thumbnailUrl: 'https://i0.wp.com/gis.edu.gh/wp-content/uploads/2025/08/Header_1_green_logo_gis_at_70-1.png?resize=1920%2C1080&ssl=1',
  videoUrl: 'https://www.dropbox.com/scl/fi/kocss2x7f20580aw2b826/Ghana-International-School-Doc-Final.mov?rlkey=jp3cfhvbh0ujzv06zedr4r8ux&e=1&st=39c18x2e&dl=1',
  level: 'All Levels',
  subject: 'School Documentary',
  createdAt: new Date() as any,
};

const RELATED_VIDEOS = [
  {
    id: 'gis_virtual_tour',
    title: 'GIS Virtual Campus Tour',
    duration: '23 min',
    //price: 'GH₵35.00',
    thumbnail: 'https://i0.wp.com/gis.edu.gh/wp-content/uploads/2024/09/IMG_9550-1-scaled.jpg?resize=120%2C80&ssl=1',
    videoUrl: 'https://youtu.be/z7HD5iI9H9k?si=b_NPLE91uD5TdCnf',
  },
  {
    id: 'gis_graduation',
    title: 'GIS Graduation Ceremony 2024',
    duration: '3 min',
    //price: 'GH₵75.00',
    thumbnail: 'https://i0.wp.com/gis.edu.gh/wp-content/uploads/2023/04/IMG_1964-scaled.jpg?resize=120%2C80&ssl=1',
    videoUrl: 'https://youtu.be/-izTfYJKhbc?si=L8JnZd87A_mVfFRC',
  },
  {
    id: 'gis_70th_celebration',
    title: 'GIS 70th Anniversary Celebration',
    duration: '2 hr 53 min',
    //price: 'GH₵60.00',
    thumbnail: 'https://i0.wp.com/gis.edu.gh/wp-content/uploads/2025/08/Header_1_green_logo_gis_at_70-1.png?resize=120%2C80&ssl=1',
    videoUrl: 'https://www.youtube.com/live/ru_T60H6MwE?si=q7eVK7pyz1oxhOhp',
  },
];

export default function Home() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null);
  const [videoAccess, setVideoAccess] = useState<FirestoreVideoAccess | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          let userData = await getUser(firebaseUser.uid);
          
          if (!userData) {
            // Create user in Firestore if doesn't exist
            userData = await createUser(firebaseUser, {
              firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
              lastName: firebaseUser.displayName?.split(' ')[1] || '',
            }) as FirestoreUser;
          }
          
          setFirestoreUser(userData);
          
          // Check video access
          const access = await checkVideoAccess(firebaseUser.uid, SAMPLE_VIDEO.id);
          setVideoAccess(access);
          
        } catch (error) {
          console.error('Error loading user data:', error);
          toast({
            title: "Error",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setFirestoreUser(null);
        setVideoAccess(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (user) {
      // Subscribe to real-time video access updates
      unsubscribe = subscribeToVideoAccess(user.uid, SAMPLE_VIDEO.id, (access) => {
        setVideoAccess(access);
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentRequest = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (paystackReference: string) => {
    if (!user || !firestoreUser) return;

    try {
      // First verify payment with backend
      const verifyResponse = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference: paystackReference }),
      });

      const verificationResult = await verifyResponse.json();
      
      if (!verificationResult.success) {
        throw new Error(verificationResult.message || 'Payment verification failed');
      }

      // Create payment record with verified status
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      const payment = await createPayment({
        userId: user.uid,
        videoId: SAMPLE_VIDEO.id,
        amount: SAMPLE_VIDEO.price,
        currency: 'GHS',
        paystackReference,
        status: 'successful',
        accessExpiresAt: expiresAt as any,
      });

      // Create video access
      await createVideoAccess({
        userId: user.uid,
        videoId: SAMPLE_VIDEO.id,
        paymentId: payment.id,
        isActive: true,
        expiresAt: expiresAt as any,
      });

      // Update user statistics
      await updateUserStats(user.uid, SAMPLE_VIDEO.price, 1);

      // Refresh user data to update dashboard
      const updatedUser = await getUser(user.uid);
      if (updatedUser) {
        setFirestoreUser(updatedUser);
      }

      setPaymentModalOpen(false);
      
      toast({
        title: "Payment Successful!",
        description: "You now have 24-hour access to this video.",
      });

    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Payment verification failed. Please contact support.",
        variant: "destructive",
      });
      setPaymentModalOpen(false);
    }
  };

  const getUserDisplayId = () => {
    if (user) {
      return `gis_${user.uid.slice(0, 8)}`;
    }
    return 'guest-user';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="https://i0.wp.com/gis.edu.gh/wp-content/uploads/2025/08/Header_1_green_logo_gis_at_70-1.png?resize=120%2C120&ssl=1" 
                alt="GIS at 70 Logo" 
                className="h-12 w-12"
                data-testid="img-gis-logo"
              />
              <div>
                <h1 className="text-xl font-bold text-primary">GIS Video Platform</h1>
                <p className="text-sm text-muted-foreground">Premium Educational Content</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-profile">
                    <User className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-sign-out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center"
                  data-testid="button-google-signin"
                >
                  <SiGoogle className="w-4 h-4 mr-2" />
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Unlock Premium Educational Content
          </h2>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get 24-hour access to exclusive educational videos with a single payment. Learn from the best, anytime, anywhere.
          </p>
        </div>

        {/* Video and Sidebar */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <VideoPlayer
              video={SAMPLE_VIDEO}
              access={videoAccess}
              onPaymentRequested={handlePaymentRequest}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Card */}
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <div className="text-center mb-6">
                <div className="bg-primary/10 rounded-full p-4 inline-block mb-4">
                  <span className="text-2xl">🎥</span>
                </div>
                <h4 className="text-xl font-bold mb-2">24-Hour Access</h4>
                <p className="text-3xl font-bold text-primary">GH₵{(SAMPLE_VIDEO.price / 100).toLocaleString()}</p>
                <p className="text-muted-foreground">One-time payment</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm">
                  <span className="text-primary mr-2">✓</span>
                  <span>24 hours unlimited viewing</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-primary mr-2">✓</span>
                  <span>HD quality streaming</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-primary mr-2">✓</span>
                  <span>Multiple device access</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-primary mr-2">✓</span>
                  <span>Mobile and desktop access</span>
                </div>
              </div>

              {videoAccess && videoAccess.expiresAt.toMillis() > Date.now() ? (
                <div className="w-full bg-muted text-muted-foreground py-3 rounded-lg font-bold text-center">
                  ✓ Access Granted - Expires {new Date(videoAccess.expiresAt.toMillis()).toLocaleDateString()}
                </div>
              ) : (
                <button
                  onClick={handlePaymentRequest}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-all transform hover:scale-105"
                  data-testid="button-pay-now"
                >
                  Pay with Paystack
                </button>
              )}

              <p className="text-xs text-muted-foreground text-center mt-3">
                Secure payment powered by <strong>Paystack</strong>
              </p>
            </div>

            {/* Related Videos */}
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <h4 className="font-bold mb-4">You might also like</h4>
              <div className="space-y-3">
                {RELATED_VIDEOS.map((video) => (
                  <div
                    key={video.id}
                    className="flex space-x-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    data-testid={`related-video-${video.id}`}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                    <div className="flex-1">
                      <a href={video.videoUrl}>
                        <p className="text-sm font-medium">{video.title}</p>
                      </a>
                      <p className="text-xs text-muted-foreground">{video.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Dashboard */}
        {user && firestoreUser && (
          <UserDashboard user={firestoreUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="https://i0.wp.com/gis.edu.gh/wp-content/uploads/2025/08/Header_1_green_logo_gis_at_70-1.png?resize=120%2C120&ssl=1" 
                  alt="GIS Logo" 
                  className="h-12 w-12"
                />
                <div>
                  <h4 className="font-bold text-lg">Ghana International School</h4>
                  <p className="text-muted-foreground">Video Platform</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Premium educational content from Ghana's leading international school. 
                Quality education accessible anytime, anywhere.
              </p>
              <div className="flex space-x-3">
                <a href="https://gis.edu.gh" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://gis.edu.gh" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://www.youtube.com/channel/UCZEh6DGL5NDWRgg7gkJKrwA/videos" className="text-muted-foreground hover:text-primary transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-bold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="https://gis.edu.gh" className="hover:text-primary transition-colors">Main Website</a></li>
                <li><a href="https://gis.edu.gh/admissions/" className="hover:text-primary transition-colors">Admissions</a></li>
                <li><a href="https://gis.edu.gh/careers/" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="https://70th.gis.edu.gh/" className="hover:text-primary transition-colors">70th Celebration</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold mb-4">Support</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Payment Issues</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Technical Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Ghana International School. All rights reserved.</p>
            <p className="mt-2">Powered by Paystack • Secured by Firebase</p>
          </div>
        </div>
      </footer>

      {/* User ID Display */}
      <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg px-3 py-2 shadow-lg z-30">
        <div className="flex items-center space-x-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">ID:</span>
          <span className="font-mono font-medium" data-testid="text-user-id">
            {getUserDisplayId()}
          </span>
        </div>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <PaymentModal
        video={SAMPLE_VIDEO}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        userEmail={user?.email || ''}
        userName={firestoreUser ? `${firestoreUser.firstName} ${firestoreUser.lastName}` : ''}
      />
    </div>
  );
}
