 const EMAIL_CONFIG = {
    transactional: {
        domain: process.env.TRANSACTIONAL_EMAIL, 
        prefixes: ['transaction', 'support', 'billing', 'no-reply']
    },
    marketing: {
        domain: process.env.MARKETING_EMAIL,
        prefixes: ['newsletter', 'promo', 'ads', 'no-reply']
    }
};





export function getEmail(isTransactional = true, prefix) {
    const type = isTransactional ? 'transactional' : 'marketing';
    const { domain, prefixes } = EMAIL_CONFIG[type];

    if (!prefixes.includes(prefix)) {
        prefix = 'no-reply'; 
    }

    return `${prefix}${domain}`;
}
