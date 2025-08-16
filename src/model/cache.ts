
const WAITING_PREFIX = "waiting-for"

async function delay(milliseconds: number){
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function getOrFetchData<T>(cache: Map<string, T>, fetchingMethod: (...args: any) => Promise<[number, T]>, ...args: Array<string>): Promise<T> {
  const key: string = args.map(e => "" + e).reduce((a, b) => a + b, "")
  while (cache.has(WAITING_PREFIX + key))
    await delay(50);
  if (!cache.has(key)) {
    cache.set(WAITING_PREFIX + key, null)
    const [_, data] = await fetchingMethod(...args);
    cache.set(key, data)
    cache.delete(WAITING_PREFIX + key)
  }
  return cache.get(key)
}

export { getOrFetchData }