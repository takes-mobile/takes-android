import { Button, Linking, Text, View, TouchableOpacity, Modal, Pressable, Platform } from "react-native";
import { LoginWithOAuthInput, useLoginWithOAuth } from "@privy-io/expo";
import { useLogin } from "@privy-io/expo/ui";
import { useLoginWithPasskey } from "@privy-io/expo/passkey";
import Constants from "expo-constants";
import { useState } from "react";
import * as Application from "expo-application";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [error, setError] = useState("");
  const { loginWithPasskey } = useLoginWithPasskey({
    onError: (err) => {
      console.log(err);
      setError(JSON.stringify(err.message));
    },
  });
  const { login } = useLogin();
  const oauth = useLoginWithOAuth({
    onError: (err) => {
      console.log(err);
      setError(JSON.stringify(err.message));
    },
  });
  const [showModal, setShowModal] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: '#f6f8fa', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4, minWidth: 300 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 18 }}>Welcome</Text>
        <Text style={{ color: '#888', fontSize: 15, marginBottom: 28, textAlign: 'center' }}>
          Start betting by logging in with your favorite provider.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#6c63ff',
            borderRadius: 8,
            paddingVertical: 14,
            paddingHorizontal: 32,
            marginBottom: 8,
            marginTop: 8,
          }}
          onPress={() => setShowModal(true)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Start Betting</Text>
        </TouchableOpacity>
        {error && <Text style={{ color: "#ff5252", marginTop: 18, fontSize: 15, textAlign: 'center' }}>Error: {error}</Text>}
      </View>
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onPress={() => setShowModal(false)}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 28,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -2 },
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 18 }}>Login to Continue</Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#1da1f2',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 24,
              marginBottom: 14,
              width: 220,
              justifyContent: 'center',
              opacity: oauth.state.status === 'loading' ? 0.7 : 1,
            }}
            disabled={oauth.state.status === 'loading'}
            onPress={() => {
              setShowModal(false);
              oauth.login({ provider: 'twitter' } as LoginWithOAuthInput);
            }}
          >
            <MaterialCommunityIcons name="twitter" size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Login with X</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderWidth: 1,
              borderColor: '#4285F4',
              width: 220,
              justifyContent: 'center',
            }}
            onPress={() => {
              setShowModal(false);
              oauth.login({ provider: 'google' } as LoginWithOAuthInput);
            }}
          >
            <MaterialCommunityIcons name="google" size={22} color="#4285F4" style={{ marginRight: 10 }} />
            <Text style={{ color: '#4285F4', fontWeight: 'bold', fontSize: 16 }}>Login with Google</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
