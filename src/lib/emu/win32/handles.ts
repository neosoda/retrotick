export class HandleTable {
  private handles = new Map<number, { type: string; data: unknown }>();
  private nextHandle = 0x1000;

  alloc(type: string, data: unknown): number {
    const h = this.nextHandle++;
    this.handles.set(h, { type, data });
    return h;
  }

  /** Store with a specific handle value (for DOS handles etc.) */
  set(handle: number, type: string, data: unknown): void {
    this.handles.set(handle, { type, data });
  }

  get<T>(handle: number): T | null {
    const entry = this.handles.get(handle);
    return entry ? entry.data as T : null;
  }

  getType(handle: number): string | null {
    const entry = this.handles.get(handle);
    return entry ? entry.type : null;
  }

  size(): number { return this.handles.size; }

  free(handle: number): void {
    this.handles.delete(handle);
  }

  findByType<T = unknown>(type: string): [number, T][] {
    const result: [number, T][] = [];
    for (const [h, entry] of this.handles) {
      if (entry.type === type) result.push([h, entry.data as T]);
    }
    return result;
  }
}
