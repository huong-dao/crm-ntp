import QRCode from "qrcode";

export async function generateQrDataUrl(
  text: string,
  size = 120
): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: size,
    errorCorrectionLevel: "M",
  });
}
