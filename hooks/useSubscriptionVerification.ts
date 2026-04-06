import { useState, useEffect } from 'react';

interface SubscriberData {
  email: string;
  name: string;
  subscribedAt: string;
}

interface VerificationResult {
  isSubscribed: boolean;
  subscriber?: SubscriberData;
  message?: string;
  loading: boolean;
  error: string | null;
  verifySubscription: (email: string) => Promise<void>;
}

export function useSubscriptionVerification(email?: string): VerificationResult {
  const [result, setResult] = useState<Omit<VerificationResult, 'verifySubscription'>>({
    isSubscribed: false,
    loading: false,
    error: null,
  });

  const verifySubscription = async (emailToVerify: string) => {
    setResult(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/verify?email=${encodeURIComponent(emailToVerify)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult({
        isSubscribed: data.isSubscribed,
        subscriber: data.subscriber,
        message: data.message,
        loading: false,
        error: null,
      });
    } catch (error) {
      setResult({
        isSubscribed: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  useEffect(() => {
    if (email) {
      verifySubscription(email);
    }
  }, [email]);

  return {
    ...result,
    verifySubscription,
  };
}