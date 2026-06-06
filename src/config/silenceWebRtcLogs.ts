import debug from 'debug';

const originalEnable = debug.enable.bind(debug);

debug.enable = (namespaces: string) => {
  const filtered = namespaces
    .split(/[\s,]+/)
    .filter((namespace) => namespace.length > 0 && !namespace.startsWith('rn-webrtc'))
    .join(',');

  if (!filtered) {
    return originalEnable('');
  }

  return originalEnable(filtered);
};
