export const TAG_LIST = [
  // Start Generation Here
  {
    label: 'Trending',
    slug: 'trending',
    tile: 'Trending Markets 🚀',
    description:
      'Explore the most active and discussed markets currently trending.',
  },
  {
    label: 'Politics',
    slug: 'politics',
    tile: 'Politics 🌍',
    description:
      'Dive into the latest political events and predictions shaping the world.',
  },
  {
    label: 'World',
    slug: 'world',
    tile: 'World 🌍',
    description:
      'Discover global events and their potential impacts on the markets.',
  },
  {
    label: 'Sports',
    slug: 'sports',
    tile: 'Sports 🏆',
    description:
      'Predict outcomes of major sports events and tournaments worldwide.',
  },
  {
    label: 'Crypto',
    slug: 'crypto',
    tile: 'Crypto 💰',
    description:
      'Stay ahead with predictions on cryptocurrency market movements.',
  },
  {
    label: 'Tech',
    slug: 'tech',
    tile: 'Tech 💻',
    description:
      'Uncover predictions in the fast-evolving world of technology.',
  },
  {
    label: 'Other',
    slug: 'other',
    tile: 'Other',
    description: `Explore various markets and predictions that don't fit into the main categories.`,
  },
];

export enum ENUM_TAG {
  TRENDING = 'trending',
  POLITICS = 'politics',
  WORLD = 'world',
  SPORTS = 'sports',
  CRYPTO = 'crypto',
  TECH = 'tech',
  OTHER = 'other',
}

export const CHAIN_LIST = [
  ENUM_TAG.TRENDING,
  ENUM_TAG.POLITICS,
  // ENUM_TAG.WORLD,
  ENUM_TAG.SPORTS,
  ENUM_TAG.CRYPTO,
  ENUM_TAG.TECH,
  // ENUM_TAG.OTHER,
];

export const getTagBySlug = (tag: ENUM_TAG) => {
  const tagFind = TAG_LIST.find((t) => t.slug === tag.toLowerCase());

  return (
    tagFind || {
      label: 'Other',
      slug: 'other',
      tile: 'Other',
      description: 'Other',
    }
  );
};
