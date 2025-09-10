import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { User as AuthUser } from "firebase/auth";

export interface FirestoreUser {
  id: string;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Timestamp;
  totalSpent: number;
  videosWatched: number;
}

export interface FirestorePayment {
  id: string;
  userId: string;
  videoId: string;
  amount: number;
  currency: string;
  paystackReference: string;
  status: 'pending' | 'successful' | 'failed';
  accessExpiresAt: Timestamp;
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
}

export interface FirestoreVideoAccess {
  id: string;
  userId: string;
  videoId: string;
  paymentId: string;
  isActive: boolean;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export interface FirestoreVideo {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  thumbnailUrl?: string;
  videoUrl: string;
  level: string;
  subject: string;
  createdAt: Timestamp;
}

// User operations
export const createUser = async (authUser: AuthUser, additionalData: { firstName: string; lastName: string }) => {
  const userRef = doc(db, "users", authUser.uid);
  const userData: Partial<FirestoreUser> = {
    firebaseUid: authUser.uid,
    email: authUser.email!,
    firstName: additionalData.firstName,
    lastName: additionalData.lastName,
    createdAt: serverTimestamp() as Timestamp,
    totalSpent: 0,
    videosWatched: 0,
  };
  
  await setDoc(userRef, userData);
  return userData;
};

export const getUser = async (uid: string): Promise<FirestoreUser | null> => {
  try {
    console.log('Firestore: Getting user:', uid);
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log('Firestore: User found');
      return { id: userSnap.id, ...userSnap.data() } as FirestoreUser;
    }
    console.log('Firestore: User not found');
    return null;
  } catch (error) {
    console.error('Firestore: Error getting user:', error);
    return null;
  }
};

// Payment operations
export const createPayment = async (paymentData: Omit<FirestorePayment, 'id' | 'createdAt'>) => {
  const paymentRef = doc(collection(db, "payments"));
  const payment: Partial<FirestorePayment> = {
    ...paymentData,
    createdAt: serverTimestamp() as Timestamp,
  };
  
  await setDoc(paymentRef, payment);
  return { id: paymentRef.id, ...payment } as FirestorePayment;
};

export const updatePaymentStatus = async (paymentId: string, status: 'successful' | 'failed') => {
  const paymentRef = doc(db, "payments", paymentId);
  await updateDoc(paymentRef, {
    status,
    verifiedAt: serverTimestamp(),
  });
};

// Update user statistics after successful payment
export const updateUserStats = async (userId: string, amountSpent: number, videosWatchedIncrement: number = 1) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data() as FirestoreUser;
    await updateDoc(userRef, {
      totalSpent: (userData.totalSpent || 0) + amountSpent,
      videosWatched: (userData.videosWatched || 0) + videosWatchedIncrement,
    });
  }
};

export const getUserPayments = async (userId: string): Promise<FirestorePayment[]> => {
  try {
    console.log('Firestore: Getting payments for user:', userId);
    // Remove orderBy to avoid composite index requirement
    const paymentsQuery = query(
      collection(db, "payments"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(paymentsQuery);
    console.log('Firestore: Found', querySnapshot.docs.length, 'payments');
    
    // Sort client-side by createdAt descending
    const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestorePayment));
    return payments.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime; // descending order
    });
  } catch (error) {
    console.error('Firestore: Error getting user payments:', error);
    // Return empty array instead of throwing to prevent dashboard crash
    return [];
  }
};

// Video access operations
export const createVideoAccess = async (accessData: Omit<FirestoreVideoAccess, 'id' | 'createdAt'>) => {
  const accessRef = doc(collection(db, "videoAccess"));
  const access: Partial<FirestoreVideoAccess> = {
    ...accessData,
    createdAt: serverTimestamp() as Timestamp,
  };
  
  await setDoc(accessRef, access);
  return { id: accessRef.id, ...access } as FirestoreVideoAccess;
};

export const checkVideoAccess = async (userId: string, videoId: string): Promise<FirestoreVideoAccess | null> => {
  const accessQuery = query(
    collection(db, "videoAccess"),
    where("userId", "==", userId),
    where("videoId", "==", videoId),
    where("isActive", "==", true)
  );
  
  const querySnapshot = await getDocs(accessQuery);
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const access = { id: doc.id, ...doc.data() } as FirestoreVideoAccess;
    
    // Check if access is still valid
    if (access.expiresAt.toMillis() > Date.now()) {
      return access;
    } else {
      // Deactivate expired access
      await updateDoc(doc.ref, { isActive: false });
    }
  }
  
  return null;
};

export const getUserActiveAccess = async (userId: string): Promise<FirestoreVideoAccess[]> => {
  try {
    console.log('Firestore: Getting active access for user:', userId);
    const accessQuery = query(
      collection(db, "videoAccess"),
      where("userId", "==", userId),
      where("isActive", "==", true)
    );
    
    const querySnapshot = await getDocs(accessQuery);
    console.log('Firestore: Found', querySnapshot.docs.length, 'active access records');
    const activeAccess = [];
    
    for (const doc of querySnapshot.docs) {
      const access = { id: doc.id, ...doc.data() } as FirestoreVideoAccess;
      
      if (access.expiresAt.toMillis() > Date.now()) {
        activeAccess.push(access);
      } else {
        // Deactivate expired access
        await updateDoc(doc.ref, { isActive: false });
      }
    }
    
    return activeAccess;
  } catch (error) {
    console.error('Firestore: Error getting user active access:', error);
    // Return empty array instead of throwing to prevent dashboard crash
    return [];
  }
};

// Real-time listeners
export const subscribeToVideoAccess = (userId: string, videoId: string, callback: (access: FirestoreVideoAccess | null) => void) => {
  const accessQuery = query(
    collection(db, "videoAccess"),
    where("userId", "==", userId),
    where("videoId", "==", videoId),
    where("isActive", "==", true)
  );
  
  return onSnapshot(accessQuery, (querySnapshot) => {
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const access = { id: doc.id, ...doc.data() } as FirestoreVideoAccess;
      
      if (access.expiresAt.toMillis() > Date.now()) {
        callback(access);
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// Video operations
export const getVideo = async (videoId: string): Promise<FirestoreVideo | null> => {
  const videoRef = doc(db, "videos", videoId);
  const videoSnap = await getDoc(videoRef);
  
  if (videoSnap.exists()) {
    return { id: videoSnap.id, ...videoSnap.data() } as FirestoreVideo;
  }
  return null;
};

export const getAllVideos = async (): Promise<FirestoreVideo[]> => {
  const videosQuery = query(collection(db, "videos"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(videosQuery);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreVideo));
};
