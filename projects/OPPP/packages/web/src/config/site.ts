import { env } from "@/env.mjs"

export const siteConfig = {
  name: "Sonad",
  author: "Sonad Team",
  description: "Sonad - A privacy-preserving social music platform on Monad",
  keywords: ["sonad", "music", "privacy", "monad", "blockchain", "social"],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "https://sonad.app",
  },
  twitter: "@sonad_app",
  favicon: "/favicon.ico",
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
}
