/**
 * Security utility functions for input sanitization
 */

/**
 * Escapes special regex characters in a string to prevent ReDoS attacks
 * @param str - The string to escape
 * @returns The escaped string safe for use in regex patterns
 * 
 * @example
 * escapeRegex("test@example.com") // Returns: "test@example\\.com"
 * escapeRegex("(a+)+") // Returns: "\\(a\\+\\)\\+"
 */
export function escapeRegex(str: string): string {
    if (!str || typeof str !== 'string') {
        return '';
    }
    // Escape all special regex characters: . * + ? ^ $ { } ( ) | [ ] \
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
