declare module "b58" {
  export const decode: (s: string) => Buffer;
  export const encode: (s: Buffer) => string;
}
