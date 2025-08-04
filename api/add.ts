import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "hackathon-8a225",
      clientEmail: "firebase-adminsdk-iprms@hackathon-8a225.iam.gserviceaccount.com",
    }),
  });
}

const db = admin.firestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      question,
      options,
      tokenAddresses,
      solAmount,
      duration,
      userWallet,
      creatorName = 'Anonymous',
      category = 'General',
      isActive = true,
      createdAt = new Date().toISOString(),
      betType = 'standard', // 'standard', 'bonk', 'timeless'
      generatedImage,
    } = req.body;

    // Validate required fields
    if (!question || !options || !tokenAddresses || !solAmount || !userWallet) {
      return res.status(400).json(
        { success: false, error: 'Missing required fields' }
      );
    }

    // Validate options and token addresses arrays
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json(
        { success: false, error: 'At least 2 options are required' }
      );
    }

    if (!Array.isArray(tokenAddresses) || tokenAddresses.length !== options.length) {
      return res.status(400).json(
        { success: false, error: 'Token addresses must match the number of options' }
      );
    }

    // Validate bet type
    const validBetTypes = ['standard', 'bonk', 'timeless'];
    if (!validBetTypes.includes(betType)) {
      return res.status(400).json(
        { success: false, error: 'Invalid bet type. Must be standard, bonk, or timeless' }
      );
    }

    // Calculate end time based on bet type
    let endTime;
    if (betType === 'timeless') {
      // Timeless bets never end
      endTime = null;
    } else {
      // Standard and bonk bets have duration
      endTime = new Date(Date.now() + (parseInt(duration) || 24) * 60 * 60 * 1000).toISOString();
    }

    // Create bet document
    const betData = {
      question,
      options,
      tokenAddresses,
      solAmount: parseFloat(solAmount),
      duration: betType === 'timeless' ? null : (parseInt(duration) || 24), // No duration for timeless
      userWallet,
      creatorName,
      category,
      isActive,
      createdAt,
      updatedAt: new Date().toISOString(),
      totalParticipants: 0,
      totalPool: 0,
      participants: [],
      transactions: [],
      status: 'active', // active, completed, cancelled
      winner: null,
      endTime,
      betType,
      generatedImage,
    };

    // Add to Firestore
    const betRef = await db.collection('bets').add(betData);
    
    // Get the created document
    const createdBet = await betRef.get();
    
    return res.status(200).json({
      success: true,
      betId: betRef.id,
      bet: {
        id: betRef.id,
        ...createdBet.data()
      },
      message: 'Bet created successfully'
    });

  } catch (error) {
    console.error('Error creating bet:', error);
    return res.status(500).json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }
    );
  }
} 