import descriptions from '../../practice/sign-descriptions.json';

/**
 * Get the instructional description for how to perform an ASL sign
 * @param signName - The name of the sign (e.g., "HELLO", "THANK YOU")
 * @returns The description text, or a fallback message if not found
 */
export function getSignDescription(signName: string): string {
  const normalized = signName.toUpperCase().trim();
  return (
    descriptions[normalized as keyof typeof descriptions] ||
    'Mirror the video and hold your gesture steady for a moment.'
  );
}

export default descriptions;

