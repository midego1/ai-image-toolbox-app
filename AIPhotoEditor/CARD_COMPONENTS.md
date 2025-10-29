# Card Components Architecture

## Current State: **Two Reusable Card Components**

You now have **two specialized, reusable card components** that serve different purposes:

---

## 1. `SettingItem` Component
**Purpose:** List-style cards with consistent layout (icon + title + subtitle + action)

**Used in:**
- ✅ Settings Screen
- ✅ Appearance Settings Screen  
- ✅ Features Screen (all feature list items)

**Features:**
- Icon (emoji, Ionicons, or custom React node)
- Title + optional subtitle
- Right side action (chevron, lock icon, value text, or custom)
- Premium badge support
- Grouped items with proper borders
- Disabled/locked state
- Consistent padding (`spacing.sm` = 8px)

**Props:**
```typescript
<SettingItem
  icon={emoji | iconName | ReactNode}
  title="Title"
  subtitle="Description"
  value="Optional value"
  showPremiumBadge={true}
  rightIcon="chevron" | "lock" | ReactNode
  disabled={false}
  onPress={() => {}}
  isFirstInGroup={true}
  isLastInGroup={false}
  showSeparator={true}
/>
```

---

## 2. `Card` Component
**Purpose:** Flexible wrapper for any custom content

**Used in:**
- ✅ EditModeSelectionScreen (grid of mode cards)
- ✅ ResultScreen (image cards, upgrade cards)

**Features:**
- Accepts any children (complete flexibility)
- Optional onPress
- Consistent base styling
- Can be customized via style prop

**Props:**
```typescript
<Card
  onPress={() => {}}
  disabled={false}
  style={customStyles}
>
  {/* Any content you want */}
</Card>
```

**Example usage:**
```tsx
<Card onPress={handlePress} style={{ width: '48%' }}>
  <Text>Icon</Text>
  <Text>Title</Text>
  <Text>Description</Text>
</Card>
```

---

## Summary

✅ **You have reusable components!**

- **`SettingItem`** → For all list-style cards (Settings, Features, Appearance)
- **`Card`** → For flexible cards with custom layouts (Edit modes, Result screens)

**Both share:**
- Same padding (`spacing.sm` = 8px vertical)
- Same theme integration
- Consistent visual style

**Future customization:** When you add card size preferences in Appearance settings, both components will read from `theme.cardSizing` to respond to user preferences automatically!

