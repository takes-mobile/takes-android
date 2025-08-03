import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the Bet interface
export interface Bet {
  id: string;
  question: string;
  options: string[];
  tokenAddresses: string[];
  solAmount: number;
  duration: number;
  userWallet: string;
  creatorName: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalParticipants: number;
  totalPool: number;
  participants: any[];
  transactions: any[];
  status: string;
  winner: string | null;
  endTime: string;
}

interface BetsContextType {
  bets: Bet[];
  loading: boolean;
  refreshing: boolean;
  fetchBets: () => Promise<void>;
  setRefreshing: (refreshing: boolean) => void;
  lastFetched: Date | null;
}

const BetsContext = createContext<BetsContextType>({
  bets: [],
  loading: true,
  refreshing: false,
  fetchBets: async () => {},
  setRefreshing: () => {},
  lastFetched: null
});

export const useBets = () => useContext(BetsContext);

export const BetsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchBets = async () => {
    try {
      console.log('Fetching bets...');
      const response = await fetch('https://apipoolc.vercel.app/api/read');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBets(data.bets || []);
          setLastFetched(new Date());
          console.log(`Fetched ${data.bets?.length || 0} bets successfully`);
        }
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBets();
  }, []);

  // Refresh bets every 2 minutes if the app is active
  useEffect(() => {
    const interval = setInterval(() => {
      // Only fetch if we haven't fetched in the last minute
      // This prevents multiple fetches if multiple screens are mounted
      if (!lastFetched || (new Date().getTime() - lastFetched.getTime() > 60000)) {
        fetchBets();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [lastFetched]);

  return (
    <BetsContext.Provider value={{ bets, loading, refreshing, fetchBets, setRefreshing, lastFetched }}>
      {children}
    </BetsContext.Provider>
  );
};

export default BetsContext;