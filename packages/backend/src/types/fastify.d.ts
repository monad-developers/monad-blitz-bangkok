import "@fastify/session";

declare module "fastify" {
  interface Session {
    twitterCodeVerifier?: string;
    twitterState?: string;
  }
}
