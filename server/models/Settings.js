const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Kukus Gallery Pvt Ltd' },
  tagline: { type: String, default: 'Trusted Clothing Manufacturing Partners' },
  address: { type: String, default: '484/8/F Wettasinghe Gardens, Pitakotte, Sri Lanka' },
  phone: { type: String, default: '076 861 4050 / 077 698 6155' },
  landline: { type: String, default: '011 287 0057' },
  email: { type: String, default: 'info@kukusgallery.com' },
  website: { type: String, default: 'www.kukusgallery.com' },
  logoPath: { type: String, default: '/uploads/logo.png' },
  defaultPaymentTerms: { type: String, default: 'Net 30' },
  defaultNotes: { type: String, default: 'Thank you for your business!' },
  defaultTerms: { type: String, default: 'Payment is due within the specified payment terms. Late payments may incur additional charges.' },
  pdfTerms: { type: String, default: '' },
  invoicePrefix: { type: String, default: 'KG' },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountName: { type: String, default: 'Kukus Gallery Pvt Ltd' },
    accountNumber: { type: String, default: '' },
    branchCode: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
