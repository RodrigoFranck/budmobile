const missingRelations = new Set<string>();

export function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    /could not find the table/i.test(message) ||
    /relation .+ does not exist/i.test(message)
  );
}

export function relationAvailable(name: string) {
  return !missingRelations.has(name);
}

export function rememberMissingRelation(name: string) {
  missingRelations.add(name);
}

export function clearMissingRelation(name: string) {
  missingRelations.delete(name);
}

export function noteRelationError(name: string, error: unknown) {
  if (!error || !isMissingRelationError(error)) return false;
  rememberMissingRelation(name);
  return true;
}
