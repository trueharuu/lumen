export class SplitAsciiWhitespace {
  public constructor(public inner: string) {}
  public next(): string | null {
    this.inner = this.inner.trim();
    if (this.inner === '') {
      return null;
    }

    const sp = this.inner.indexOf(' ');

    if (sp === -1) {
      return this.rest();
    }

    const [word, rest] = [this.inner.slice(0, sp), this.inner.slice(sp).trim()];

    this.inner = rest;
    return word;
  }

  public rest(): string | null {
    if (this.inner === '') {
      return null;
    }

    const lock = this.inner;
    this.inner = '';
    return lock;
  }

  public clone(): SplitAsciiWhitespace {
    return new SplitAsciiWhitespace(this.inner);
  }
}
