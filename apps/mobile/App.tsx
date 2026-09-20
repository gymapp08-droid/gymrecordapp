import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { WorkoutSessionScreen } from './src/screens/workout/WorkoutSessionScreen';
import { ProgressScreen } from './src/screens/progress/ProgressScreen';
import { AICoachScreen } from './src/screens/ai/AICoachScreen';
import { NotificationCenterScreen } from './src/screens/notifications/NotificationCenterScreen';
import { Theme } from './src/theme/tokens';

export default function App() {
  const [activeTab, setActiveTab] = useState<'WORKOUT' | 'PROGRESS' | 'AI' | 'ALERTS'>('WORKOUT');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05070B" />
      <View style={styles.content}>
        {activeTab === 'WORKOUT' && <WorkoutSessionScreen />}
        {activeTab === 'PROGRESS' && <ProgressScreen />}
        {activeTab === 'AI' && <AICoachScreen />}
        {activeTab === 'ALERTS' && <NotificationCenterScreen />}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'WORKOUT' && styles.navItemActive]}
          onPress={() => setActiveTab('WORKOUT')}
        >
          <Text style={[styles.navText, activeTab === 'WORKOUT' && styles.navTextActive]}>WORKOUT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'PROGRESS' && styles.navItemActive]}
          onPress={() => setActiveTab('PROGRESS')}
        >
          <Text style={[styles.navText, activeTab === 'PROGRESS' && styles.navTextActive]}>PROGRESS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'AI' && styles.navItemActive]}
          onPress={() => setActiveTab('AI')}
        >
          <Text style={[styles.navText, activeTab === 'AI' && styles.navTextActive]}>AI COACH</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'ALERTS' && styles.navItemActive]}
          onPress={() => setActiveTab('ALERTS')}
        >
          <Text style={[styles.navText, activeTab === 'ALERTS' && styles.navTextActive]}>ALERTS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070B',
  },
  content: {
    flex: 1,
  },
  navBar: {
    height: 64,
    flexDirection: 'row',
    backgroundColor: '#07090E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderBottomWidth: 2,
    borderBottomColor: '#00F0FF',
  },
  navText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#00F0FF',
  },
});
