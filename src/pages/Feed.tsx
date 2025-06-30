import { useState } from 'react'
import { Plus, Heart, MessageCircle, X, Loader2, AlertCircle, Send, Users, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePosts, type PostReaction } from '../hooks/usePosts'
import { useAuth } from '../contexts/AuthContext'

const EMOTIONS = [
  { name: 'Happy', color: '#FCD34D', emoji: '😊' },
  { name: 'Anxious', color: '#F87171', emoji: '😰' },
  { name: 'Grateful', color: '#34D399', emoji: '🙏' },
  { name: 'Overwhelmed', color: '#A78BFA', emoji: '😵' },
  { name: 'Lonely', color: '#60A5FA', emoji: '😔' },
  { name: 'Excited', color: '#FBBF24', emoji: '🤩' },
  { name: 'Confused', color: '#FB7185', emoji: '😕' },
  { name: 'Peaceful', color: '#6EE7B7', emoji: '😌' },
]

const REACTION_TYPES = [
  { type: 'heart' as const, emoji: '❤️', label: 'Love' },
  { type: 'thumbs_up' as const, emoji: '👍', label: 'Support' },
  { type: 'thumbs_down' as const, emoji: '👎', label: 'Disagree' },
  { type: 'hug' as const, emoji: '🤗', label: 'Hug' },
  { type: 'support' as const, emoji: '💪', label: 'Strength' },
]

// Default user info when no user is logged in or for demo purposes
const DEFAULT_USER = {
  name: 'Ganapathi Hegde',
  email: 'grhegde@gmail.com'
}

