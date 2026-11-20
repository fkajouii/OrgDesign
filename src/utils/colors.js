/**
 * Deterministically hashes a string to a hue (0-359), then applies the
 * given saturation/lightness. `salt` shifts the hash so two different
 * category axes (e.g. Department vs Team) derived from similar-looking
 * names don't tend to land on the same color.
 */
export const colorForLabel = (label, { saturation = 70, lightness = 45, salt = '' } = {}) => {
    if (!label) return 'var(--color-primary)';
    const seeded = `${salt}${label}`;
    let hash = 0;
    for (let i = 0; i < seeded.length; i++) {
        hash = seeded.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
