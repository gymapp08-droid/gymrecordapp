import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Theme } from '../../theme/tokens';
import { ApiClient } from '../../services/api';
import { PushNotification } from '../../services/pushNotification.service';
import { INotification, NotificationCategory } from '@alpha/types';

interface NotificationCenterScreenProps {
  onNavigateBack?: () => void;
  onOpenPreferences?: () => void;
  onOpenReminders?: () => void;
}

type FilterCategory = 'ALL' | 'UNREAD' | NotificationCategory;

export const NotificationCenterScreen: React.FC<NotificationCenterScreenProps> = ({
  onNavigateBack,
  onOpenPreferences,
  onOpenReminders,
}) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchUnreadCount = useCallback(async () => {
    const res = await ApiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    if (res.success && res.data) {
      setUnreadCount(res.data.unreadCount);
    }
  }, []);

  const fetchNotifications = useCallback(
    async (targetPage = 1, shouldRefresh = false) => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set('page', String(targetPage));
        queryParams.set('limit', '15');

        if (activeFilter === 'UNREAD') {
          queryParams.set('unreadOnly', 'true');
        } else if (activeFilter !== 'ALL') {
          queryParams.set('category', activeFilter);
        }

        const res = await ApiClient.get<{
          data: INotification[];
          total: number;
          totalPages: number;
        }>(`/notifications?${queryParams.toString()}`);

        const payload = res.data;
        if (res.success && payload) {
          if (shouldRefresh || targetPage === 1) {
            setNotifications(payload.data);
          } else {
            setNotifications((prev) => [...prev, ...payload.data]);
          }
          setHasMore(targetPage < payload.totalPages);
          setPage(targetPage);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeFilter],
  );

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications(1, true);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications(1, true);
    fetchUnreadCount();
  };

  const handleMarkAsRead = async (item: INotification) => {
    if (item.isRead) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    await ApiClient.patch(`/notifications/${item.id}/read`);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
    );
    setUnreadCount(0);

    await ApiClient.post('/notifications/read-all', {});
  };

  const handleNotificationPress = (item: INotification) => {
    handleMarkAsRead(item);
    if (item.deepLinkUrl) {
      PushNotification.handleDeepLink(item.deepLinkUrl);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'WORKOUT':
        return Theme.colors.cyanGlow;
      case 'NUTRITION':
        return Theme.colors.emeraldSuccess;
      case 'COACH':
      case 'MESSAGES':
        return Theme.colors.amberWarning;
      case 'PROGRESS':
        return Theme.colors.primaryBlue;
      case 'SYSTEM':
      default:
        return Theme.colors.violetAi;
    }
  };

  const filterTabs: { label: string; value: FilterCategory }[] = [
    { label: 'All', value: 'ALL' },
    { label: `Unread (${unreadCount})`, value: 'UNREAD' },
    { label: 'Workouts', value: 'WORKOUT' },
    { label: 'Nutrition', value: 'NUTRITION' },
    { label: 'Messages', value: 'MESSAGES' },
    { label: 'System', value: 'SYSTEM' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onNavigateBack && (
            <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {onOpenReminders && (
            <TouchableOpacity onPress={onOpenReminders} style={styles.actionIconBtn}>
              <Text style={styles.actionIconText}>⏰</Text>
            </TouchableOpacity>
          )}
          {onOpenPreferences && (
            <TouchableOpacity onPress={onOpenPreferences} style={styles.actionIconBtn}>
              <Text style={styles.actionIconText}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Subheader action */}
      {unreadCount > 0 && (
        <View style={styles.subheader}>
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.value;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item.value)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Notification List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primaryBlue} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Theme.colors.cyanGlow}
            />
          }
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasMore && !isLoading) {
              fetchNotifications(page + 1);
            }
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>Zero Notifications</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'UNREAD'
                  ? 'All caught up! You have read all notifications.'
                  : 'No notifications in this category.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const catColor = getCategoryColor(item.category);
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
                style={[styles.itemCard, !item.isRead && styles.itemCardUnread]}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemCategoryRow}>
                    <View style={[styles.categoryBadge, { borderColor: catColor }]}>
                      <Text style={[styles.categoryText, { color: catColor }]}>
                        {item.category}
                      </Text>
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.itemTime}>{formatRelativeTime(item.createdAt)}</Text>
                </View>

                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody}>{item.body}</Text>

                {item.deepLinkUrl && (
                  <View style={styles.deepLinkPrompt}>
                    <Text style={styles.deepLinkPromptText}>Tap to open resource →</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: Theme.colors.textPrimary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontDisplay,
  },
  unreadPill: {
    backgroundColor: Theme.colors.primaryBlue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.pill,
  },
  unreadPillText: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: {
    fontSize: 16,
  },
  subheader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    color: Theme.colors.cyanGlow,
    fontWeight: '600',
  },
  tabsWrapper: {
    marginVertical: 10,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.pill,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(56, 130, 246, 0.15)',
    borderColor: Theme.colors.primaryBlue,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: Theme.colors.primaryBlue,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  itemCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
  },
  itemCardUnread: {
    backgroundColor: 'rgba(56, 130, 246, 0.05)',
    borderColor: 'rgba(56, 130, 246, 0.35)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.cyanGlow,
  },
  itemTime: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  itemBody: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  deepLinkPrompt: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  deepLinkPromptText: {
    fontSize: 12,
    color: Theme.colors.cyanGlow,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
