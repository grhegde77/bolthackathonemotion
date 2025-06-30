import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, AlertTriangle, ExternalLink, Heart, ThumbsUp, ThumbsDown, HelpCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompanion, type CompanionMessage } from '../hooks/useCompanion'
import { useAuth } from '../contexts/AuthContext'

const PROFESSIONAL_RESOURCES = [
  {
    name: "Crisis Text Line",
    contact: "Text HOME to 741741",
    description: "24/7 crisis support via text message"
  },
  {
    name: "National Suicide Prevention Lifeline",
    contact: "Call or text 988",
    description: "24/7 free and confidential support"
  },
  {
    name: "SAMHSA National Helpline",
    contact: "1-800-662-4357",
    description: "Treatment referral and information service"
  },
  {
    name: "Psychology Today",
    contact: "psychologytoday.com",
    description: "Find licensed therapists in your area"
  }
]

// Evidence-based emotional support responses categorized by emotional themes
const EMOTIONAL_RESPONSES = {
  anxiety: [
    "Anxiety can feel overwhelming, but you're taking a positive step by acknowledging it. Research shows that naming our emotions can help reduce their intensity. Can you tell me what specific thoughts or situations are contributing to your anxiety right now?",
    "I hear that you're feeling anxious. One evidence-based technique that many find helpful is the 5-4-3-2-1 grounding method: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. Would you like to try this together?",
    "Anxiety often involves our mind focusing on 'what if' scenarios. A helpful approach is to gently ask yourself: 'Is this thought helpful right now?' and 'What would I tell a good friend in this situation?' What comes up for you when you consider these questions?"
  ],
  sadness: [
    "Thank you for sharing these difficult feelings with me. Sadness is a natural human emotion that often signals something important to us. Research shows that allowing ourselves to feel sadness, rather than pushing it away, can be part of healthy emotional processing. What do you think your sadness might be telling you?",
    "I'm sorry you're going through this difficult time. Sometimes when we're sad, it can help to practice self-compassion - treating ourselves with the same kindness we'd show a good friend. What would you say to comfort a friend who was feeling exactly as you do right now?",
    "Sadness can feel heavy and isolating. Studies show that gentle movement, even just a short walk, can help shift our emotional state. When you're ready, what's one small, nurturing thing you could do for yourself today?"
  ],
  stress: [
    "Stress affects us all, and recognizing it is the first step toward managing it effectively. Research indicates that our breathing directly impacts our stress response. Would you be open to trying a brief breathing exercise together - inhaling for 4 counts, holding for 4, and exhaling for 6?",
    "It sounds like you're carrying a lot right now. Stress often comes from feeling like we have too much to handle at once. Sometimes it helps to break things down: what's one specific thing that's contributing to your stress that we could explore together?",
    "Chronic stress can impact both our mental and physical well-being. Evidence-based stress management often involves identifying what's within our control versus what isn't. What aspects of your current situation feel most within your influence right now?"
  ],
  loneliness: [
    "Loneliness is one of the most universal human experiences, yet it can feel so isolating. Research shows that even brief, meaningful connections can help. I'm glad you're reaching out here. What does connection mean to you, and what has helped you feel less alone in the past?",
    "Feeling lonely doesn't necessarily mean being alone - sometimes we can feel lonely even when surrounded by people. This suggests loneliness is often about the quality of connection rather than quantity. What kind of connection are you most longing for right now?",
    "Studies indicate that helping others or engaging in meaningful activities can help combat loneliness by creating a sense of purpose and connection. What activities or causes have felt meaningful to you in the past?"
  ],
  anger: [
    "Anger often carries important information about our boundaries, values, or unmet needs. Rather than judging the anger, it can be helpful to get curious about what it's trying to tell you. What do you think might be underneath this anger?",
    "Feeling angry is completely valid - it's often a signal that something important to you has been threatened or violated. Research shows that acknowledging anger without acting impulsively can be powerful. What would it look like to honor this feeling while also taking care of yourself?",
    "Anger can be energizing but also exhausting. Evidence-based approaches often involve finding healthy ways to express and channel this energy. What has helped you process difficult emotions like this in the past?"
  ],
  overwhelm: [
    "Feeling overwhelmed often happens when we're trying to hold too much at once. It's like our emotional cup is overflowing. One approach that research supports is the practice of 'emotional triage' - identifying what needs immediate attention versus what can wait. What feels most urgent for you right now?",
    "When we're overwhelmed, our thinking can become scattered. A helpful technique is to focus on just the next single step, rather than the whole mountain. What's one small, manageable thing you could focus on right now?",
    "Overwhelm often signals that we need to pause and recalibrate. Studies show that even brief moments of mindfulness can help restore our sense of balance. Would you be open to taking three deep breaths together and noticing what you're experiencing right now?"
  ],
  general: [
    "Thank you for sharing that with me. It takes courage to explore our inner experiences. What would it feel like to approach this situation with curiosity rather than judgment?",
    "I'm listening. Sometimes it helps to step back and ask: 'What would I need right now to feel even 10% better?' What comes to mind for you?",
    "Your feelings make complete sense given what you're experiencing. If you were to imagine your wisest, most compassionate self, what might they say to you right now?",
    "It sounds like you're navigating something complex. Research shows that simply naming and acknowledging our experiences can be therapeutic in itself. How does it feel to put words to what you're going through?",
    "I appreciate you trusting me with these feelings. Sometimes healing happens not through fixing or changing, but through being truly seen and understood. What feels most important for you to be heard about right now?"
  ]
}

