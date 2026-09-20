import React, { useState } from 'react';
import { STITCH_THEME } from '../styles/stitch-theme';
import { ICoachConversationSummary, ICoachMessage } from '@alpha/types';

interface MessagesViewProps {
  conversations: ICoachConversationSummary[];
  activeClientId: string | null;
  onSelectConversation: (clientId: string) => void;
  messages: ICoachMessage[];
  onSendMessage: (clientId: string, content: string) => void;
  onOpenAiAssistant?: (clientId: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  conversations,
  activeClientId,
  onSelectConversation,
  messages,
  onSendMessage,
  onOpenAiAssistant,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeConv = conversations.find((c) => c.clientId === activeClientId) || conversations[0];

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    onSendMessage(activeConv.clientId, inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        height: 'calc(100vh - 180px)',
        minHeight: '600px',
        backgroundColor: STITCH_THEME.colors.bgSecondary,
        borderRadius: '12px',
        border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
        overflow: 'hidden',
      }}
    >
      {/* Left Sidebar: Conversations List */}
      <div
        style={{
          borderRight: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(7, 9, 14, 0.4)',
        }}
      >
        {/* Search header */}
        <div style={{ padding: '16px', borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}` }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary, marginBottom: '10px' }}>
            Direct Communications
          </div>
          <input
            type="text"
            placeholder="Search athletes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              color: STITCH_THEME.colors.textPrimary,
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Client conversation rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: STITCH_THEME.colors.textMuted, fontSize: '13px' }}>
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = activeConv?.clientId === conv.clientId;
              return (
                <div
                  key={conv.clientId}
                  onClick={() => onSelectConversation(conv.clientId)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid rgba(255, 255, 255, 0.04)`,
                    backgroundColor: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                    borderLeft: isSelected ? `3px solid ${STITCH_THEME.colors.accentCyan}` : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: STITCH_THEME.colors.textPrimary }}>
                      {conv.clientName}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span
                        style={{
                          backgroundColor: STITCH_THEME.colors.accentCyan,
                          color: '#000000',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: 800,
                        }}
                      >
                        {conv.unreadCount} NEW
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: isSelected ? STITCH_THEME.colors.textSecondary : STITCH_THEME.colors.textMuted,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {conv.lastMessage?.content || 'No messages yet'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Thread */}
      {activeConv ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Thread Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(12, 16, 24, 0.6)',
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: STITCH_THEME.colors.textPrimary }}>
                {activeConv.clientName}
              </div>
              <div style={{ fontSize: '11px', color: STITCH_THEME.colors.textMuted }}>
                {activeConv.clientEmail} • Encrypted coach-to-athlete communication channel
              </div>
            </div>

            {onOpenAiAssistant && (
              <button
                onClick={() => onOpenAiAssistant(activeConv.clientId)}
                style={{
                  ...STITCH_THEME.styles.secondaryButton,
                  borderColor: STITCH_THEME.colors.accentCyan,
                  color: STITCH_THEME.colors.accentCyan,
                  fontSize: '12px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>⚡</span>
                <span>Coach AI Assistant</span>
              </button>
            )}
          </div>

          {/* Messages list */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: STITCH_THEME.colors.textMuted, marginTop: '80px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>No messages in thread</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Send a check-in message or prompt the athlete on today's session.
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isCoach = m.senderId !== activeConv.clientId;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isCoach ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: isCoach ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        backgroundColor: isCoach ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isCoach ? 'rgba(0, 240, 255, 0.3)' : STITCH_THEME.colors.borderSubtle}`,
                        color: STITCH_THEME.colors.textPrimary,
                        fontSize: '13px',
                        lineHeight: 1.5,
                      }}
                    >
                      {m.content}

                      {/* Attachments if any */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          {m.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              style={{
                                fontSize: '11px',
                                color: STITCH_THEME.colors.accentCyan,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>📎</span>
                              <span>{att.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: STITCH_THEME.colors.textMuted, marginTop: '4px' }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isCoach && (
                        <span style={{ marginLeft: '4px', color: m.isRead ? STITCH_THEME.colors.accentCyan : STITCH_THEME.colors.textMuted }}>
                          {m.isRead ? '✓✓ Read' : '✓ Sent'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Bar */}
          <div
            style={{
              padding: '16px',
              borderTop: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
              display: 'flex',
              gap: '12px',
              backgroundColor: 'rgba(12, 16, 24, 0.8)',
            }}
          >
            <input
              type="text"
              placeholder={`Message ${activeConv.clientName}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${STITCH_THEME.colors.borderSubtle}`,
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: STITCH_THEME.colors.textPrimary,
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              style={{
                ...STITCH_THEME.styles.primaryButton,
                opacity: inputText.trim() ? 1 : 0.5,
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: STITCH_THEME.colors.textMuted }}>
          Select a client conversation to begin messaging
        </div>
      )}
    </div>
  );
};
