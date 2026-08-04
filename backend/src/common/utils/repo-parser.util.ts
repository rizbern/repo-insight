export const KNOWN_ROLES = [
  'system-architect',
  'fed',
  'react',
  'node',
  'fullstack',
  'backend',
  'frontend',
  'devops',
];

export interface ParsedRepo {
  isTestRepo: boolean;
  role: string;
  candidateName: string;
}

export function parseRepoName(
  repoName: string,
  prefix = 'pt-',
  knownRoles = KNOWN_ROLES,
): ParsedRepo | null {
  if (!repoName.startsWith(prefix)) {
    return null;
  }

  const withoutPrefix = repoName.slice(prefix.length);

  // Sort known roles by length descending to match longest possible role first
  const sortedRoles = [...knownRoles].sort((a, b) => b.length - a.length);

  for (const role of sortedRoles) {
    if (withoutPrefix.startsWith(role + '-')) {
      const candidateName = withoutPrefix.slice(role.length + 1);
      return {
        isTestRepo: true,
        role,
        candidateName,
      };
    }
  }

  // Fallback: assume the first segment before a hyphen is the role
  const parts = withoutPrefix.split('-');
  if (parts.length >= 2) {
    return {
      isTestRepo: true,
      role: parts[0],
      candidateName: parts.slice(1).join('-'),
    };
  }

  return null;
}
