const ignore = (): void => undefined;

class ResizeObserverStub {
  disconnect = ignore;

  observe = ignore;

  unobserve = ignore;
}

if (typeof window !== 'undefined') {
  window.ResizeObserver ??= ResizeObserverStub;

  if (!('scrollIntoView' in Element.prototype)) {
    Object.assign(Element.prototype, { scrollIntoView: ignore });
  }
}
