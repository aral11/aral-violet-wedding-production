// Simple tests for mobile utility functions
import {
  detectMobile,
  getMobileFileAccept,
  getDownloadInstructions,
} from "../mobile-utils";

// Mock navigator
const mockNavigator = (userAgent: string) => {
  Object.defineProperty(window, "navigator", {
    value: {
      userAgent,
    },
    writable: true,
  });
};

describe("Mobile Utils", () => {
  test("detectMobile should identify mobile devices", () => {
    // Test iOS
    mockNavigator(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
    );
    const iosResult = detectMobile();
    expect(iosResult.isMobile).toBe(true);
    expect(iosResult.isIOS).toBe(true);

    // Test Android
    mockNavigator(
      "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36",
    );
    const androidResult = detectMobile();
    expect(androidResult.isMobile).toBe(true);
    expect(androidResult.isAndroid).toBe(true);

    // Test Desktop
    mockNavigator(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    );
    const desktopResult = detectMobile();
    expect(desktopResult.isDesktop).toBe(true);
    expect(desktopResult.isMobile).toBe(false);
  });

  test("getMobileFileAccept should return appropriate accept attributes", () => {
    mockNavigator("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)");
    expect(getMobileFileAccept("image")).toBe("image/*");

    mockNavigator("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    expect(getMobileFileAccept("image")).toBe(
      "image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp",
    );
  });

  test("getDownloadInstructions should provide device-specific instructions", () => {
    mockNavigator("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)");
    const iosInstructions = getDownloadInstructions();
    expect(iosInstructions).toContain("iOS");

    mockNavigator("Mozilla/5.0 (Linux; Android 10; SM-G975F)");
    const androidInstructions = getDownloadInstructions();
    expect(androidInstructions).toContain("Android");
  });
});
