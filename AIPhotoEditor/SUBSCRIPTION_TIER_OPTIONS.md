# Subscription Tier Selection UI Options

## Option 1: Vertical Stacked Cards (Full Width)
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │ ✓ Basic                     │   │
│  │   Perfect for casual users  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✓ Pro (Selected)            │   │
│  │   For creative professionals│   │
│  │   [Highlighted: light teal] │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Premium                    │   │
│  │   Everything + exclusive    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

Pros: No scrolling, clear hierarchy, easy touch targets
Cons: Takes more vertical space
```

## Option 2: Horizontal Segmented Control (iOS Style)
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│                                     │
│  ┌───────┬──────────┬──────────┐   │
│  │ Basic │ Pro [✓]  │ Premium  │   │
│  └───────┴──────────┴──────────┘   │
│      [Equal width, no gaps]         │
│                                     │
└─────────────────────────────────────┘

Pros: Compact, familiar iOS pattern, no scroll
Cons: Less space for descriptions, might feel cramped
```

## Option 3: Horizontal Buttons (No Scroll, Equal Widths)
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  Basic   │  │   Pro    │        │
│  │  Casual  │  │ Creative │        │
│  │          │  │  [✓ sel] │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────┐                      │
│  │ Premium  │                      │
│  │ Exclusive│                      │
│  └──────────┘                      │
│                                     │
└─────────────────────────────────────┘

Pros: Compact, clean, no scrolling needed
Cons: Might wrap on smaller screens
```

## Option 4: Grid Layout (3 Columns)
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐        │
│  │Basic│  │ Pro │  │Prem │        │
│  │     │  │ [✓] │  │     │        │
│  └─────┘  └─────┘  └─────┘        │
│   Casual   Creative  Exclusive      │
│                                     │
└─────────────────────────────────────┘

Pros: Very compact, all visible at once
Cons: Very little space for text, might feel tight
```

## Option 5: Tab-Style with Icons (Horizontal)
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ Basic│ │Pro [✓]│ │Prem. │      │
│  │  📱  │ │  💼  │ │  ⭐  │      │
│  └──────┘ └──────┘ └──────┘      │
│                                     │
└─────────────────────────────────────┘

Pros: Very compact, icons add visual interest
Cons: Limited text space
```

## Option 6: Comparison Table Style (Compact)
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┬──────┬──────┬──────┐  │
│  │         │Basic │ Pro  │Prem. │  │
│  ├─────────┼──────┼──────┼──────┤  │
│  │Transforms│ 50  │ ∞    │  ∞   │  │
│  │Quality  │Standard│High │4K    │  │
│  │Cloud    │  -   │  -   │ 1TB  │  │
│  └─────────┴──────┴──────┴──────┘  │
│  [Radio buttons below each column]  │
│                                     │
└─────────────────────────────────────┘

Pros: Shows comparison clearly, compact
Cons: Less visual, more data-focused
```

## Option 7: Pill/Tab Style (Smooth Connected)
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│                                     │
│  ┏━━━━━━━┓ ┏━━━━━━━━┓ ┏━━━━━━━┓   │
│  ┃ Basic ┃ ┃  Pro   ┃ ┃Premium┃   │
│  ┃       ┃ ┃  [✓]   ┃ ┃       ┃   │
│  ┗━━━━━━━┛ ┗━━━━━━━━┛ ┗━━━━━━━┛   │
│     ─────    ══════    ─────       │
│   (selected has underline accent)  │
│                                     │
└─────────────────────────────────────┘

Pros: Modern, clean, iOS-inspired
Cons: Still needs descriptions somewhere
```

## Option 8: Vertical Cards with Pricing Preview
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  Basic            $4.99/mo  │   │
│  │  Perfect for casual users   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✓ Pro            $9.99/mo   │   │
│  │   For creative professionals │   │
│  │   [Selected highlight]      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Premium         $14.99/mo  │   │
│  │  Everything + exclusive     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

Pros: Shows pricing upfront, clear comparison
Cons: Takes vertical space (but no scroll!)
```

## Option 9: Horizontal Pills with Selection Indicator
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│                                     │
│  ( Basic )  [ Pro ]  ( Premium )   │
│             ^^^^                    │
│         Selected: highlighted       │
│         + bottom accent line       │
│                                     │
└─────────────────────────────────────┘

Pros: Minimal vertical space, modern
Cons: Need to show descriptions elsewhere
```

## Option 10: Accordion/Expandable Cards
```
┌─────────────────────────────────────┐
│  Choose Your Plan                  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  Basic            $4.99/mo  │   │
│  │  > Perfect for casual       │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✓ Pro            $9.99/mo   │   │
│  │   For creative professionals│   │
│  │   • Feature 1               │   │
│  │   • Feature 2               │   │
│  │   [Expanded, selected]      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Premium         $14.99/mo  │   │
│  │  > Everything + exclusive   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

Pros: Shows details on selection, saves space
Cons: Requires tap to expand (extra interaction)
```

---

## Recommendation

**Option 2 (Segmented Control)** or **Option 7 (Pill Style)** are best for:
- ✅ No scrolling required
- ✅ Compact vertical space
- ✅ Familiar iOS pattern
- ✅ Easy to implement
- ✅ Clean and modern

**Option 8 (Vertical Cards with Pricing)** is best if:
- You want pricing visible upfront
- You have space for vertical layout
- You want to show more detail per tier

**Option 1 (Vertical Stacked)** is best if:
- You want maximum clarity
- Vertical space isn't a concern
- You want full descriptions visible

