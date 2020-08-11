export interface TextLayerRenderedEvent<T = any> extends Event {
  pageNumber: number;

  readonly detail: T;
  initCustomEvent(
    typeArg: string,
    canBubbleArg: boolean,
    cancelableArg: boolean,
    detailArg: T
  ): void;
}
