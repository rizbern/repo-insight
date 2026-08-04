export interface ParsedRepo {
  prefix: string;
  role: string;
  candidateName: string;
}


export function parseRepoName(repoName: string): ParsedRepo {
  if (!repoName || !repoName.startsWith('pt-')) {
    throw new Error('Invalid repository name. Must start with pt-');
  }

  const parts = repoName.split('-');
  const prefix = parts[0];
  const role = parts[1] || 'unknown';
  const candidateName = parts.slice(2).join(' ') || 'unknown';

  return {
    prefix,
    role,
    candidateName,
  };
}