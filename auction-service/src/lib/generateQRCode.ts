import QRCode from 'qrcode'

export const generateQRCode = async (data: string) => {
    //M = 15% error correction amount of damaged surface after which the symbol becomes unreadable
    // qrCodeBuffer= await QRCode.toDataURL(parsedBody.detail.auctionId,{ errorCorrectionLevel: 'M' })
    // asynchronously generate a Buffer representing the QR code image (useful for saving to a file, uploading to S3, etc)
    const qrCodeBuffer = await QRCode.toBuffer(data, {
    type: 'png',
    errorCorrectionLevel: 'H',
    });
    console.log({qrCodeBuffer})
    return qrCodeBuffer
  }