const COPING_STRATEGIES = [
  {
    name: "Box Breathing",
    description: "Inhale for 4, hold for 4, exhale for 4, hold for 4. Repeat 4-6 times.",
    category: "anxiety"
  },
  {
    name: "5-4-3-2-1 Grounding",
    description: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
    category: "anxiety"
  },
  {
    name: "Self-Compassion Break",
    description: "Acknowledge your pain, remember you're not alone, and offer yourself kindness.",
    category: "general"
  },
  {
    name: "Progressive Muscle Relaxation",
    description: "Tense and release each muscle group, starting from your toes up to your head.",
    category: "stress"
  },
  {
    name: "Emotional Check-in",
    description: "Ask yourself: What am I feeling? Where do I feel it in my body? What do I need right now?",
    category: "general"
  }
]

const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm', 'die', 'death',
  'hopeless', 'no point', 'better off dead', 'can\'t go on', 'want to die'
]

export default function Companion() {
  const { profile } = useAuth()
  const { messages, saveMessage, addReaction, startNewConversation } = useCompanion()
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Add welcome message when component mounts
  useEffect(() => {
    if (messages.length === 0 && !hasInitialized && profile) {
      setHasInitialized(true)
      const welcomeMessage = `Hello ${profile.first_name}! I'm your Aura companion - a supportive space for emotional wellness and self-reflection.

**Important Disclaimer:** I'm an AI assistant designed to provide general emotional support and wellness information. I am not a licensed therapist, counselor, or medical professional. If you're experiencing a mental health crisis, thoughts of self-harm, or need professional help, please contact:

• **Crisis Text Line**: Text HOME to 741741
• **National Suicide Prevention Lifeline**: 988
• **Emergency Services**: 911

I'm here to listen, offer evidence-based coping strategies, and help you explore your feelings in a supportive way. How are you feeling today, ${profile.first_name}?`
      
      saveMessage(welcomeMessage, false, 'warning')
    }
  }, [messages.length, hasInitialized, profile, saveMessage])

  const detectEmotionalTheme = (text: string): string => {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('anxious') || lowerText.includes('worried') || lowerText.includes('panic') || lowerText.includes('nervous')) {
      return 'anxiety'
    }
    if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('down') || lowerText.includes('crying')) {
      return 'sadness'
    }
    if (lowerText.includes('stressed') || lowerText.includes('pressure') || lowerText.includes('overwhelmed') || lowerText.includes('too much')) {
      return 'stress'
    }
    if (lowerText.includes('lonely') || lowerText.includes('alone') || lowerText.includes('isolated') || lowerText.includes('disconnected')) {
      return 'loneliness'
    }
    if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('furious') || lowerText.includes('frustrated')) {
      return 'anger'
    }
    if (lowerText.includes('overwhelmed') || lowerText.includes('can\'t handle') || lowerText.includes('too much')) {
      return 'overwhelm'
    }
    
    return 'general'
  }

  const checkForCrisisLanguage = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    return CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword))
  }

  const generateResponse = (userMessage: string): { content: string; type: 'normal' | 'warning' | 'resource' } => {
    const theme = detectEmotionalTheme(userMessage)
    const isCrisis = checkForCrisisLanguage(userMessage)
    
    if (isCrisis) {
      return {
        content: `${profile?.first_name}, I'm very concerned about what you've shared. Your safety is the most important thing right now. Please reach out for immediate professional support:

**Crisis Text Line**: Text HOME to 741741
**National Suicide Prevention Lifeline**: Call or text 988
**Emergency Services**: Call 911

You don't have to go through this alone. There are people trained to help who want to support you through this difficult time. Please consider reaching out to one of these resources right now.

Would you like me to help you think about who in your life you could also reach out to for support?`,
        type: 'warning'
      }
    }

    const responses = EMOTIONAL_RESPONSES[theme as keyof typeof EMOTIONAL_RESPONSES] || EMOTIONAL_RESPONSES.general
    let selectedResponse = responses[Math.floor(Math.random() * responses.length)]
    
    // Personalize the response with the user's name occasionally
    if (Math.random() < 0.3 && profile?.first_name) {
      selectedResponse = `${profile.first_name}, ${selectedResponse.toLowerCase()}`
    }
    
    return {
      content: selectedResponse,
      type: 'normal'
    }
  }

  const simulateAIResponse = async (userMessage: string) => {
    setIsTyping(true)
    
    try {
      // Simulate AI thinking time
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
      
      const response = generateResponse(userMessage)
      await saveMessage(response.content, false, response.type)
      
      // Occasionally offer coping strategies
      if (Math.random() < 0.3) {
        setTimeout(async () => {
          const theme = detectEmotionalTheme(userMessage)
          const relevantStrategies = COPING_STRATEGIES.filter(s => s.category === theme || s.category === 'general')
          
          if (relevantStrategies.length > 0) {
            const strategy = relevantStrategies[Math.floor(Math.random() * relevantStrategies.length)]
            const strategyContent = `Here's a coping technique that might help:\n\n**${strategy.name}**\n${strategy.description}\n\nWould you like to try this together, or would you prefer to explore something else?`
            await saveMessage(strategyContent, false, 'resource')
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const sendMessage = async () => {
    if (inputText.trim() && !isTyping) {
      const messageContent = inputText.trim()
      setInputText('')
      
      try {
        // Save user message
        await saveMessage(messageContent, true)
        
        // Generate AI response
        await simulateAIResponse(messageContent)
      } catch (error) {
        console.error('Error sending message:', error)
        setIsTyping(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const showResources = async () => {
    const resourceContent = `Here are some professional resources that might be helpful:

${PROFESSIONAL_RESOURCES.map(resource => 
  `**${resource.name}**\n${resource.contact}\n${resource.description}`
).join('\n\n')}

Remember, seeking professional help is a sign of strength, not weakness. These resources are staffed by trained professionals who can provide the specialized support you deserve.`
    
    await saveMessage(resourceContent, false, 'resource')
  }

  const handleReaction = async (messageId: string, reactionType: 'helpful' | 'not_helpful' | 'heart' | 'thumbs_up' | 'thumbs_down') => {
    await addReaction(messageId, reactionType)
    setShowReactions(null)
  }

  const getReactionCount = (message: CompanionMessage, reactionType: string) => {
    return message.reactions?.filter(r => r.reaction_type === reactionType).length || 0
  }

  const hasUserReacted = (message: CompanionMessage, reactionType: string) => {
    return message.reactions?.some(r => r.reaction_type === reactionType) || false
  }

  const handleNewConversation = async () => {
    setHasInitialized(false)
    await startNewConversation()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
              <Sparkles size={24} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Aura Companion</h1>
              <p className="text-sm text-gray-400">
                {profile ? `Supporting ${profile.first_name}` : 'Evidence-based emotional support'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={showResources}
              className="flex items-center space-x-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ExternalLink size={16} />
              <span>Resources</span>
            </button>
            
            <button
              onClick={handleNewConversation}
              className="flex items-center space-x-1 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <X size={16} />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.is_user ? 'justify-end' : 'justify-start'} items-end space-x-2 group`}
              >
                {!message.is_user && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.message_type === 'warning' ? 'bg-red-500/20' : 
                    message.message_type === 'resource' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                  }`}>
                    {message.message_type === 'warning' ? (
                      <AlertTriangle size={16} className="text-red-400" />
                    ) : message.message_type === 'resource' ? (
                      <ExternalLink size={16} className="text-blue-400" />
                    ) : (
                      <Sparkles size={16} className="text-purple-400" />
                    )}
                  </div>
                )}
                
                <div className="flex flex-col max-w-xs lg:max-w-md">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.is_user
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : message.message_type === 'warning'
                        ? 'bg-red-900/30 border border-red-500/30 text-red-100 rounded-bl-sm'
                        : message.message_type === 'resource'
                        ? 'bg-blue-900/30 border border-blue-500/30 text-blue-100 rounded-bl-sm'
                        : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.is_user ? 'text-purple-200' : 
                      message.message_type === 'warning' ? 'text-red-300' :
                      message.message_type === 'resource' ? 'text-blue-300' : 'text-gray-400'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>

                  {/* Reactions */}
                  {!message.is_user && (
                    <div className="flex items-center justify-between mt-2 px-2">
                      <div className="flex items-center space-x-2">
                        {/* Reaction counts */}
                        {getReactionCount(message, 'heart') > 0 && (
                          <span className="flex items-center space-x-1 text-xs text-red-400">
                            <Heart size={12} className="fill-current" />
                            <span>{getReactionCount(message, 'heart')}</span>
                          </span>
                        )}
                        {getReactionCount(message, 'thumbs_up') > 0 && (
                          <span className="flex items-center space-x-1 text-xs text-green-400">
                            <ThumbsUp size={12} className="fill-current" />
                            <span>{getReactionCount(message, 'thumbs_up')}</span>
                          </span>
                        )}
                        {getReactionCount(message, 'helpful') > 0 && (
                          <span className="flex items-center space-x-1 text-xs text-blue-400">
                            <HelpCircle size={12} className="fill-current" />
                            <span>{getReactionCount(message, 'helpful')}</span>
                          </span>
                        )}
                      </div>

                      {/* Reaction button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-300 transition-all text-xs px-2 py-1 rounded"
                        >
                          React
                        </button>

                        {/* Reaction menu */}
                        <AnimatePresence>
                          {showReactions === message.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg p-2 flex space-x-2 shadow-lg z-10"
                            >
                              <button
                                onClick={() => handleReaction(message.id, 'heart')}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${
                                  hasUserReacted(message, 'heart') ? 'text-red-400' : 'text-gray-400'
                                }`}
                                title="Love this"
                              >
                                <Heart size={16} className={hasUserReacted(message, 'heart') ? 'fill-current' : ''} />
                              </button>
                              <button
                                onClick={() => handleReaction(message.id, 'thumbs_up')}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${
                                  hasUserReacted(message, 'thumbs_up') ? 'text-green-400' : 'text-gray-400'
                                }`}
                                title="Thumbs up"
                              >
                                <ThumbsUp size={16} className={hasUserReacted(message, 'thumbs_up') ? 'fill-current' : ''} />
                              </button>
                              <button
                                onClick={() => handleReaction(message.id, 'thumbs_down')}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${
                                  hasUserReacted(message, 'thumbs_down') ? 'text-red-400' : 'text-gray-400'
                                }`}
                                title="Thumbs down"
                              >
                                <ThumbsDown size={16} className={hasUserReacted(message, 'thumbs_down') ? 'fill-current' : ''} />
                              </button>
                              <button
                                onClick={() => handleReaction(message.id, 'helpful')}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors ${
                                  hasUserReacted(message, 'helpful') ? 'text-blue-400' : 'text-gray-400'
                                }`}
                                title="Helpful"
                              >
                                <HelpCircle size={16} className={hasUserReacted(message, 'helpful') ? 'fill-current' : ''} />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-start items-end space-x-2"
              >
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-purple-400" />
                </div>
                <div className="bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end space-x-2 bg-gray-700 rounded-2xl p-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isTyping ? "AI is responding..." : "Share what's on your mind..."}
              className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none p-2 max-h-32"
              rows={1}
              maxLength={500}
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isTyping}
              className={`p-2 rounded-xl transition-colors ${
                inputText.trim() && !isTyping
                  ? 'text-purple-400 hover:bg-purple-400/10'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">
              This is not professional therapy. For crisis support, text HOME to 741741 or call 988.
            </p>
          </div>
        </div>
      </div>

      {/* Click outside to close reactions */}
      {showReactions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowReactions(null)}
        />
      )}
    </div>
  )
}