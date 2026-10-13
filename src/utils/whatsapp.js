export function getWhatsAppUrl(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length < 8) {
    return null
  }

  const internationalNumber = digits.startsWith('00')
    ? digits.slice(2)
    : digits.startsWith('0')
      ? `62${digits.slice(1)}`
      : digits.startsWith('8')
        ? `62${digits}`
        : digits

  return `https://wa.me/${internationalNumber}`
}
