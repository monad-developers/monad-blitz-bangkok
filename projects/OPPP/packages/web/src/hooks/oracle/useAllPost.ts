// get all post from local server
import { useEffect, useState } from "react"
import axios from "axios"

 interface MediaDto {
  media_key: string
  type: "photo" | "video" | "animated_gif"
  url: string | null
  preview_image_url: string | null
  width: number
  height: number
}

export interface TwitterPostDto {
  id: string
  author_id: string
  text: string
  created_at: string // ISO 8601 date string
  retweet_count: number
  reply_count: number
  like_count: number
  quote_count: number
  bookmark_count: number
  impression_count: number
  fetched_at: string // ISO 8601 date string
  updated_at: string // ISO 8601 date string
  username: string
  name: string
  profile_image_url: string
  media: MediaDto[]
}

export type TwitterPostsDto = TwitterPostDto[]

// get all post from local server

interface MediaDto {
  media_key: string
  type: "photo" | "video" | "animated_gif"
  url: string | null
  preview_image_url: string | null
  width: number
  height: number
}

interface Post {
  id: string
  author_id: string
  text: string
  created_at: string
  retweet_count: number
  reply_count: number
  like_count: number
  quote_count: number
  bookmark_count: number
  impression_count: number
  fetched_at: string
  updated_at: string
  username: string
  name: string
  profile_image_url: string
  media: MediaDto[]
}

interface UseAllPostReturn {
  posts: Post[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useAllPost = (): UseAllPostReturn => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get("http://localhost:5143/api/tweets")
      setPosts(response.data.tweets)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts,
  }
}
