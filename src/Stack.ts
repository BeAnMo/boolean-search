import { StackList, StackObject } from './types';
/**
 * LIFO
 */
class Stack {
  private _stack: StackList;

  constructor() {
    this._stack = null;
  }

  public get = () => this._stack;

  public set = (newStack: StackList): StackObject => {
    this._stack = newStack;

    return this;
  };

  public push = (item: any): StackObject => {
    return this.isEmpty()
      ? this.set([item])
      : this.set([item, ...(this._stack as any[])]);
  };

  public pop = (): any | null => {
    if (this._stack === null) {
      return null;
    } else {
      const first = this._stack[0];
      const rest = this._stack.slice(1);

      rest.length === 0 ? this.set(null) : this.set(rest);

      return first;
    }
  };

  public isEmpty = () => this._stack === null;

  public peek = (): any | null => {
    const self = this._stack;

    return self === null ? self : self[0];
  };
}

export default Stack;
