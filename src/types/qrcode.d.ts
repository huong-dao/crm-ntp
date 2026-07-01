declare module "qrcode" {
  type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

  interface QrToDataUrlOptions {
    margin?: number;
    width?: number;
    errorCorrectionLevel?: QrErrorCorrectionLevel;
  }

  export function toDataURL(
    text: string,
    options?: QrToDataUrlOptions
  ): Promise<string>;
}
