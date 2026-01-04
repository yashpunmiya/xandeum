import { getCode } from 'country-list';

export function getCountryCode(countryName: string): string | null {
    if (!countryName || countryName === 'Unknown') return null;

    const cleanName = countryName.trim();
    const normalized = cleanName.toLowerCase();

    // Common manual overrides for mismatched API names
    if (normalized === 'usa' || normalized.includes('united states')) return 'us';
    if (normalized.includes('united kingdom') || normalized === 'uk' || normalized === 'great britain') return 'gb';
    if (normalized === 'russia' || normalized.includes('russian')) return 'ru';
    if (normalized === 'south korea' || normalized === 'korea, republic of') return 'kr';
    if (normalized === 'netherlands' || normalized === 'the netherlands') return 'nl';
    if (normalized === 'germany') return 'de'; // Explicit check just in case

    // Try standard lookup
    const code = getCode(cleanName) || getCode(normalized);
    return code ? code.toLowerCase() : null;
}

export function getFlagUrl(countryCode: string | null): string | null {
    if (!countryCode) return null;
    return `https://flagcdn.com/24x18/${countryCode}.png`;
}
