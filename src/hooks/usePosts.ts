import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Post = Database['public']['Tables']['emotional_posts']['Row'] & {
  hasHearted: boolean
  comments_data?: PostComment[]
  reactions?: PostReaction[]
}

export interface PostComment {
  id: string
  post_id: string
  content: string
  user_name: string
  user_email: string
  created_at: string
  updated_at: string
}

export interface PostReaction {
  id: string
  post_id: string
  reaction_type: 'heart' | 'thumbs_up' | 'thumbs_down' | 'hug' | 'support'
  created_at: string
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load posts from database with their comments
  const fetchPosts = async () => {
    try {
      setLoading(true)
      
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('emotional_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Fetch comments for all posts
      const postIds = postsData.map(post => post.id)
      const { data: commentsData, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true })

      if (commentsError) {
        console.warn('Error fetching comments:', commentsError)
        // Don't throw error, just continue without comments
      }

      // Combine posts with their comments
      const postsWithComments = postsData.map(post => ({
        ...post,
        hasHearted: false,
        comments_data: commentsData?.filter(comment => comment.post_id === post.id) || [],
        reactions: []
      }))

      setPosts(postsWithComments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  // Create a new post
  const createPost = async (content: string, emotions: string[], userName: string, userEmail: string = '') => {
    try {
      const { data, error } = await supabase
        .from('emotional_posts')
        .insert({
          content,
          emotions,
          hearts: 0,
          comments: 0,
          user_name: userName,
          user_email: userEmail
        })
        .select()
        .single()

      if (error) throw error

      const newPost = {
        ...data,
        hasHearted: false,
        comments_data: [],
        reactions: []
      }

      setPosts(prev => [newPost, ...prev])
      return newPost
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
      throw err
    }
  }

  // Add a comment to a post
  const addComment = async (postId: string, content: string, userName: string, userEmail: string = '') => {
    try {
      // Insert the comment into the database
      const { data: commentData, error: commentError } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          content,
          user_name: userName,
          user_email: userEmail
        })
        .select()
        .single()

      if (commentError) throw commentError

      // Update the post's comment count
      const post = posts.find(p => p.id === postId)
      if (!post) return

      const newCommentsCount = post.comments + 1

      const { error: updateError } = await supabase
        .from('emotional_posts')
        .update({ comments: newCommentsCount })
        .eq('id', postId)

      if (updateError) throw updateError

      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              comments: newCommentsCount,
              comments_data: [...(p.comments_data || []), commentData]
            }
          : p
      ))

      return commentData
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
      throw err
    }
  }

  // Load comments for a specific post
  const loadCommentsForPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Update the post with loaded comments
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, comments_data: data }
          : p
      ))

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
      throw err
    }
  }

  // Add a reaction to a post
  const addReaction = async (postId: string, reactionType: PostReaction['reaction_type']) => {
    try {
      const post = posts.find(p => p.id === postId)
      if (!post) return

      // Check if user already reacted with this type (simulate user tracking)
      const existingReaction = post.reactions?.find(r => r.reaction_type === reactionType)
      
      if (existingReaction) {
        // Remove reaction
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? {
                ...p,
                reactions: p.reactions?.filter(r => r.id !== existingReaction.id) || []
              }
            : p
        ))
      } else {
        // Add new reaction
        const newReaction: PostReaction = {
          id: `temp_${Date.now()}`,
          post_id: postId,
          reaction_type: reactionType,
          created_at: new Date().toISOString()
        }

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? {
                ...p,
                reactions: [...(p.reactions || []), newReaction]
              }
            : p
        ))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction')
    }
  }

  // Toggle heart on a post
  const toggleHeart = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId)
      if (!post) return

      const newHearted = !post.hasHearted
      const newHearts = newHearted ? post.hearts + 1 : post.hearts - 1

      // Optimistically update UI
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, hasHearted: newHearted, hearts: newHearts }
          : p
      ))

      // Update database
      const { error } = await supabase
        .from('emotional_posts')
        .update({ hearts: newHearts })
        .eq('id', postId)

      if (error) {
        // Revert optimistic update on error
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, hasHearted: post.hasHearted, hearts: post.hearts }
            : p
        ))
        throw error
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update heart')
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return {
    posts,
    loading,
    error,
    createPost,
    toggleHeart,
    addComment,
    addReaction,
    loadCommentsForPost,
    refetch: fetchPosts
  }
}