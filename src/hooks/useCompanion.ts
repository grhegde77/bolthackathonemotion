import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface CompanionMessage {
  id: string
  conversation_id: string
  content: string
  is_user: boolean
  message_type: 'normal' | 'warning' | 'resource'
  created_at: string
  reactions?: CompanionReaction[]
}

export interface CompanionReaction {
  id: string
  message_id: string
  reaction_type: 'helpful' | 'not_helpful' | 'heart' | 'thumbs_up' | 'thumbs_down'
  created_at: string
}

export interface CompanionConversation {
  id: string
  session_id: string
  created_at: string
  updated_at: string
}

export function useCompanion() {
  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [currentConversation, setCurrentConversation] = useState<CompanionConversation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate a unique session ID for this conversation
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Create a new conversation
  const createConversation = async () => {
    try {
      const sessionId = generateSessionId()
      
      const { data, error } = await supabase
        .from('companion_conversations')
        .insert({
          session_id: sessionId
        })
        .select()
        .single()

      if (error) throw error

      setCurrentConversation(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation')
      throw err
    }
  }

  // Save a message to the database
  const saveMessage = async (
    content: string, 
    isUser: boolean, 
    messageType: 'normal' | 'warning' | 'resource' = 'normal'
  ): Promise<CompanionMessage> => {
    try {
      let conversation = currentConversation
      
      // Create conversation if it doesn't exist
      if (!conversation) {
        conversation = await createConversation()
      }

      const { data, error } = await supabase
        .from('companion_messages')
        .insert({
          conversation_id: conversation.id,
          content,
          is_user: isUser,
          message_type: messageType
        })
        .select()
        .single()

      if (error) throw error

      const newMessage: CompanionMessage = {
        ...data,
        reactions: []
      }

      setMessages(prev => [...prev, newMessage])
      return newMessage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message')
      throw err
    }
  }

  // Add a reaction to a message
  const addReaction = async (messageId: string, reactionType: CompanionReaction['reaction_type']) => {
    try {
      // Check if reaction already exists
      const { data: existingReaction } = await supabase
        .from('companion_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('reaction_type', reactionType)
        .single()

      if (existingReaction) {
        // Remove existing reaction
        await supabase
          .from('companion_reactions')
          .delete()
          .eq('id', existingReaction.id)

        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                reactions: msg.reactions?.filter(r => r.id !== existingReaction.id) || []
              }
            : msg
        ))
      } else {
        // Add new reaction
        const { data, error } = await supabase
          .from('companion_reactions')
          .insert({
            message_id: messageId,
            reaction_type: reactionType
          })
          .select()
          .single()

        if (error) throw error

        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? {
                ...msg,
                reactions: [...(msg.reactions || []), data]
              }
            : msg
        ))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction')
    }
  }

  // Load messages with reactions for current conversation
  const loadMessages = async () => {
    if (!currentConversation) return

    try {
      setLoading(true)
      
      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('companion_messages')
        .select('*')
        .eq('conversation_id', currentConversation.id)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      // Load reactions for all messages
      const messageIds = messagesData.map(msg => msg.id)
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('companion_reactions')
        .select('*')
        .in('message_id', messageIds)

      if (reactionsError) throw reactionsError

      // Combine messages with their reactions
      const messagesWithReactions = messagesData.map(msg => ({
        ...msg,
        reactions: reactionsData.filter(reaction => reaction.message_id === msg.id)
      }))

      setMessages(messagesWithReactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  // Start a new conversation
  const startNewConversation = async () => {
    try {
      const conversation = await createConversation()
      setMessages([])
      return conversation
    } catch (err) {
      console.error('Failed to start new conversation:', err)
    }
  }

  // Initialize conversation on mount
  useEffect(() => {
    startNewConversation()
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages()
    }
  }, [currentConversation])

  return {
    messages,
    currentConversation,
    loading,
    error,
    saveMessage,
    addReaction,
    startNewConversation
  }
}