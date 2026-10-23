const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEPARTMENTS = new Set(['Development', 'Recruitment', 'Outsourcing']);
const SOURCES = new Set(['chatbot', 'contact_form']);

const normalizeLeadInput = (input = {}) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        input = {};
    }

    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    const projectDescription = typeof input.projectDescription === 'string'
        ? input.projectDescription.trim()
        : typeof input.need === 'string'
            ? input.need.trim()
            : '';

    const errors = {};
    if (!name) errors.name = 'Le nom est obligatoire.';
    if (!email) {
        errors.email = 'L’adresse e-mail est obligatoire.';
    } else if (!EMAIL_PATTERN.test(email)) {
        errors.email = 'L’adresse e-mail est invalide.';
    }
    if (phone && !/^[+\d\s\-()]{6,20}$/.test(phone)) {
        errors.phone = 'Le numéro de téléphone est invalide.';
    }
    if (!projectDescription) errors.projectDescription = 'La description du besoin est obligatoire.';

    if (name.length > 120) errors.name = 'Le nom ne peut pas dépasser 120 caractères.';
    if (email.length > 254) errors.email = 'L’adresse e-mail est trop longue.';
    if (projectDescription.length > 5000) {
        errors.projectDescription = 'La description du besoin ne peut pas dépasser 5000 caractères.';
    }

    if (Object.keys(errors).length > 0) {
        return { errors };
    }

    return {
        value: {
            name,
            company: typeof input.company === 'string' && input.company.trim()
                ? input.company.trim().slice(0, 160)
                : 'Individual',
            email,
            phone,
            country: typeof input.country === 'string' && input.country.trim()
                ? input.country.trim().slice(0, 100)
                : 'France',
            projectDescription,
            budget: typeof input.budget === 'string' ? input.budget.trim().slice(0, 120) : '',
            deadline: typeof input.deadline === 'string' ? input.deadline.trim().slice(0, 120) : '',
            suggestedDepartment: DEPARTMENTS.has(input.suggestedDepartment)
                ? input.suggestedDepartment
                : 'Development',
            priority: 'medium',
            source: SOURCES.has(input.source) ? input.source : 'chatbot',
            userId: typeof input.userId === 'string' ? input.userId.trim().slice(0, 100) : '',
        },
    };
};

module.exports = { normalizeLeadInput };
