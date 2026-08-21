declare module 'npm:@base44/sdk@0.8.43' {
  export function createClientFromRequest(request: Request): any;
}

declare module 'base44:runtime' {
  export function waitUntil(promise: Promise<unknown>): void;
}

declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): void;
  env: { get(name: string): string | undefined };
};
