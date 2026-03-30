// ── Card Layout Utility ──
// Calculates card overlap/compression for rows with many cards.

export function getCardVisibleWidth(
  containerWidth: number,
  cardWidth: number,
  cardCount: number
): number {
  if (cardCount <= 1) return cardWidth
  const available = containerWidth - cardWidth
  const visibleWidth = available / (cardCount - 1)
  return Math.max(16, Math.min(cardWidth, visibleWidth))
}

export function getCardOffset(
  index: number,
  visibleWidth: number
): number {
  return index * visibleWidth
}

export function getTotalCardsWidth(
  cardWidth: number,
  cardCount: number,
  visibleWidth: number
): number {
  if (cardCount === 0) return 0
  if (cardCount === 1) return cardWidth
  return visibleWidth * (cardCount - 1) + cardWidth
}
