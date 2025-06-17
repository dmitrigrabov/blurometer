import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { detectIdCard, resetModel } from "./idCardDetection";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

// Mock the COCO-SSD model
vi.mock("@tensorflow-models/coco-ssd", () => ({
  load: vi.fn().mockResolvedValue({
    detect: vi.fn().mockResolvedValue([
      {
        class: "book",
        score: 0.95,
        bbox: [100, 100, 200, 300], // [x, y, width, height]
      },
    ]),
  }),
}));

// A 1x1 white JPG pixel (base64)
const whiteJpg =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLTAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDAREAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAUGB//EABYQAQEBAAAAAAAAAAAAAAAAAAABAv/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A9wD/2Q==";

describe("detectIdCard", () => {
  beforeAll(() => {
    // Mock Image for Vitest (jsdom)
    globalThis.Image = class {
      onload: (() => void) | null = null;
      onerror: ((err: unknown) => void) | null = null;
      src = "";
      width = 500;
      height = 500;
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as unknown as typeof Image;

    // Mock document and canvas
    if (!globalThis.document) {
      globalThis.document = {} as Document;
    }
    globalThis.document.createElement = vi.fn((type: string) => {
      if (type === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({
            drawImage: vi.fn(),
          })),
          toDataURL: vi.fn().mockReturnValue("data:image/jpeg;base64,mocked"),
        };
      }
      return {};
    }) as unknown as typeof document.createElement;
  });

  beforeEach(() => {
    // Reset the model singleton before each test
    resetModel();
  });

  it("detects and crops an ID card from an image", async () => {
    const result = await detectIdCard(whiteJpg);
    expect(result).toBe("data:image/jpeg;base64,mocked");
    expect(cocoSsd.load).toHaveBeenCalled();
  });

  it("returns null when no card is detected", async () => {
    // Mock the model to return no predictions
    vi.mocked(cocoSsd.load).mockResolvedValueOnce({
      detect: vi.fn().mockResolvedValue([]),
    } as unknown as cocoSsd.ObjectDetection);

    const result = await detectIdCard(whiteJpg);
    expect(result).toBeNull();
  });
});
