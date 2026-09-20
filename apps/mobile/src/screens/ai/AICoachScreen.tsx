import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  IAIMessage,
  IAIActionProposal,
  IAIInsight,
  AIMessageRole,
} from '@alpha/types';
import { ApiClient } from '../../services/api';
import { AIActionReviewModal } from './AIActionReviewModal';
import { AIInsightsModal } from './AIInsightsModal';

export const AICoachScreen: React.FC = () => {
  const [messages, setMessages] = useState<IAIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isThinking, setIsThinking] = useState(false);
  const [insights, setInsights] = useState<IAIInsight[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  // Modals
  const [activeProposal, setActiveProposal] = useState<IAIActionProposal | null>(null);
  const [insightsModalVisible, setInsightsModalVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Load active proactive insights on mount
  useEffect(() => {
    ApiClient.get<IAIInsight[]>('/ai/insights')
      .then((res) => {
        if (res.success && res.data) {
          setInsights(res.data);
        }
      })
      .catch(() => {
        setIsOffline(true);
      });
  }, []);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputMessage).trim();
    if (!text || isThinking) return;

    setInputMessage('');
    setIsOffline(false);

    // Append user message immediately
    const userMsg: IAIMessage = {
      id: 'local_user_' + Date.now(),
      conversationId: conversationId || '',
      role: AIMessageRole.USER,
      content: text,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await ApiClient.post<any>('/ai/chat', {
        message: text,
        conversationId,
      });

      if (res.success && res.data) {
        if (res.data.conversationId && !conversationId) {
          setConversationId(res.data.conversationId);
        }

        const aiMsg: IAIMessage = {
          id: res.data.messageId || 'local_ai_' + Date.now(),
          conversationId: res.data.conversationId || '',
          role: AIMessageRole.ASSISTANT,
          content: res.data.message,
          actionProposals: res.data.actionProposals,
          citations: res.data.citations,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        // Fallback error message
        const errorMsg: IAIMessage = {
          id: 'local_err_' + Date.now(),
          conversationId: conversationId || '',
          role: AIMessageRole.ASSISTANT,
          content: 'AI Coach is temporarily unavailable. Please verify your connection and try again.',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      setIsOffline(true);
      const offlineMsg: IAIMessage = {
        id: 'local_offline_' + Date.now(),
        conversationId: conversationId || '',
        role: AIMessageRole.ASSISTANT,
        content: 'AI Coach requires an internet connection. Please check your network and retry.',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, offlineMsg]);
    } finally {
      setIsThinking(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const handleConfirmAction = async (proposalId: string, confirmed: boolean) => {
    await ApiClient.post('/ai/actions/confirm', { proposalId, confirmed });
  };

  const quickStarters = [
    { title: 'Suggest a workout for today', color: '#3B82F6', icon: '🏋️' },
    { title: 'Analyze my nutrition', color: '#10B981', icon: '🥗' },
    { title: 'Give me motivation', color: '#F59E0B', icon: '🔥' },
    { title: 'Why did my bench press improve?', color: '#00F0FF', icon: '⚡' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#05070B" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.screenTitle}>AI Coach</Text>
            <Text style={styles.screenSub}>Your Personal Guide</Text>
          </View>
          <TouchableOpacity
            onPress={() => setInsightsModalVisible(true)}
            style={styles.insightsBtn}
          >
            <Text style={styles.insightsBtnText}>⚡ Insights ({insights.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Offline Warning Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>⚠️ Connection offline. AI requests require internet access.</Text>
          </View>
        )}

        {/* Scrollable Conversation Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            /* ========================================================= */
            /* EMPTY STATE: Hero Avatar & Quick Suggestion Pills         */
            /* ========================================================= */
            <View style={styles.heroContainer}>
              {/* Concentric Glowing AI Orb (Stitch Vector) */}
              <View style={styles.orbWrapper}>
                <View style={styles.orbitalRingOuter} />
                <View style={styles.orbitalRingAura} />
                <View style={styles.coreGlassSphere}>
                  <Svg width={54} height={54} viewBox="0 0 100 100">
                    <Defs>
                      <LinearGradient id="alphaGrad" x1="22" y1="16" x2="78" y2="84">
                        <Stop offset="0%" stopColor="#93C5FD" />
                        <Stop offset="50%" stopColor="#3B82F6" />
                        <Stop offset="100%" stopColor="#1D4ED8" />
                      </LinearGradient>
                    </Defs>
                    <Path
                      d="M50 16 L22 84 L40 84 L50 56 L60 84 L78 84 Z"
                      fill="url(#alphaGrad)"
                    />
                    <Path
                      d="M41 62 L59 62"
                      stroke="#60A5FA"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </Svg>
                  {/* Cyan Glow Dot */}
                  <View style={styles.glowDot} />
                </View>
              </View>

              <Text style={styles.heroQuestion}>How can I help you today?</Text>

              {/* Quick Suggestion Pills */}
              <View style={styles.suggestionsList}>
                {quickStarters.map((starter, idx) => (
                  <TouchableOpacity
                    key={`starter-${idx}`}
                    onPress={() => handleSend(starter.title)}
                    style={styles.suggestionButton}
                  >
                    <View style={styles.suggestionLeft}>
                      <Text style={styles.starterIcon}>{starter.icon}</Text>
                      <Text style={styles.suggestionText}>{starter.title}</Text>
                    </View>
                    <Text style={styles.suggestionArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            /* ========================================================= */
            /* ACTIVE CHAT: Message Stream & Action Proposals            */
            /* ========================================================= */
            <View style={styles.chatStream}>
              {messages.map((msg) => {
                const isUser = msg.role === AIMessageRole.USER;
                return (
                  <View
                    key={msg.id}
                    style={[styles.messageWrapper, isUser ? styles.msgWrapperUser : styles.msgWrapperAI]}
                  >
                    {!isUser && (
                      <View style={styles.aiAvatarBadge}>
                        <Text style={styles.aiAvatarText}>A</Text>
                      </View>
                    )}

                    <View style={[styles.messageBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAI]}>
                      <Text style={[styles.messageText, isUser ? styles.msgTextUser : styles.msgTextAI]}>
                        {msg.content}
                      </Text>

                      {/* Source Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <View style={styles.citationsRow}>
                          {msg.citations.map((c, i) => (
                            <View key={`cite-${i}`} style={styles.citePill}>
                              <Text style={styles.citeText}>Source: {c}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Action Proposal Card */}
                      {msg.actionProposals && msg.actionProposals.length > 0 && (
                        <View style={styles.proposalCard}>
                          <Text style={styles.proposalTag}>PROPOSED PLAN</Text>
                          <Text style={styles.proposalTitle}>
                            {msg.actionProposals[0]!.title}
                          </Text>
                          <Text style={styles.proposalSummary}>
                            {msg.actionProposals[0]!.summary}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setActiveProposal(msg.actionProposals![0]!)}
                            style={styles.reviewBtn}
                          >
                            <Text style={styles.reviewBtnText}>Review Proposed Changes →</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Thinking Indicator */}
              {isThinking && (
                <View style={[styles.messageWrapper, styles.msgWrapperAI]}>
                  <View style={styles.aiAvatarBadge}>
                    <Text style={styles.aiAvatarText}>A</Text>
                  </View>
                  <View style={[styles.messageBubble, styles.msgBubbleAI, styles.thinkingBubble]}>
                    <ActivityIndicator size="small" color="#60A5FA" />
                    <Text style={styles.thinkingText}>Analyzing performance logs...</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Sticky Chat Input Bar */}
        <View style={styles.inputBar}>
          <View style={styles.glassInputPill}>
            <TextInput
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Ask your AI coach..."
              placeholderTextColor="#64748B"
              style={styles.textInputField}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={isThinking || !inputMessage.trim()}
              style={[
                styles.sendButton,
                (!inputMessage.trim() || isThinking) && styles.sendButtonDisabled,
              ]}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Action Review Modal */}
      <AIActionReviewModal
        visible={activeProposal !== null}
        onClose={() => setActiveProposal(null)}
        proposal={activeProposal}
        onConfirm={handleConfirmAction}
      />

      {/* Insights Drawer Modal */}
      <AIInsightsModal
        visible={insightsModalVisible}
        onClose={() => setInsightsModalVisible(false)}
        insights={insights}
        onRefresh={() => {
          ApiClient.post<IAIInsight[]>('/ai/insights/refresh', {}).then((r) => {
            if (r.success && r.data) setInsights(r.data);
          });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  screenSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  insightsBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  insightsBtnText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.3)',
  },
  offlineText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  heroContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  orbWrapper: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  orbitalRingOuter: {
    position: 'absolute',
    inset: 0,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  orbitalRingAura: {
    position: 'absolute',
    inset: 6,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  coreGlassSphere: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(13, 18, 28, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  glowDot: {
    position: 'absolute',
    top: 6,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  heroQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 20,
    textAlign: 'center',
  },
  suggestionsList: {
    width: '100%',
    gap: 10,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 24, 38, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starterIcon: {
    fontSize: 16,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  suggestionArrow: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '300',
  },
  chatStream: {
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  msgWrapperUser: {
    justifyContent: 'flex-end',
  },
  msgWrapperAI: {
    justifyContent: 'flex-start',
  },
  aiAvatarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiAvatarText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '800',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: 14,
  },
  msgBubbleUser: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderTopRightRadius: 4,
  },
  msgBubbleAI: {
    backgroundColor: 'rgba(18, 24, 38, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextUser: {
    color: '#FFFFFF',
  },
  msgTextAI: {
    color: '#E2E8F0',
  },
  citationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  citePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  citeText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  proposalCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  proposalTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 0.8,
  },
  proposalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  proposalSummary: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
    marginTop: 4,
  },
  reviewBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  thinkingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  inputBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(7, 9, 14, 0.95)',
  },
  glassInputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 24, 38, 0.8)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  textInputField: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    paddingVertical: 6,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3882F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    transform: [{ rotate: '45deg' }],
  },
});