export default function Feed() {
  const { profile } = useAuth()
  const { posts, loading, error, createPost, toggleHeart, addComment, addReaction, loadCommentsForPost } = usePosts()
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [showComments, setShowComments] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isCommenting, setIsCommenting] = useState(false)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [loadingComments, setLoadingComments] = useState<string | null>(null)

  // Get current user info for display
  const getCurrentUser = () => {
    if (profile) {
      return {
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email
      }
    }
    return DEFAULT_USER
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const getEmotionColor = (emotionName: string) => {
    return EMOTIONS.find(e => e.name === emotionName)?.color || '#8B5CF6'
  }

  const getEmotionEmoji = (emotionName: string) => {
    return EMOTIONS.find(e => e.name === emotionName)?.emoji || '💭'
  }

  const toggleEmotion = (emotionName: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotionName) 
        ? prev.filter(e => e !== emotionName)
        : [...prev, emotionName]
    )
  }

  const handleCreatePost = async () => {
    if (newPostContent.trim() && selectedEmotions.length > 0) {
      try {
        setIsCreating(true)
        const currentUser = getCurrentUser()
        await createPost(newPostContent.trim(), selectedEmotions, currentUser.name, currentUser.email)
        setNewPostContent('')
        setSelectedEmotions([])
        setShowNewPostModal(false)
      } catch (err) {
        console.error('Failed to create post:', err)
      } finally {
        setIsCreating(false)
      }
    }
  }

  const handleAddComment = async (postId: string) => {
    if (commentText.trim()) {
      try {
        setIsCommenting(true)
        const currentUser = getCurrentUser()
        await addComment(postId, commentText.trim(), currentUser.name, currentUser.email)
        setCommentText('')
      } catch (err) {
        console.error('Failed to add comment:', err)
      } finally {
        setIsCommenting(false)
      }
    }
  }

  const handleShowComments = async (postId: string) => {
    if (showComments === postId) {
      setShowComments(null)
    } else {
      setShowComments(postId)
      // Load comments if they haven't been loaded yet
      const post = posts.find(p => p.id === postId)
      if (post && (!post.comments_data || post.comments_data.length === 0) && post.comments > 0) {
        setLoadingComments(postId)
        try {
          await loadCommentsForPost(postId)
        } catch (err) {
          console.error('Failed to load comments:', err)
        } finally {
          setLoadingComments(null)
        }
      }
    }
  }

  const handleReaction = async (postId: string, reactionType: PostReaction['reaction_type']) => {
    await addReaction(postId, reactionType)
    setShowReactions(null)
  }

  const getReactionCount = (post: any, reactionType: string) => {
    return post.reactions?.filter((r: any) => r.reaction_type === reactionType).length || 0
  }

  const hasUserReacted = (post: any, reactionType: string) => {
    return post.reactions?.some((r: any) => r.reaction_type === reactionType) || false
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading your emotional feed...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Please make sure Supabase is connected</p>
        </div>
      </div>
    )
  }

  const currentUser = getCurrentUser()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 text-center border-b border-gray-700">
        <h1 className="text-3xl font-semibold text-white mb-1">Aura</h1>
        <p className="text-gray-400">A safe space for your emotions</p>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="max-w-2xl mx-auto space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No posts yet</h3>
              <p className="text-gray-500">Be the first to share your emotions</p>
            </div>
          ) : (
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-700 rounded-2xl p-4 border border-gray-600"
                >
                  {/* Post Header with User Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-white font-medium truncate">
                            {post.user_name}
                          </h3>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatTimeAgo(post.created_at)}
                          </span>
                        </div>
                        {post.user_email && (
                          <p className="text-gray-500 text-xs truncate">
                            {post.user_email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Emotions */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.emotions.map((emotion, idx) => (
                      <div
                        key={idx}
                        className="flex items-center px-2 py-1 rounded-full text-xs"
                        style={{ 
                          backgroundColor: getEmotionColor(emotion) + '20',
                          color: getEmotionColor(emotion)
                        }}
                      >
                        <span className="mr-1">{getEmotionEmoji(emotion)}</span>
                        <span className="font-medium">{emotion}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Post Content */}
                  <p className="text-gray-200 leading-relaxed mb-4">{post.content}</p>
                  
                  {/* Reactions Display */}
                  {post.reactions && post.reactions.length > 0 && (
                    <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-600">
                      {REACTION_TYPES.map(({ type, emoji }) => {
                        const count = getReactionCount(post, type)
                        if (count === 0) return null
                        
                        return (
                          <div key={type} className="flex items-center space-x-1 text-sm text-gray-400">
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Post Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => toggleHeart(post.id)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Heart 
                          size={20} 
                          className={post.hasHearted ? 'fill-red-400 text-red-400' : ''} 
                        />
                        <span className={`text-sm font-medium ${post.hasHearted ? 'text-red-400' : ''}`}>
                          {post.hearts}
                        </span>
                      </button>
                      
                      <button 
                        onClick={() => handleShowComments(post.id)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <MessageCircle size={20} />
                        <span className="text-sm font-medium">{post.comments}</span>
                      </button>
                    </div>

                    {/* Reaction Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowReactions(showReactions === post.id ? null : post.id)}
                        className="flex items-center space-x-1 text-gray-400 hover:text-gray-300 transition-colors text-sm px-3 py-1 rounded-lg hover:bg-gray-600"
                      >
                        <Users size={16} />
                        <span>React</span>
                      </button>

                      {/* Reaction Menu */}
                      <AnimatePresence>
                        {showReactions === post.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg p-2 flex space-x-2 shadow-lg z-10"
                          >
                            {REACTION_TYPES.map(({ type, emoji, label }) => (
                              <button
                                key={type}
                                onClick={() => handleReaction(post.id, type)}
                                className={`p-2 rounded hover:bg-gray-700 transition-colors text-lg ${
                                  hasUserReacted(post, type) ? 'bg-gray-600' : ''
                                }`}
                                title={label}
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {showComments === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-600"
                      >
                        {/* Loading Comments */}
                        {loadingComments === post.id && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 size={20} className="animate-spin text-purple-400 mr-2" />
                            <span className="text-gray-400 text-sm">Loading comments...</span>
                          </div>
                        )}

                        {/* Existing Comments */}
                        {post.comments_data && post.comments_data.length > 0 && (
                          <div className="space-y-3 mb-4">
                            {post.comments_data.map((comment) => (
                              <div key={comment.id} className="bg-gray-600 rounded-lg p-3">
                                {/* Comment Header with User Info */}
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User size={12} className="text-purple-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-white truncate">
                                        {comment.user_name}
                                      </span>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs text-gray-400">
                                        {formatTimeAgo(comment.created_at)}
                                      </span>
                                    </div>
                                    {comment.user_email && (
                                      <p className="text-xs text-gray-500 truncate">
                                        {comment.user_email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Comment Content */}
                                <p className="text-gray-200 text-sm leading-relaxed ml-8">
                                  {comment.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment */}
                        <div className="space-y-3">
                          {/* Current User Info */}
                          <div className="flex items-center space-x-2 px-3">
                            <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <User size={12} className="text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {currentUser.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {currentUser.email}
                              </p>
                            </div>
                          </div>

                          {/* Comment Input */}
                          <div className="flex items-end space-x-2">
                            <textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Share your thoughts..."
                              className="flex-1 bg-gray-600 text-white placeholder-gray-400 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                              rows={2}
                              maxLength={300}
                              disabled={isCommenting}
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentText.trim() || isCommenting}
                              className={`p-2 rounded-lg transition-colors ${
                                commentText.trim() && !isCommenting
                                  ? 'text-purple-400 hover:bg-purple-400/10'
                                  : 'text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {isCommenting ? (
                                <Loader2 size={20} className="animate-spin" />
                              ) : (
                                <Send size={20} />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowNewPostModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowNewPostModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                  disabled={isCreating}
                >
                  <X size={24} />
                </button>
                <h2 className="text-lg font-semibold text-white">Share Your Emotions</h2>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || selectedEmotions.length === 0 || isCreating}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    newPostContent.trim() && selectedEmotions.length > 0 && !isCreating
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isCreating && <Loader2 size={16} className="animate-spin" />}
                  <span>{isCreating ? 'Posting...' : 'Post'}</span>
                </button>
              </div>

              <div className="p-4 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                {/* User Info Display */}
                <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-gray-400 text-sm truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                {/* Emotion Selector */}
                <div>
                  <h3 className="text-white font-medium mb-3">How are you feeling?</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {EMOTIONS.map((emotion) => (
                      <button
                        key={emotion.name}
                        onClick={() => toggleEmotion(emotion.name)}
                        disabled={isCreating}
                        className={`flex items-center p-3 rounded-xl border-2 transition-all ${
                          selectedEmotions.includes(emotion.name)
                            ? 'border-current bg-current/10'
                            : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                        } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          color: selectedEmotions.includes(emotion.name) ? emotion.color : '#E5E7EB',
                          borderColor: selectedEmotions.includes(emotion.name) ? emotion.color : '#4B5563'
                        }}
                      >
                        <span className="text-lg mr-2">{emotion.emoji}</span>
                        <span className="font-medium">{emotion.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Input */}
                <div>
                  <h3 className="text-white font-medium mb-3">Share what's on your mind</h3>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Express yourself freely and authentically..."
                    disabled={isCreating}
                    className="w-full h-32 p-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                    maxLength={500}
                  />
                  <div className="text-right text-sm text-gray-400 mt-2">
                    {newPostContent.length}/500
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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