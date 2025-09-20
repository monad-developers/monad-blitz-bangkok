import {
  BarChart3,
  FileText,
  Globe,
  Home,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export const sidebarItems = [
  {
    title: "Home",
    icon: <Home className="h-5 w-5" />,
    isActive: true,
    url: "/",
  },
  {
    title: "Trending",
    icon: <TrendingUp className="h-5 w-5" />,
    isActive: false,
    badge: "Hot",
    items: [
      {
        title: "Bitcoin Predictions",
        url: "/trending/bitcoin",
      },
      {
        title: "Ethereum Predictions",
        url: "/trending/ethereum",
      },
      {
        title: "Solana Predictions",
        url: "/trending/solana",
      },
    ],
  },
  {
    title: "Analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    isActive: false,
    items: [
      {
        title: "Market Overview",
        url: "/analytics/market",
      },
      {
        title: "Portfolio Performance",
        url: "/analytics/portfolio",
      },
      {
        title: "Risk Analysis",
        url: "/analytics/risk",
      },
    ],
  },
  {
    title: "Community",
    icon: <Users className="h-5 w-5" />,
    isActive: false,
    badge: "New",
    items: [
      {
        title: "Discussions",
        url: "/community/discussions",
      },
      {
        title: "Leaderboard",
        url: "/community/leaderboard",
      },
      {
        title: "Events",
        url: "/community/events",
      },
    ],
  },
  {
    title: "Learn",
    icon: <FileText className="h-5 w-5" />,
    isActive: false,
    items: [
      {
        title: "Tutorials",
        url: "/learn/tutorials",
      },
      {
        title: "Guides",
        url: "/learn/guides",
      },
      {
        title: "Resources",
        url: "/learn/resources",
      },
    ],
  },
  {
    title: "Tools",
    icon: <Zap className="h-5 w-5" />,
    isActive: false,
    items: [
      {
        title: "Calculator",
        url: "/tools/calculator",
      },
      {
        title: "Converter",
        url: "/tools/converter",
      },
      {
        title: "Charts",
        url: "/tools/charts",
      },
    ],
  },
  {
    title: "News",
    icon: <Globe className="h-5 w-5" />,
    isActive: false,
    items: [
      {
        title: "Crypto News",
        url: "/news/crypto",
      },
      {
        title: "Market Updates",
        url: "/news/market",
      },
      {
        title: "Regulations",
        url: "/news/regulations",
      },
    ],
  },
  {
    title: "Security",
    icon: <Shield className="h-5 w-5" />,
    isActive: false,
    items: [
      {
        title: "Two-Factor Auth",
        url: "/security/2fa",
      },
      {
        title: "API Keys",
        url: "/security/api-keys",
      },
      {
        title: "Audit Logs",
        url: "/security/audit",
      },
    ],
  },
];
