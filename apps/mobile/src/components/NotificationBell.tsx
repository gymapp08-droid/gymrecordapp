import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../theme/tokens';
import { ApiClient } from '../services/api';

interface NotificationBellProps {
  onPress: () => void;
  refreshIntervalMs?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onPress,
  refreshIntervalMs = 30000,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchCount = async () => {
    const res = await ApiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    if (res.success && res.data) {
      setUnreadCount(res.data.unreadCount);
    }
  };

  useEffect(() => {
    fetchCount();
    const timer = setInterval(fetchCount, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refreshIntervalMs]);

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.bellButton}>
      <Text style={styles.bellIcon}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Theme.colors.primaryBlue,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.background,
  },
  badgeText: {
    color: Theme.colors.textPrimary,
    fontSize: 9,
    fontWeight: '800',
  },
});
