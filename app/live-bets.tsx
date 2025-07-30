import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { useContext, useEffect, useState } from 'react';
import { ThemeContext } from './_layout';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

interface Bet {
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

export default function LiveBetsScreen() {
  const { theme: themeName } = useContext(ThemeContext);
  const router = useRouter();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const theme = {
    background: '#0F172A',
    card: 'rgba(255,255,255,0.1)',
    text: '#FFFFFF',
    subtext: '#94A3B8',
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#EF4444',
    orange: '#F97316',
    pink: '#EC4899',
  };

  const fetchBets = async () => {
    try {
      const response = await fetch('https://apipoolc.vercel.app/api/read');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBets(data.bets || []);
        }
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBets();
  };

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const formatSolAmount = (amount: number) => {
    return `${amount} SOL`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'General': '#3B82F6',
      'Sports': '#10B981',
      'Politics': '#EF4444',
      'Entertainment': '#8B5CF6',
      'Technology': '#F97316',
    };
    return colors[category as keyof typeof colors] || '#3B82F6';
  };

  const BetCard = ({ bet }: { bet: Bet }) => (
    <TouchableOpacity
      style={{
        backgroundColor: theme.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      }}
      onPress={() => {
        // Navigate to bet details
        router.push({
          pathname: '/bet-details',
          params: { betData: JSON.stringify(bet) }
        });
      }}
    >
      {/* Question */}
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 16,
        lineHeight: 24,
      }}>
        {bet.question}
      </Text>

      {/* Options */}
      <View style={{ marginBottom: 16 }}>
        {bet.options.map((option, index) => (
          <View key={index} style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}>
            <Text style={{
              fontSize: 16,
              color: theme.text,
              fontWeight: '500',
            }}>
              {option}
            </Text>
          </View>
        ))}
      </View>

      {/* Stats Row */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: bet.isActive ? theme.success : theme.warning,
            marginRight: 8,
          }} />
          <Text style={{
            fontSize: 14,
            color: bet.isActive ? theme.success : theme.warning,
            fontWeight: '600',
          }}>
            {bet.isActive ? 'Active' : 'Ended'}
          </Text>
        </View>
        
        <View style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}>
          <Text style={{
            fontSize: 12,
            color: theme.primary,
            fontWeight: '600',
          }}>
            {bet.category}
          </Text>
        </View>
      </View>

      {/* Bet Details */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <View>
          <Text style={{ fontSize: 14, color: theme.subtext, marginBottom: 2 }}>
            Total Pool
          </Text>
          <Text style={{ fontSize: 16, color: theme.text, fontWeight: 'bold' }}>
            {formatSolAmount(bet.solAmount)}
          </Text>
        </View>
        
        <View>
          <Text style={{ fontSize: 14, color: theme.subtext, marginBottom: 2 }}>
            Participants
          </Text>
          <Text style={{ fontSize: 16, color: theme.text, fontWeight: '600' }}>
            {bet.totalParticipants}
          </Text>
        </View>
        
        <View>
          <Text style={{ fontSize: 14, color: theme.subtext, marginBottom: 2 }}>
            Time Left
          </Text>
          <Text style={{ fontSize: 16, color: theme.warning, fontWeight: '600' }}>
            {formatTimeLeft(bet.endTime)}
          </Text>
        </View>
      </View>

      {/* Creator Info */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
      }}>
        <Text style={{ fontSize: 14, color: theme.subtext }}>
          by {bet.creatorName}
        </Text>
        
        <TouchableOpacity
          style={{
            backgroundColor: theme.primary,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
          onPress={() => {
            router.push({
              pathname: '/bet-details',
              params: { betData: JSON.stringify(bet) }
            });
          }}
        >
          <Text style={{
            color: '#fff',
            fontSize: 14,
            fontWeight: '600',
          }}>
            Place Bet
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 90,
      }}>
        <Text style={{ fontSize: 18, color: theme.text }}>Loading bets...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ 
        flex: 1, 
        backgroundColor: theme.background,
      }} 
      contentContainerStyle={{ 
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.text}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: theme.text,
          marginBottom: 8,
        }}>
          Live Bets
        </Text>
        <Text style={{
          fontSize: 16,
          color: theme.subtext,
        }}>
          {bets.length} active bets available
        </Text>
      </View>

      {/* Bets List */}
      {bets.length === 0 ? (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 60,
        }}>
          <Text style={{
            fontSize: 18,
            color: theme.subtext,
            textAlign: 'center',
            marginBottom: 16,
          }}>
            No bets available yet
          </Text>
          <Text style={{
            fontSize: 14,
            color: theme.subtext,
            textAlign: 'center',
          }}>
            Be the first to create a bet!
          </Text>
        </View>
      ) : (
        bets.map((bet) => (
          <BetCard key={bet.id} bet={bet} />
        ))
      )}
    </ScrollView>
  );
} 