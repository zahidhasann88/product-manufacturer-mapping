export async function parallelProcess<T, U>(
  items: T[],
  processor: (item: T) => Promise<U>,
  concurrency: number = 4,
): Promise<U[]> {
  const { default: pLimit } = await import('p-limit');
  const limit = pLimit(concurrency);
  const promises = items.map((item) => limit(() => processor(item)));
  return Promise.all(promises);
}
