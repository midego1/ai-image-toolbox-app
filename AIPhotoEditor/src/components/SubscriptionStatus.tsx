import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SubscriptionService } from '../services/subscriptionService';
import { useState, useEffect } from 'react';

export const SubscriptionStatus: React.FC = () => {
  const { theme } = useTheme();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const premium = await SubscriptionService.checkSubscriptionStatus();
    setIsPremium(premium);
  };

  if (isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary + '20' }]}>
        <Text style={[styles.text, { color: theme.colors.primary }]}>⭐ Pro Member</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.text, { color: theme.colors.textSecondary }]}>Free Plan</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
