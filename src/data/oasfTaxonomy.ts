// OASF Taxonomy v0.8.0
// Skills and Domains for agent capability declaration
// Source: https://github.com/agntcy/oasf/tree/v0.8.0

export interface OASFSkill {
    slug: string;
    name: string;
    category: string;
}

export interface OASFDomain {
    slug: string;
    name: string;
    category: string;
}

// Top skills by usage in production (from ERC-8004 best practices)
export const OASF_SKILLS: OASFSkill[] = [
    // Natural Language Processing
    { slug: 'natural_language_processing/natural_language_generation/summarization', name: 'Summarization', category: 'NLP' },
    { slug: 'natural_language_processing/information_retrieval_synthesis/search', name: 'Search', category: 'NLP' },
    { slug: 'natural_language_processing/information_retrieval_synthesis/question_answering', name: 'Question Answering', category: 'NLP' },
    { slug: 'natural_language_processing/natural_language_generation/text_generation', name: 'Text Generation', category: 'NLP' },
    { slug: 'natural_language_processing/natural_language_understanding/sentiment_analysis', name: 'Sentiment Analysis', category: 'NLP' },

    // Analytical Skills
    { slug: 'analytical_skills/data_analysis/blockchain_analysis', name: 'Blockchain Analysis', category: 'Analytics' },
    { slug: 'analytical_skills/pattern_recognition/anomaly_detection', name: 'Anomaly Detection', category: 'Analytics' },
    { slug: 'analytical_skills/pattern_recognition/market_trends', name: 'Market Trends', category: 'Analytics' },
    { slug: 'analytical_skills/data_analysis/statistical_analysis', name: 'Statistical Analysis', category: 'Analytics' },

    // Tool Interaction
    { slug: 'tool_interaction/api_schema_understanding', name: 'API Integration', category: 'Tools' },
    { slug: 'tool_interaction/workflow_automation', name: 'Workflow Automation', category: 'Tools' },
    { slug: 'tool_interaction/code_execution', name: 'Code Execution', category: 'Tools' },

    // Multi-Modal
    { slug: 'multi_modal/image_processing/text_to_image', name: 'Text to Image', category: 'Multi-Modal' },
    { slug: 'multi_modal/image_processing/image_analysis', name: 'Image Analysis', category: 'Multi-Modal' },

    // Coding Skills
    { slug: 'analytical_skills/coding_skills/text_to_code', name: 'Code Generation', category: 'Coding' },
    { slug: 'analytical_skills/coding_skills/code_review', name: 'Code Review', category: 'Coding' },
    { slug: 'analytical_skills/coding_skills/debugging', name: 'Debugging', category: 'Coding' },

    // Creative
    { slug: 'creative/content_creation/copywriting', name: 'Copywriting', category: 'Creative' },
    { slug: 'creative/content_creation/storytelling', name: 'Storytelling', category: 'Creative' },
    { slug: 'creative/content_creation/social_media', name: 'Social Media', category: 'Creative' },
];

// Top domains by usage in production
export const OASF_DOMAINS: OASFDomain[] = [
    // Technology
    { slug: 'technology/blockchain', name: 'Blockchain', category: 'Technology' },
    { slug: 'technology/blockchain/cryptocurrency', name: 'Cryptocurrency', category: 'Technology' },
    { slug: 'technology/blockchain/defi', name: 'DeFi', category: 'Technology' },
    { slug: 'technology/blockchain/nft', name: 'NFT', category: 'Technology' },
    { slug: 'technology/software_engineering/apis_integration', name: 'APIs & Integration', category: 'Technology' },
    { slug: 'technology/artificial_intelligence', name: 'Artificial Intelligence', category: 'Technology' },
    { slug: 'technology/cybersecurity', name: 'Cybersecurity', category: 'Technology' },

    // Finance & Business
    { slug: 'finance_and_business/finance', name: 'Finance', category: 'Finance' },
    { slug: 'finance_and_business/investment_services', name: 'Investment Services', category: 'Finance' },
    { slug: 'finance_and_business/trading', name: 'Trading', category: 'Finance' },
    { slug: 'finance_and_business/accounting', name: 'Accounting', category: 'Finance' },

    // Media & Entertainment
    { slug: 'media_and_entertainment/content_creation', name: 'Content Creation', category: 'Media' },
    { slug: 'media_and_entertainment/marketing', name: 'Marketing', category: 'Media' },
    { slug: 'media_and_entertainment/social_media', name: 'Social Media', category: 'Media' },

    // Research & Education
    { slug: 'research_and_education/research', name: 'Research', category: 'Education' },
    { slug: 'research_and_education/data_science', name: 'Data Science', category: 'Education' },

    // General
    { slug: 'general/productivity', name: 'Productivity', category: 'General' },
    { slug: 'general/assistant', name: 'Personal Assistant', category: 'General' },
];

// Group skills by category for UI
export function getSkillsByCategory(): Record<string, OASFSkill[]> {
    return OASF_SKILLS.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<string, OASFSkill[]>);
}

// Group domains by category for UI
export function getDomainsByCategory(): Record<string, OASFDomain[]> {
    return OASF_DOMAINS.reduce((acc, domain) => {
        if (!acc[domain.category]) acc[domain.category] = [];
        acc[domain.category].push(domain);
        return acc;
    }, {} as Record<string, OASFDomain[]>);
}
