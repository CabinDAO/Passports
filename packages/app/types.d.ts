declare module "base-58" {
  export const decode: (s: string) => Buffer;
  export const encode: (s: Buffer) => string;
}
