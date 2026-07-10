// Per-deployment branding. Select with VITE_COMPANY env var at build time
// (each Vercel project sets its own value; defaults to kukus).
const brands = {
  kukus: {
    key: 'kukus',
    name: 'Kukus Gallery',
    legalName: 'Kukus Gallery Pvt Ltd',
    title: 'Kukus Gallery - System',
    logo: '/logo.png',
    loginPlaceholder: 'admin@kukusgallery.com',
    mainAdminEmail: 'admin@kukusgallery.com',
    ordersLabel: 'Orders',
    orderNoun: 'Order',
    statusLabels: {},
    serviceTypes: ['Design Wear', 'Corporate Clothing'],
    categories: {
      'Design Wear': ['Main Size Development', 'Size Grading', 'Sample', 'Bulk Production'],
      'Corporate Clothing': ['T-Shirts', 'Uniforms', 'DTF Printing', 'Embroidery']
    },
    units: ['piece', 'meter', 'yard', 'set', 'hour', 'lot'],
    expenseCategories: [
      'Raw Materials', 'Fabric', 'Trims & Accessories', 'Printing', 'Embroidery',
      'Labour', 'Salaries', 'Rent', 'Utilities', 'Transport', 'Fuel',
      'Packaging', 'Equipment', 'Maintenance', 'Marketing', 'Office Supplies', 'Snacks', 'Other'
    ],
    pdf: {
      accent: [177, 145, 198],
      accentSoft: [248, 244, 251],
      border: [212, 189, 227],
      heading: [44, 22, 64],
      muted: [154, 123, 175]
    }
  },
  vertex: {
    key: 'vertex',
    name: 'Vertex Digital Solutions',
    legalName: 'Vertex Digital Solutions Pvt Ltd',
    title: 'Vertex Digital Solutions - System',
    logo: '/logo-vertex.png',
    loginPlaceholder: 'info.vertexdigitalsolutions@gmail.com',
    mainAdminEmail: 'info.vertexdigitalsolutions@gmail.com',
    ordersLabel: 'Projects',
    orderNoun: 'Project',
    statusLabels: { Processing: 'In Progress', Alternative: 'Review' },
    serviceTypes: ['Marketing & Campaigns', 'Content & Production', 'Design & Development'],
    categories: {
      'Marketing & Campaigns': ['Social Media Marketing', 'Performance Marketing', 'Creative Campaigns', 'Influencer Campaigns'],
      'Content & Production': ['Content Production', 'Video & Podcast Production'],
      'Design & Development': ['Branding & Design', 'Web Design & Development']
    },
    units: ['project', 'month', 'hour', 'piece', 'set', 'lot'],
    expenseCategories: [
      'Ad Spend (Meta/Google)', 'Software & Subscriptions', 'Hosting & Domains',
      'Freelancers', 'Content Production', 'Equipment', 'Salaries', 'Rent',
      'Utilities', 'Transport', 'Fuel', 'Marketing', 'Office Supplies', 'Snacks', 'Other'
    ],
    pdf: {
      accent: [45, 52, 60],
      accentSoft: [244, 246, 238],
      border: [186, 202, 106],
      heading: [26, 31, 36],
      muted: [122, 132, 110]
    }
  }
};

export const BRAND = brands[(import.meta.env.VITE_COMPANY || '').trim().toLowerCase()] || brands.kukus;
