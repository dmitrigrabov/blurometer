import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { calculateBlurriness } from "./blurDetection";

// A 1x1 white JPG pixel (base64)
const whiteJpg =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLTAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDAREAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAUGB//EABYQAQEBAAAAAAAAAAAAAAAAAAABAv/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A9wD/2Q==";

describe("calculateBlurriness", () => {
  let originalDocument: typeof globalThis.document | undefined;
  let originalCreateElement:
    | typeof globalThis.document.createElement
    | undefined;

  beforeAll(() => {
    // Mock Image for Vitest (jsdom)
    globalThis.Image = class {
      onload: (() => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;
      src = "";
      width = 1;
      height = 1;
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as unknown as typeof Image;

    // Save originals
    originalDocument = globalThis.document;
    originalCreateElement = globalThis.document?.createElement;

    // Mock document/createElement if needed
    if (!globalThis.document) {
      globalThis.document = {} as Document;
    }
    globalThis.document.createElement = vi.fn((type: string) => {
      if (type === "canvas") {
        return {
          width: 1,
          height: 1,
          getContext: vi.fn(() => ({
            drawImage: vi.fn(),
            getImageData: vi.fn(() => ({
              data: new Uint8ClampedArray([255, 255, 255, 255]), // white pixel RGBA
              width: 1,
              height: 1,
            })),
          })),
        };
      }
      return {};
    }) as unknown as typeof document.createElement;
  });

  afterAll(() => {
    // Restore originals
    if (originalCreateElement) {
      globalThis.document.createElement = originalCreateElement;
    } else {
      delete (globalThis.document as unknown as Record<string, unknown>)
        .createElement;
    }
    if (!originalDocument) {
      delete (globalThis as unknown as Record<string, unknown>).document;
    }
  });

  it("returns a number for a valid base64 JPG", async () => {
    const result = await calculateBlurriness(whiteJpg);
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
