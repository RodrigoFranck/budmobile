import type { NavigationState, PartialState } from '@react-navigation/native';

type NavState = NavigationState | PartialState<NavigationState>;

export function getActiveRoutePath(state: NavState): string {
  const route = state.routes[state.index ?? 0];

  if (!route) {
    return 'Unknown';
  }

  if (route.state) {
    const nestedPath = getActiveRoutePath(route.state as NavState);
    return `${route.name}/${nestedPath}`;
  }

  return route.name;
}
