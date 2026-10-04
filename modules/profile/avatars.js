// ============================================
// CAREER OS — PROFILE AVATARS & COLORS
// ============================================


// ============================================
// AVATAR SETS
// ============================================

export const AVATAR_SETS = {

  classic: [
    "🐱",
    "🦊",
    "🐺",
    "🦁",
    "🐯",
    "🐼",
  ],

  friendly: [
    "🐨",
    "🦉",
    "🐸",
    "🐵",
    "🦌",
    "🐰",
  ],

  wild: [
    "🐉",
    "🐲",
    "🦅",
    "🐍",
    "🦈",
    "🦇",
  ],

  special: [
    "🐙",
    "🦄",
    "👾",
    "🤖",
    "👽",
    "🔥",
  ],

};


// ============================================
// AVATAR SET DISPLAY NAMES
// ============================================

export const AVATAR_SET_NAMES = {

  classic: "Classic",
  friendly: "Friendly",
  wild: "Wild",
  special: "Special",

};


// ============================================
// FLAT AVATAR LIST
// ============================================
// Kept for compatibility with the rest of
// Career OS.

export const AVATAR_EMOJIS = [

  ...AVATAR_SETS.classic,
  ...AVATAR_SETS.friendly,
  ...AVATAR_SETS.wild,
  ...AVATAR_SETS.special,

];


// ============================================
// AVATAR COLOR SETS
// ============================================

export const AVATAR_COLOR_SETS = {

  neutrals: [
    "#F8FAFC", // Pearl
    "#94A3B8", // Silver
    "#18181B", // Obsidian
  ],

  warm: [
    "#EF4444", // Crimson
    "#F97316", // Orange
    "#F59E0B", // Amber
    "#EAB308", // Gold
  ],

  cool: [
    "#22C55E", // Emerald
    "#14B8A6", // Teal
    "#06B6D4", // Cyan
    "#3B82F6", // Azure
  ],

  premium: [
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#EC4899", // Rose
    "#D946EF", // Magenta
  ],

};


// ============================================
// COLOR SET DISPLAY NAMES
// ============================================

export const AVATAR_COLOR_SET_NAMES = {

  neutrals: "Neutrals",
  warm: "Warm",
  cool: "Cool",
  premium: "Premium",

};


// ============================================
// FLAT COLOR LIST
// ============================================
// Kept for compatibility with existing code.

export const AVATAR_COLORS = [

  ...AVATAR_COLOR_SETS.neutrals,
  ...AVATAR_COLOR_SETS.warm,
  ...AVATAR_COLOR_SETS.cool,
  ...AVATAR_COLOR_SETS.premium,

];


// ============================================
// COLOR METADATA
// ============================================

export const AVATAR_COLOR_META = [

  {
    name: "Pearl",
    hex: "#F8FAFC",
    set: "neutrals",
  },

  {
    name: "Silver",
    hex: "#94A3B8",
    set: "neutrals",
  },

  {
    name: "Obsidian",
    hex: "#18181B",
    set: "neutrals",
  },

  {
    name: "Crimson",
    hex: "#EF4444",
    set: "warm",
  },

  {
    name: "Orange",
    hex: "#F97316",
    set: "warm",
  },

  {
    name: "Amber",
    hex: "#F59E0B",
    set: "warm",
  },

  {
    name: "Gold",
    hex: "#EAB308",
    set: "warm",
  },

  {
    name: "Emerald",
    hex: "#22C55E",
    set: "cool",
  },

  {
    name: "Teal",
    hex: "#14B8A6",
    set: "cool",
  },

  {
    name: "Cyan",
    hex: "#06B6D4",
    set: "cool",
  },

  {
    name: "Azure",
    hex: "#3B82F6",
    set: "cool",
  },

  {
    name: "Indigo",
    hex: "#6366F1",
    set: "premium",
  },

  {
    name: "Violet",
    hex: "#8B5CF6",
    set: "premium",
  },

  {
    name: "Rose",
    hex: "#EC4899",
    set: "premium",
  },

  {
    name: "Magenta",
    hex: "#D946EF",
    set: "premium",
  },

];


// ============================================
// AVATAR DISPLAY HELPER
// ============================================

export function getAvatarDisplay(profile) {

  if (profile?.avatarUrl) {

    return {

      type: "image",

      url: profile.avatarUrl,

      emoji:
        profile?.avatarEmoji ||
        AVATAR_EMOJIS[0],

      color:
        profile?.avatarColor ||
        AVATAR_COLORS[0],

    };

  }


  return {

    type: "emoji",

    emoji:
      profile?.avatarEmoji ||
      AVATAR_EMOJIS[0],

    color:
      profile?.avatarColor ||
      AVATAR_COLORS[0],

  };

}