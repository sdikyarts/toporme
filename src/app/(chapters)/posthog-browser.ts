type PostHogBrowser = {
  identify: (distinctId: string) => void;
  register: (properties: Record<string, string | number>) => void;
  set_config: (config: { capture_heatmaps: boolean }) => void;
  capture: (event: string, properties: Record<string, string | number>) => void;
  reset: () => void;
};

let client: Promise<PostHogBrowser> | undefined;

export function loadPostHog(token: string, host: string) {
  client ??= new Promise<PostHogBrowser>((resolve, reject) => {
    const browser = window as Window & { posthog?: PostHogBrowser | unknown[] };
    const script = document.createElement("script");
    script.src = new URL("/static/array.js", host.replace(".i.posthog.com", "-assets.i.posthog.com")).href;
    script.async = true;
    script.crossOrigin = "anonymous";

    // PostHog's hosted snippet reads the initialization queue when the SDK loads.
    browser.posthog = Object.assign([], {
      __SV: 1,
      people: [],
      _i: [[token, {
        api_host: host,
        persistence: "memory",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_exceptions: false,
        disable_geoip: true,
        disable_session_recording: true,
        disable_surveys: true,
        capture_heatmaps: false,
      }, "posthog"]],
    });
    script.onload = () => {
      const sdk = browser.posthog;
      if (sdk && !Array.isArray(sdk)) resolve(sdk);
      else reject(new Error("PostHog did not initialize"));
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("PostHog SDK failed to load"));
    };
    document.head.append(script);
  }).catch((error: unknown) => {
    client = undefined;
    throw error;
  });
  return client;
}
