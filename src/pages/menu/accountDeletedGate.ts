let pending: { name: string | null } | null = null;

export function setAccountDeletedName(name: string | null) {
  pending = { name };
}

export function peekAccountDeletedName() {
  return pending;
}

export function clearAccountDeletedName() {
  pending = null;
}
