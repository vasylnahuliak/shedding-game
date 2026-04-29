import type { View } from 'react-native';

export function measureInWindowAsync(viewRef: {
  current: View | null;
}): Promise<{ x: number; y: number; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    if (!viewRef.current) {
      reject(new Error('Ref not available'));
      return;
    }
    viewRef.current.measureInWindow((x, y, w, h) => {
      if (w === 0 && h === 0) {
        reject(new Error('View not laid out'));
        return;
      }
      resolve({ x, y, w, h });
    });
  });
}
