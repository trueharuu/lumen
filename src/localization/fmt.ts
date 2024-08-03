export function fmt<T extends string>(t: T, inject: Inject<T>): string {
  return t.replace(/\{(.+?)\}/g, (_, $1) => {
    return (inject as never)[$1 as string];
  });
}

export type Inject<T extends string> =
  T extends `${string}{${infer K}}${infer R}`
    ? {
      [P in K | keyof Inject<R>]: string;
    }
    : object;