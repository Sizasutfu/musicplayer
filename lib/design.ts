// lib/design.ts
import type { TextStyle, ViewStyle } from 'react-native';

// Precise shape for row tokens so arithmetic works
export type RowTokens = {
  paddingVertical: number;
  borderBottomWidth: number;
  borderBottomColor: string;
};

export type DesignSystem = {
  // Numbers
  spacing: { screen: number; section: number; item: number };
  radius: { card: number; item: number; pill: number; avatar: number };

  // Pre-composed styles
  card: ViewStyle;
  cardElevated: ViewStyle;
  header: ViewStyle;
  row: RowTokens;
  showRowDividers: boolean;

  // Typography
  type: {
    title: TextStyle;
    heading: TextStyle;
    body: TextStyle;
    sectionLabel: TextStyle;
    caption: TextStyle;
  };
};

// ── LIGHT — "Paper" ──────────────────────────────────────
export const LIGHT_DESIGN: DesignSystem = {
  spacing: { screen: 16, section: 20, item: 12 },
  radius: { card: 14, item: 10, pill: 20, avatar: 8 },

  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  cardElevated: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f2',
  },
  showRowDividers: true,

  type: {
    title: { fontSize: 22, fontWeight: '700', letterSpacing: 0 },
    heading: { fontSize: 17, fontWeight: '700', letterSpacing: 0 },
    body: { fontSize: 15, fontWeight: '500', letterSpacing: 0 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    caption: { fontSize: 12, fontWeight: '500' },
  },
};

// ── DARK — "Ink" ─────────────────────────────────────────
export const DARK_DESIGN: DesignSystem = {
  spacing: { screen: 16, section: 24, item: 14 },
  radius: { card: 18, item: 12, pill: 24, avatar: 10 },

  card: {
    borderRadius: 18,
    backgroundColor: '#1c1c1f',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardElevated: {
    borderRadius: 18,
    backgroundColor: '#232326',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  header: {
    backgroundColor: '#0e0e10',
  },
  row: {
    paddingVertical: 14,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  showRowDividers: false,

  type: {
    title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    body: { fontSize: 15, fontWeight: '600', letterSpacing: 0 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    caption: { fontSize: 12, fontWeight: '500' },
  },
};