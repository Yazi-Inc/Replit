import React, { useEffect, useState } from 'react';
import { Clock, Wallet, PlayCircle, Download, Calendar } from 'lucide-react';
import { FirestoreUser, FirestorePayment, FirestoreVideoAccess, getUserPayments, getUserActiveAccess, getVideo } from '../lib/firestore';
import { FirestoreVideo } from '../lib/firestore';
import { useToast } from '../hooks/use-toast';

interface UserDashboardProps {
  user: FirestoreUser;
}

interface PaymentWithVideo extends FirestorePayment {
  video?: FirestoreVideo | null;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
  const [payments, setPayments] = useState<PaymentWithVideo[]>([]);
  const [activeAccess, setActiveAccess] = useState<FirestoreVideoAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      console.log('Dashboard: Loading data for user:', user.id);
      
      // Load user payments
      console.log('Dashboard: Loading user payments...');
      const userPayments = await getUserPayments(user.id);
      console.log('Dashboard: Found payments:', userPayments.length);
      
      // Load video details for each payment
      const paymentsWithVideos = await Promise.all(
        userPayments.map(async (payment) => {
          try {
            const video = await getVideo(payment.videoId);
            return { ...payment, video };
          } catch (error) {
            console.error(`Error loading video ${payment.videoId}:`, error);
            return payment;
          }
        })
      );
      
      setPayments(paymentsWithVideos);
      
      // Load active access
      console.log('Dashboard: Loading active access...');
      const userActiveAccess = await getUserActiveAccess(user.id);
      console.log('Dashboard: Found active access:', userActiveAccess.length);
      setActiveAccess(userActiveAccess);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amountInPesewas: number) => {
    return `GH₵${(amountInPesewas / 100).toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful':
        return 'text-primary';
      case 'pending':
        return 'text-accent';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-loading">
        <h3 className="text-2xl font-bold mb-6">Your Dashboard</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl shadow-lg p-6 border border-border">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="user-dashboard">
      <h3 className="text-2xl font-bold">Your Dashboard</h3>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Access */}
        <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold">Active Access</h4>
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary" data-testid="text-active-access-count">
            {activeAccess.length}
          </p>
          <p className="text-muted-foreground">Videos available</p>
        </div>

        {/* Total Spent */}
        <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold">Total Spent</h4>
            <Wallet className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-accent" data-testid="text-total-spent">
            GH₵{user.totalSpent.toLocaleString()}
          </p>
          <p className="text-muted-foreground">Lifetime</p>
        </div>

        {/* Videos Watched */}
        <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold">Videos Watched</h4>
            <PlayCircle className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary" data-testid="text-videos-watched">
            {user.videosWatched}
          </p>
          <p className="text-muted-foreground">All time</p>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-lg">Payment History</h4>
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8" data-testid="empty-payment-history">
            <div className="bg-muted rounded-full p-6 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No payments yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Purchase a video to see your payment history here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                data-testid={`payment-item-${payment.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <PlayCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium" data-testid={`text-payment-video-title-${payment.id}`}>
                      {payment.video?.title || 'Video Title'}
                    </p>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <span data-testid={`text-payment-date-${payment.id}`}>
                        {formatDate(payment.createdAt)}
                      </span>
                      <span data-testid={`text-payment-ref-${payment.id}`}>
                        Ref: {payment.paystackReference}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold" data-testid={`text-payment-amount-${payment.id}`}>
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className={`text-sm capitalize ${getStatusColor(payment.status)}`} data-testid={`text-payment-status-${payment.id}`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Access Details */}
      {activeAccess.length > 0 && (
        <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-lg">Active Video Access</h4>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <div className="space-y-3">
            {activeAccess.map((access) => (
              <div
                key={access.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
                data-testid={`access-item-${access.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <div>
                    <p className="font-medium">Video Access</p>
                    <p className="text-sm text-muted-foreground">
                      Expires: {formatDate(access.expiresAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-primary text-sm font-medium">
                    Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
