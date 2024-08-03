type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function deepAssign<T>(target: T, ...sources: DeepPartial<T>[]): T {
  if (target == null || typeof target !== 'object') {
    throw new TypeError('Target must be an object');
  }

  sources.forEach((source) => {
    if (source == null || typeof source !== 'object') {
      return;
    }

    Object.keys(source).forEach((key) => {
      const targetKey = key as keyof T;
      const targetValue = target[targetKey];
      const sourceValue = source[targetKey];

      if (Array.isArray(sourceValue)) {
        if (!Array.isArray(targetValue)) {
          target[targetKey] = [] as never;
        }
        deepAssign(target[targetKey] as unknown as object[], sourceValue);
      } else if (sourceValue instanceof Date) {
        target[targetKey] = new Date(sourceValue) as never;
      } else if (sourceValue instanceof RegExp) {
        target[targetKey] = new RegExp(sourceValue) as never;
      } else if (sourceValue && typeof sourceValue === 'object') {
        if (!targetValue || typeof targetValue !== 'object') {
          target[targetKey] = {} as never;
        }
        deepAssign(target[targetKey], sourceValue);
      } else {
        target[targetKey] = sourceValue as never;
      }
    });
  });

  return target;
}

export const chevron = '❯';
export const embed_color = 0x2c2d30;