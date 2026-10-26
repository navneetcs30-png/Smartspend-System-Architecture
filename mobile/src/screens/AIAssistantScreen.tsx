import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { api } from '../services/api';
import { Sparkles, Send, Bot, User as UserIcon } from 'lucide-react-native';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  suggestedActions?: string[];
}

export const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am your SmartSpend AI Financial Analyst. I have verified access to your database ledger. What would you like to analyze today?',
      time: 'Just now',
      suggestedActions: [
        'Analyze my spending this month',
        'How can I save ₹5,000 next month?',
        'What are my largest expenses?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: textToSend });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.response,
        time: 'Just now',
        suggestedActions: res.data.suggested_actions,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I encountered an issue querying your financial ledger. Please try again.',
        time: 'Just now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.aiBadge}>
          <Sparkles size={12} color={THEME.colors.primary} />
          <Text style={styles.aiBadgeText}>Deterministic Tool Calling</Text>
        </View>
        <Text style={styles.headerTitle}>AI Financial Analyst</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatFeed}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isUser = item.sender === 'user';
          return (
            <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
              <View
                style={[
                  styles.avatarBox,
                  isUser ? styles.avatarUser : styles.avatarBot,
                ]}
              >
                {isUser ? <UserIcon size={14} color="#070A11" /> : <Bot size={14} color="#FFF" />}
              </View>

              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
                  {item.text}
                </Text>

                {/* Suggested Chips */}
                {item.suggestedActions && item.suggestedActions.length > 0 && (
                  <View style={styles.chipsContainer}>
                    {item.suggestedActions.map((action: string, i: number) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.chip}
                        onPress={() => handleSend(action)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.chipText}>{action}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Running verified SQL analytics...</Text>
            </View>
          ) : null
        }
      />

      {/* Input Well */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about spending, budgets, savings..."
          placeholderTextColor={THEME.colors.textMuted}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => handleSend()}
          disabled={loading || !input.trim()}
          activeOpacity={0.8}
        >
          <Send size={16} color="#070A11" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  chatFeed: {
    padding: THEME.spacing.md,
    paddingBottom: 20,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  msgRowUser: {
    flexDirection: 'row-reverse',
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUser: {
    backgroundColor: THEME.colors.primary,
  },
  avatarBot: {
    backgroundColor: THEME.colors.indigo,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
  },
  bubbleUser: {
    backgroundColor: THEME.colors.primary,
    borderTopRightRadius: 2,
  },
  bubbleBot: {
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderTopLeftRadius: 2,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bubbleTextUser: {
    color: '#070A11',
    fontWeight: '600',
  },
  bubbleTextBot: {
    color: THEME.colors.textPrimary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: THEME.spacing.sm,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.primaryLight,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: THEME.spacing.sm,
  },
  loadingText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: THEME.spacing.sm,
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    fontSize: 12,
    color: THEME.colors.textPrimary,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
