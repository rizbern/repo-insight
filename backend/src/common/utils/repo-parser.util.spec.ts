import { parseRepoName } from './repo-parser.util';

describe('parseRepoName', () => {
  it('should return null for repos without the prefix', () => {
    expect(parseRepoName('frontend-app')).toBeNull();
    expect(parseRepoName('react-john-doe')).toBeNull();
  });

  it('should parse a simple role and candidate name', () => {
    const result = parseRepoName('pt-fed-srinivas-kommuri');
    expect(result).toEqual({
      isTestRepo: true,
      role: 'fed',
      candidateName: 'srinivas-kommuri',
    });
  });

  it('should parse a role with hyphens correctly if in KNOWN_ROLES', () => {
    const result = parseRepoName('pt-system-architect-rajat-ghildiyal');
    expect(result).toEqual({
      isTestRepo: true,
      role: 'system-architect',
      candidateName: 'rajat-ghildiyal',
    });
  });

  it('should fallback to first segment if role is unknown', () => {
    const result = parseRepoName('pt-unknownrole-jane-smith-doe');
    expect(result).toEqual({
      isTestRepo: true,
      role: 'unknownrole',
      candidateName: 'jane-smith-doe',
    });
  });

  it('should return null if there is no hyphen after the role segment in fallback', () => {
    const result = parseRepoName('pt-something');
    expect(result).toBeNull(); // Because there's no candidate name
  });
});
