// OASF Taxonomy v0.8.0 - Complete Hierarchical Structure
// Skills and Domains for agent capability declaration
// Source: https://github.com/agntcy/oasf/tree/v0.8.0

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TaxonomyItem {
    id: string;      // e.g., "10101"
    slug: string;    // Full path: "natural_language_processing/natural_language_understanding/contextual_comprehension"
    name: string;    // Display: "Contextual Comprehension"
}

export interface TaxonomySubcategory {
    id: string;
    slug: string;
    name: string;
    items: TaxonomyItem[];  // Empty if subcategory IS the selectable item
}

export interface TaxonomyCategory {
    id: string;
    slug: string;
    name: string;
    subcategories: TaxonomySubcategory[];
}

// ============================================
// SKILLS TAXONOMY (15 Main Categories)
// ============================================

export const OASF_SKILLS_TAXONOMY: TaxonomyCategory[] = [
    // 1. Natural Language Processing
    {
        id: "1",
        slug: "natural_language_processing",
        name: "Natural Language Processing",
        subcategories: [
            {
                id: "101",
                slug: "natural_language_processing/natural_language_understanding",
                name: "Natural Language Understanding",
                items: [
                    { id: "10101", slug: "natural_language_processing/natural_language_understanding/contextual_comprehension", name: "Contextual Comprehension" },
                    { id: "10102", slug: "natural_language_processing/natural_language_understanding/semantic_understanding", name: "Semantic Understanding" },
                    { id: "10103", slug: "natural_language_processing/natural_language_understanding/entity_recognition", name: "Entity Recognition" },
                    { id: "10104", slug: "natural_language_processing/natural_language_understanding/sentiment_analysis", name: "Sentiment Analysis" },
                    { id: "10105", slug: "natural_language_processing/natural_language_understanding/intent_classification", name: "Intent Classification" },
                ]
            },
            {
                id: "102",
                slug: "natural_language_processing/natural_language_generation",
                name: "Natural Language Generation",
                items: [
                    { id: "10201", slug: "natural_language_processing/natural_language_generation/text_generation", name: "Text Generation" },
                    { id: "10202", slug: "natural_language_processing/natural_language_generation/summarization", name: "Summarization" },
                    { id: "10203", slug: "natural_language_processing/natural_language_generation/paraphrasing", name: "Paraphrasing" },
                    { id: "10204", slug: "natural_language_processing/natural_language_generation/translation", name: "Translation" },
                    { id: "10205", slug: "natural_language_processing/natural_language_generation/dialogue_generation", name: "Dialogue Generation" },
                ]
            },
            {
                id: "103",
                slug: "natural_language_processing/information_retrieval_synthesis",
                name: "Information Retrieval & Synthesis",
                items: [
                    { id: "10301", slug: "natural_language_processing/information_retrieval_synthesis/search", name: "Search" },
                    { id: "10302", slug: "natural_language_processing/information_retrieval_synthesis/question_answering", name: "Question Answering" },
                    { id: "10303", slug: "natural_language_processing/information_retrieval_synthesis/knowledge_extraction", name: "Knowledge Extraction" },
                    { id: "10304", slug: "natural_language_processing/information_retrieval_synthesis/document_classification", name: "Document Classification" },
                    { id: "10305", slug: "natural_language_processing/information_retrieval_synthesis/fact_verification", name: "Fact Verification" },
                ]
            },
            {
                id: "104",
                slug: "natural_language_processing/text_processing",
                name: "Text Processing",
                items: [
                    { id: "10401", slug: "natural_language_processing/text_processing/tokenization", name: "Tokenization" },
                    { id: "10402", slug: "natural_language_processing/text_processing/normalization", name: "Normalization" },
                    { id: "10403", slug: "natural_language_processing/text_processing/spell_checking", name: "Spell Checking" },
                    { id: "10404", slug: "natural_language_processing/text_processing/grammar_correction", name: "Grammar Correction" },
                ]
            },
            {
                id: "105",
                slug: "natural_language_processing/conversation",
                name: "Conversation",
                items: [
                    { id: "10501", slug: "natural_language_processing/conversation/chatbot", name: "Chatbot" },
                    { id: "10502", slug: "natural_language_processing/conversation/dialogue_management", name: "Dialogue Management" },
                    { id: "10503", slug: "natural_language_processing/conversation/context_tracking", name: "Context Tracking" },
                    { id: "10504", slug: "natural_language_processing/conversation/turn_taking", name: "Turn Taking" },
                ]
            },
        ]
    },

    // 2. Images / Computer Vision
    {
        id: "2",
        slug: "images_computer_vision",
        name: "Images / Computer Vision",
        subcategories: [
            {
                id: "201",
                slug: "images_computer_vision/image_classification",
                name: "Image Classification",
                items: [
                    { id: "20101", slug: "images_computer_vision/image_classification/object_detection", name: "Object Detection" },
                    { id: "20102", slug: "images_computer_vision/image_classification/scene_recognition", name: "Scene Recognition" },
                    { id: "20103", slug: "images_computer_vision/image_classification/facial_recognition", name: "Facial Recognition" },
                ]
            },
            {
                id: "202",
                slug: "images_computer_vision/image_generation",
                name: "Image Generation",
                items: [
                    { id: "20201", slug: "images_computer_vision/image_generation/text_to_image", name: "Text to Image" },
                    { id: "20202", slug: "images_computer_vision/image_generation/image_to_image", name: "Image to Image" },
                    { id: "20203", slug: "images_computer_vision/image_generation/inpainting", name: "Inpainting" },
                    { id: "20204", slug: "images_computer_vision/image_generation/style_transfer", name: "Style Transfer" },
                ]
            },
            {
                id: "203",
                slug: "images_computer_vision/image_analysis",
                name: "Image Analysis",
                items: [
                    { id: "20301", slug: "images_computer_vision/image_analysis/image_captioning", name: "Image Captioning" },
                    { id: "20302", slug: "images_computer_vision/image_analysis/ocr", name: "OCR" },
                    { id: "20303", slug: "images_computer_vision/image_analysis/visual_question_answering", name: "Visual Question Answering" },
                    { id: "20304", slug: "images_computer_vision/image_analysis/image_segmentation", name: "Image Segmentation" },
                ]
            },
        ]
    },

    // 3. Audio
    {
        id: "3",
        slug: "audio",
        name: "Audio",
        subcategories: [
            {
                id: "301",
                slug: "audio/speech",
                name: "Speech",
                items: [
                    { id: "30101", slug: "audio/speech/speech_to_text", name: "Speech to Text" },
                    { id: "30102", slug: "audio/speech/text_to_speech", name: "Text to Speech" },
                    { id: "30103", slug: "audio/speech/voice_cloning", name: "Voice Cloning" },
                    { id: "30104", slug: "audio/speech/speaker_identification", name: "Speaker Identification" },
                ]
            },
            {
                id: "302",
                slug: "audio/audio_processing",
                name: "Audio Processing",
                items: [
                    { id: "30201", slug: "audio/audio_processing/music_generation", name: "Music Generation" },
                    { id: "30202", slug: "audio/audio_processing/audio_classification", name: "Audio Classification" },
                    { id: "30203", slug: "audio/audio_processing/noise_reduction", name: "Noise Reduction" },
                ]
            },
        ]
    },

    // 4. Tabular / Structured Data
    {
        id: "4",
        slug: "tabular_text",
        name: "Tabular / Structured Data",
        subcategories: [
            {
                id: "401",
                slug: "tabular_text/data_processing",
                name: "Data Processing",
                items: [
                    { id: "40101", slug: "tabular_text/data_processing/data_cleaning", name: "Data Cleaning" },
                    { id: "40102", slug: "tabular_text/data_processing/data_transformation", name: "Data Transformation" },
                    { id: "40103", slug: "tabular_text/data_processing/feature_engineering", name: "Feature Engineering" },
                ]
            },
            {
                id: "402",
                slug: "tabular_text/prediction",
                name: "Prediction",
                items: [
                    { id: "40201", slug: "tabular_text/prediction/classification", name: "Classification" },
                    { id: "40202", slug: "tabular_text/prediction/regression", name: "Regression" },
                    { id: "40203", slug: "tabular_text/prediction/time_series_forecasting", name: "Time Series Forecasting" },
                ]
            },
        ]
    },

    // 5. Analytical Skills
    {
        id: "5",
        slug: "analytical_skills",
        name: "Analytical Skills",
        subcategories: [
            {
                id: "501",
                slug: "analytical_skills/data_analysis",
                name: "Data Analysis",
                items: [
                    { id: "50101", slug: "analytical_skills/data_analysis/statistical_analysis", name: "Statistical Analysis" },
                    { id: "50102", slug: "analytical_skills/data_analysis/trend_analysis", name: "Trend Analysis" },
                    { id: "50103", slug: "analytical_skills/data_analysis/correlation_analysis", name: "Correlation Analysis" },
                    { id: "50104", slug: "analytical_skills/data_analysis/blockchain_analysis", name: "Blockchain Analysis" },
                    { id: "50105", slug: "analytical_skills/data_analysis/market_analysis", name: "Market Analysis" },
                ]
            },
            {
                id: "502",
                slug: "analytical_skills/pattern_recognition",
                name: "Pattern Recognition",
                items: [
                    { id: "50201", slug: "analytical_skills/pattern_recognition/anomaly_detection", name: "Anomaly Detection" },
                    { id: "50202", slug: "analytical_skills/pattern_recognition/market_trends", name: "Market Trends" },
                    { id: "50203", slug: "analytical_skills/pattern_recognition/clustering", name: "Clustering" },
                ]
            },
            {
                id: "503",
                slug: "analytical_skills/coding_skills",
                name: "Coding Skills",
                items: [
                    { id: "50301", slug: "analytical_skills/coding_skills/text_to_code", name: "Code Generation" },
                    { id: "50302", slug: "analytical_skills/coding_skills/code_review", name: "Code Review" },
                    { id: "50303", slug: "analytical_skills/coding_skills/debugging", name: "Debugging" },
                    { id: "50304", slug: "analytical_skills/coding_skills/code_explanation", name: "Code Explanation" },
                    { id: "50305", slug: "analytical_skills/coding_skills/refactoring", name: "Refactoring" },
                ]
            },
        ]
    },

    // 6. Retrieval Augmented Generation
    {
        id: "6",
        slug: "retrieval_augmented_generation",
        name: "Retrieval Augmented Generation",
        subcategories: [
            {
                id: "601",
                slug: "retrieval_augmented_generation/document_retrieval",
                name: "Document Retrieval",
                items: [
                    { id: "60101", slug: "retrieval_augmented_generation/document_retrieval/vector_search", name: "Vector Search" },
                    { id: "60102", slug: "retrieval_augmented_generation/document_retrieval/semantic_search", name: "Semantic Search" },
                    { id: "60103", slug: "retrieval_augmented_generation/document_retrieval/hybrid_search", name: "Hybrid Search" },
                ]
            },
            {
                id: "602",
                slug: "retrieval_augmented_generation/knowledge_base",
                name: "Knowledge Base",
                items: [
                    { id: "60201", slug: "retrieval_augmented_generation/knowledge_base/knowledge_graphs", name: "Knowledge Graphs" },
                    { id: "60202", slug: "retrieval_augmented_generation/knowledge_base/document_indexing", name: "Document Indexing" },
                    { id: "60203", slug: "retrieval_augmented_generation/knowledge_base/embedding_generation", name: "Embedding Generation" },
                ]
            },
            {
                id: "603",
                slug: "retrieval_augmented_generation/context_synthesis",
                name: "Context Synthesis",
                items: [
                    { id: "60301", slug: "retrieval_augmented_generation/context_synthesis/context_compression", name: "Context Compression" },
                    { id: "60302", slug: "retrieval_augmented_generation/context_synthesis/re_ranking", name: "Re-ranking" },
                    { id: "60303", slug: "retrieval_augmented_generation/context_synthesis/citation_generation", name: "Citation Generation" },
                ]
            },
        ]
    },

    // 7. Multi-Modal
    {
        id: "7",
        slug: "multi_modal",
        name: "Multi-Modal",
        subcategories: [
            {
                id: "701",
                slug: "multi_modal/cross_modal",
                name: "Cross-Modal",
                items: [
                    { id: "70101", slug: "multi_modal/cross_modal/image_text_matching", name: "Image-Text Matching" },
                    { id: "70102", slug: "multi_modal/cross_modal/audio_visual", name: "Audio-Visual" },
                    { id: "70103", slug: "multi_modal/cross_modal/document_understanding", name: "Document Understanding" },
                ]
            },
            {
                id: "702",
                slug: "multi_modal/generation",
                name: "Generation",
                items: [
                    { id: "70201", slug: "multi_modal/generation/video_generation", name: "Video Generation" },
                    { id: "70202", slug: "multi_modal/generation/3d_generation", name: "3D Generation" },
                    { id: "70203", slug: "multi_modal/generation/multi_modal_synthesis", name: "Multi-Modal Synthesis" },
                ]
            },
        ]
    },

    // 8. Security & Privacy
    {
        id: "8",
        slug: "security_privacy",
        name: "Security & Privacy",
        subcategories: [
            {
                id: "801",
                slug: "security_privacy/security",
                name: "Security",
                items: [
                    { id: "80101", slug: "security_privacy/security/threat_detection", name: "Threat Detection" },
                    { id: "80102", slug: "security_privacy/security/vulnerability_assessment", name: "Vulnerability Assessment" },
                    { id: "80103", slug: "security_privacy/security/fraud_detection", name: "Fraud Detection" },
                    { id: "80104", slug: "security_privacy/security/access_control", name: "Access Control" },
                ]
            },
            {
                id: "802",
                slug: "security_privacy/privacy",
                name: "Privacy",
                items: [
                    { id: "80201", slug: "security_privacy/privacy/data_anonymization", name: "Data Anonymization" },
                    { id: "80202", slug: "security_privacy/privacy/pii_detection", name: "PII Detection" },
                    { id: "80203", slug: "security_privacy/privacy/privacy_compliance", name: "Privacy Compliance" },
                ]
            },
        ]
    },

    // 9. Data Engineering
    {
        id: "9",
        slug: "data_engineering",
        name: "Data Engineering",
        subcategories: [
            {
                id: "901",
                slug: "data_engineering/data_pipeline",
                name: "Data Pipeline",
                items: [
                    { id: "90101", slug: "data_engineering/data_pipeline/etl", name: "ETL" },
                    { id: "90102", slug: "data_engineering/data_pipeline/data_validation", name: "Data Validation" },
                    { id: "90103", slug: "data_engineering/data_pipeline/streaming", name: "Streaming" },
                ]
            },
            {
                id: "902",
                slug: "data_engineering/data_storage",
                name: "Data Storage",
                items: [
                    { id: "90201", slug: "data_engineering/data_storage/database_management", name: "Database Management" },
                    { id: "90202", slug: "data_engineering/data_storage/data_warehousing", name: "Data Warehousing" },
                ]
            },
        ]
    },

    // 10. Agent Orchestration
    {
        id: "10",
        slug: "agent_orchestration",
        name: "Agent Orchestration",
        subcategories: [
            {
                id: "1001",
                slug: "agent_orchestration/coordination",
                name: "Coordination",
                items: [
                    { id: "100101", slug: "agent_orchestration/coordination/multi_agent", name: "Multi-Agent" },
                    { id: "100102", slug: "agent_orchestration/coordination/task_delegation", name: "Task Delegation" },
                    { id: "100103", slug: "agent_orchestration/coordination/workflow_management", name: "Workflow Management" },
                ]
            },
            {
                id: "1002",
                slug: "agent_orchestration/communication",
                name: "Communication",
                items: [
                    { id: "100201", slug: "agent_orchestration/communication/agent_to_agent", name: "Agent-to-Agent" },
                    { id: "100202", slug: "agent_orchestration/communication/protocol_handling", name: "Protocol Handling" },
                ]
            },
        ]
    },

    // 11. Evaluation & Monitoring
    {
        id: "11",
        slug: "evaluation_monitoring",
        name: "Evaluation & Monitoring",
        subcategories: [
            {
                id: "1101",
                slug: "evaluation_monitoring/evaluation",
                name: "Evaluation",
                items: [
                    { id: "110101", slug: "evaluation_monitoring/evaluation/model_evaluation", name: "Model Evaluation" },
                    { id: "110102", slug: "evaluation_monitoring/evaluation/benchmark_testing", name: "Benchmark Testing" },
                    { id: "110103", slug: "evaluation_monitoring/evaluation/quality_assessment", name: "Quality Assessment" },
                ]
            },
            {
                id: "1102",
                slug: "evaluation_monitoring/monitoring",
                name: "Monitoring",
                items: [
                    { id: "110201", slug: "evaluation_monitoring/monitoring/performance_monitoring", name: "Performance Monitoring" },
                    { id: "110202", slug: "evaluation_monitoring/monitoring/drift_detection", name: "Drift Detection" },
                ]
            },
        ]
    },

    // 12. DevOps / MLOps
    {
        id: "12",
        slug: "devops_mlops",
        name: "DevOps / MLOps",
        subcategories: [
            {
                id: "1201",
                slug: "devops_mlops/deployment",
                name: "Deployment",
                items: [
                    { id: "120101", slug: "devops_mlops/deployment/model_deployment", name: "Model Deployment" },
                    { id: "120102", slug: "devops_mlops/deployment/containerization", name: "Containerization" },
                    { id: "120103", slug: "devops_mlops/deployment/scaling", name: "Scaling" },
                ]
            },
            {
                id: "1202",
                slug: "devops_mlops/ci_cd",
                name: "CI/CD",
                items: [
                    { id: "120201", slug: "devops_mlops/ci_cd/continuous_integration", name: "Continuous Integration" },
                    { id: "120202", slug: "devops_mlops/ci_cd/continuous_deployment", name: "Continuous Deployment" },
                ]
            },
        ]
    },

    // 13. Governance & Compliance
    {
        id: "13",
        slug: "governance_compliance",
        name: "Governance & Compliance",
        subcategories: [
            {
                id: "1301",
                slug: "governance_compliance/governance",
                name: "Governance",
                items: [
                    { id: "130101", slug: "governance_compliance/governance/model_governance", name: "Model Governance" },
                    { id: "130102", slug: "governance_compliance/governance/audit_trails", name: "Audit Trails" },
                ]
            },
            {
                id: "1302",
                slug: "governance_compliance/compliance",
                name: "Compliance",
                items: [
                    { id: "130201", slug: "governance_compliance/compliance/regulatory_compliance", name: "Regulatory Compliance" },
                    { id: "130202", slug: "governance_compliance/compliance/bias_detection", name: "Bias Detection" },
                ]
            },
        ]
    },

    // 14. Tool Interaction
    {
        id: "14",
        slug: "tool_interaction",
        name: "Tool Interaction",
        subcategories: [
            {
                id: "1401",
                slug: "tool_interaction/api",
                name: "API",
                items: [
                    { id: "140101", slug: "tool_interaction/api/api_schema_understanding", name: "API Schema Understanding" },
                    { id: "140102", slug: "tool_interaction/api/api_invocation", name: "API Invocation" },
                ]
            },
            {
                id: "1402",
                slug: "tool_interaction/automation",
                name: "Automation",
                items: [
                    { id: "140201", slug: "tool_interaction/automation/workflow_automation", name: "Workflow Automation" },
                    { id: "140202", slug: "tool_interaction/automation/code_execution", name: "Code Execution" },
                ]
            },
        ]
    },

    // 15. Advanced Reasoning & Planning
    {
        id: "15",
        slug: "advanced_reasoning_planning",
        name: "Advanced Reasoning & Planning",
        subcategories: [
            {
                id: "1501",
                slug: "advanced_reasoning_planning/reasoning",
                name: "Reasoning",
                items: [
                    { id: "150101", slug: "advanced_reasoning_planning/reasoning/chain_of_thought", name: "Chain of Thought" },
                    { id: "150102", slug: "advanced_reasoning_planning/reasoning/logical_reasoning", name: "Logical Reasoning" },
                ]
            },
            {
                id: "1502",
                slug: "advanced_reasoning_planning/planning",
                name: "Planning",
                items: [
                    { id: "150201", slug: "advanced_reasoning_planning/planning/task_decomposition", name: "Task Decomposition" },
                    { id: "150202", slug: "advanced_reasoning_planning/planning/goal_oriented_planning", name: "Goal-Oriented Planning" },
                ]
            },
        ]
    },
];

// ============================================
// DOMAINS TAXONOMY (24 Main Categories)
// ============================================

export const OASF_DOMAINS_TAXONOMY: TaxonomyCategory[] = [
    // 1. Technology
    {
        id: "D1",
        slug: "technology",
        name: "Technology",
        subcategories: [
            {
                id: "D101",
                slug: "technology/software_engineering",
                name: "Software Engineering",
                items: [
                    { id: "D10101", slug: "technology/software_engineering/devops", name: "DevOps" },
                    { id: "D10102", slug: "technology/software_engineering/apis_integration", name: "APIs & Integration" },
                    { id: "D10103", slug: "technology/software_engineering/web_development", name: "Web Development" },
                    { id: "D10104", slug: "technology/software_engineering/mobile_development", name: "Mobile Development" },
                ]
            },
            {
                id: "D102",
                slug: "technology/blockchain",
                name: "Blockchain",
                items: [
                    { id: "D10201", slug: "technology/blockchain/cryptocurrency", name: "Cryptocurrency" },
                    { id: "D10202", slug: "technology/blockchain/defi", name: "DeFi" },
                    { id: "D10203", slug: "technology/blockchain/nft", name: "NFT" },
                    { id: "D10204", slug: "technology/blockchain/smart_contracts", name: "Smart Contracts" },
                ]
            },
            {
                id: "D103",
                slug: "technology/artificial_intelligence",
                name: "Artificial Intelligence",
                items: [
                    { id: "D10301", slug: "technology/artificial_intelligence/machine_learning", name: "Machine Learning" },
                    { id: "D10302", slug: "technology/artificial_intelligence/deep_learning", name: "Deep Learning" },
                    { id: "D10303", slug: "technology/artificial_intelligence/generative_ai", name: "Generative AI" },
                ]
            },
            {
                id: "D104",
                slug: "technology/cybersecurity",
                name: "Cybersecurity",
                items: [
                    { id: "D10401", slug: "technology/cybersecurity/network_security", name: "Network Security" },
                    { id: "D10402", slug: "technology/cybersecurity/application_security", name: "Application Security" },
                    { id: "D10403", slug: "technology/cybersecurity/threat_intelligence", name: "Threat Intelligence" },
                ]
            },
            {
                id: "D105",
                slug: "technology/cloud_computing",
                name: "Cloud Computing",
                items: [
                    { id: "D10501", slug: "technology/cloud_computing/infrastructure", name: "Infrastructure" },
                    { id: "D10502", slug: "technology/cloud_computing/serverless", name: "Serverless" },
                    { id: "D10503", slug: "technology/cloud_computing/containers", name: "Containers" },
                ]
            },
        ]
    },

    // 2. Finance and Business
    {
        id: "D2",
        slug: "finance_and_business",
        name: "Finance and Business",
        subcategories: [
            {
                id: "D201",
                slug: "finance_and_business/finance",
                name: "Finance",
                items: [
                    { id: "D20101", slug: "finance_and_business/finance/financial_analysis", name: "Financial Analysis" },
                    { id: "D20102", slug: "finance_and_business/finance/risk_management", name: "Risk Management" },
                    { id: "D20103", slug: "finance_and_business/finance/portfolio_management", name: "Portfolio Management" },
                ]
            },
            {
                id: "D202",
                slug: "finance_and_business/investment",
                name: "Investment",
                items: [
                    { id: "D20201", slug: "finance_and_business/investment/trading", name: "Trading" },
                    { id: "D20202", slug: "finance_and_business/investment/investment_research", name: "Investment Research" },
                ]
            },
            {
                id: "D203",
                slug: "finance_and_business/accounting",
                name: "Accounting",
                items: [
                    { id: "D20301", slug: "finance_and_business/accounting/bookkeeping", name: "Bookkeeping" },
                    { id: "D20302", slug: "finance_and_business/accounting/tax_preparation", name: "Tax Preparation" },
                ]
            },
        ]
    },

    // 3. Life Science
    {
        id: "D3",
        slug: "life_science",
        name: "Life Science",
        subcategories: [
            {
                id: "D301",
                slug: "life_science/biology",
                name: "Biology",
                items: [
                    { id: "D30101", slug: "life_science/biology/genomics", name: "Genomics" },
                    { id: "D30102", slug: "life_science/biology/proteomics", name: "Proteomics" },
                ]
            },
            {
                id: "D302",
                slug: "life_science/pharmaceuticals",
                name: "Pharmaceuticals",
                items: [
                    { id: "D30201", slug: "life_science/pharmaceuticals/drug_discovery", name: "Drug Discovery" },
                    { id: "D30202", slug: "life_science/pharmaceuticals/clinical_trials", name: "Clinical Trials" },
                ]
            },
        ]
    },

    // 4. Trust and Safety
    {
        id: "D4",
        slug: "trust_and_safety",
        name: "Trust and Safety",
        subcategories: [
            {
                id: "D401",
                slug: "trust_and_safety/content_moderation",
                name: "Content Moderation",
                items: [
                    { id: "D40101", slug: "trust_and_safety/content_moderation/harmful_content_detection", name: "Harmful Content Detection" },
                    { id: "D40102", slug: "trust_and_safety/content_moderation/misinformation_detection", name: "Misinformation Detection" },
                ]
            },
            {
                id: "D402",
                slug: "trust_and_safety/fraud_prevention",
                name: "Fraud Prevention",
                items: [
                    { id: "D40201", slug: "trust_and_safety/fraud_prevention/identity_verification", name: "Identity Verification" },
                    { id: "D40202", slug: "trust_and_safety/fraud_prevention/transaction_monitoring", name: "Transaction Monitoring" },
                ]
            },
        ]
    },

    // 5. Human Resources
    {
        id: "D5",
        slug: "human_resources",
        name: "Human Resources",
        subcategories: [
            {
                id: "D501",
                slug: "human_resources/recruitment",
                name: "Recruitment",
                items: [
                    { id: "D50101", slug: "human_resources/recruitment/candidate_sourcing", name: "Candidate Sourcing" },
                    { id: "D50102", slug: "human_resources/recruitment/resume_screening", name: "Resume Screening" },
                ]
            },
            {
                id: "D502",
                slug: "human_resources/employee_management",
                name: "Employee Management",
                items: [
                    { id: "D50201", slug: "human_resources/employee_management/performance_reviews", name: "Performance Reviews" },
                    { id: "D50202", slug: "human_resources/employee_management/training", name: "Training" },
                ]
            },
        ]
    },

    // 6. Education
    {
        id: "D6",
        slug: "education",
        name: "Education",
        subcategories: [
            {
                id: "D601",
                slug: "education/learning",
                name: "Learning",
                items: [
                    { id: "D60101", slug: "education/learning/tutoring", name: "Tutoring" },
                    { id: "D60102", slug: "education/learning/course_creation", name: "Course Creation" },
                    { id: "D60103", slug: "education/learning/language_learning", name: "Language Learning" },
                ]
            },
            {
                id: "D602",
                slug: "education/assessment",
                name: "Assessment",
                items: [
                    { id: "D60201", slug: "education/assessment/grading", name: "Grading" },
                    { id: "D60202", slug: "education/assessment/quiz_generation", name: "Quiz Generation" },
                ]
            },
        ]
    },

    // 7. Industrial Manufacturing
    {
        id: "D7",
        slug: "industrial_manufacturing",
        name: "Industrial Manufacturing",
        subcategories: [
            {
                id: "D701",
                slug: "industrial_manufacturing/production",
                name: "Production",
                items: [
                    { id: "D70101", slug: "industrial_manufacturing/production/quality_control", name: "Quality Control" },
                    { id: "D70102", slug: "industrial_manufacturing/production/process_optimization", name: "Process Optimization" },
                ]
            },
            {
                id: "D702",
                slug: "industrial_manufacturing/maintenance",
                name: "Maintenance",
                items: [
                    { id: "D70201", slug: "industrial_manufacturing/maintenance/predictive_maintenance", name: "Predictive Maintenance" },
                    { id: "D70202", slug: "industrial_manufacturing/maintenance/equipment_monitoring", name: "Equipment Monitoring" },
                ]
            },
        ]
    },

    // 8. Transportation
    {
        id: "D8",
        slug: "transportation",
        name: "Transportation",
        subcategories: [
            {
                id: "D801",
                slug: "transportation/logistics",
                name: "Logistics",
                items: [
                    { id: "D80101", slug: "transportation/logistics/route_optimization", name: "Route Optimization" },
                    { id: "D80102", slug: "transportation/logistics/fleet_management", name: "Fleet Management" },
                ]
            },
            {
                id: "D802",
                slug: "transportation/autonomous",
                name: "Autonomous",
                items: [
                    { id: "D80201", slug: "transportation/autonomous/self_driving", name: "Self-Driving" },
                    { id: "D80202", slug: "transportation/autonomous/drone_delivery", name: "Drone Delivery" },
                ]
            },
        ]
    },

    // 9. Healthcare
    {
        id: "D9",
        slug: "healthcare",
        name: "Healthcare",
        subcategories: [
            {
                id: "D901",
                slug: "healthcare/clinical",
                name: "Clinical",
                items: [
                    { id: "D90101", slug: "healthcare/clinical/diagnosis_support", name: "Diagnosis Support" },
                    { id: "D90102", slug: "healthcare/clinical/treatment_planning", name: "Treatment Planning" },
                ]
            },
            {
                id: "D902",
                slug: "healthcare/administration",
                name: "Administration",
                items: [
                    { id: "D90201", slug: "healthcare/administration/medical_records", name: "Medical Records" },
                    { id: "D90202", slug: "healthcare/administration/appointment_scheduling", name: "Appointment Scheduling" },
                ]
            },
        ]
    },

    // 10. Legal
    {
        id: "D10",
        slug: "legal",
        name: "Legal",
        subcategories: [
            {
                id: "D1001",
                slug: "legal/legal_research",
                name: "Legal Research",
                items: [
                    { id: "D100101", slug: "legal/legal_research/case_law_research", name: "Case Law Research" },
                    { id: "D100102", slug: "legal/legal_research/contract_analysis", name: "Contract Analysis" },
                ]
            },
            {
                id: "D1002",
                slug: "legal/document_drafting",
                name: "Document Drafting",
                items: [
                    { id: "D100201", slug: "legal/document_drafting/contract_drafting", name: "Contract Drafting" },
                    { id: "D100202", slug: "legal/document_drafting/legal_correspondence", name: "Legal Correspondence" },
                ]
            },
        ]
    },

    // 11. Agriculture
    {
        id: "D11",
        slug: "agriculture",
        name: "Agriculture",
        subcategories: [
            {
                id: "D1101",
                slug: "agriculture/farming",
                name: "Farming",
                items: [
                    { id: "D110101", slug: "agriculture/farming/crop_monitoring", name: "Crop Monitoring" },
                    { id: "D110102", slug: "agriculture/farming/yield_prediction", name: "Yield Prediction" },
                ]
            },
            {
                id: "D1102",
                slug: "agriculture/livestock",
                name: "Livestock",
                items: [
                    { id: "D110201", slug: "agriculture/livestock/animal_health", name: "Animal Health" },
                    { id: "D110202", slug: "agriculture/livestock/breeding_optimization", name: "Breeding Optimization" },
                ]
            },
        ]
    },

    // 12. Energy
    {
        id: "D12",
        slug: "energy",
        name: "Energy",
        subcategories: [
            {
                id: "D1201",
                slug: "energy/renewable",
                name: "Renewable",
                items: [
                    { id: "D120101", slug: "energy/renewable/solar_optimization", name: "Solar Optimization" },
                    { id: "D120102", slug: "energy/renewable/wind_forecasting", name: "Wind Forecasting" },
                ]
            },
            {
                id: "D1202",
                slug: "energy/grid_management",
                name: "Grid Management",
                items: [
                    { id: "D120201", slug: "energy/grid_management/load_balancing", name: "Load Balancing" },
                    { id: "D120202", slug: "energy/grid_management/demand_forecasting", name: "Demand Forecasting" },
                ]
            },
        ]
    },

    // 13. Media and Entertainment
    {
        id: "D13",
        slug: "media_and_entertainment",
        name: "Media and Entertainment",
        subcategories: [
            {
                id: "D1301",
                slug: "media_and_entertainment/content_creation",
                name: "Content Creation",
                items: [
                    { id: "D130101", slug: "media_and_entertainment/content_creation/copywriting", name: "Copywriting" },
                    { id: "D130102", slug: "media_and_entertainment/content_creation/storytelling", name: "Storytelling" },
                    { id: "D130103", slug: "media_and_entertainment/content_creation/video_production", name: "Video Production" },
                ]
            },
            {
                id: "D1302",
                slug: "media_and_entertainment/social_media",
                name: "Social Media",
                items: [
                    { id: "D130201", slug: "media_and_entertainment/social_media/content_scheduling", name: "Content Scheduling" },
                    { id: "D130202", slug: "media_and_entertainment/social_media/engagement_analysis", name: "Engagement Analysis" },
                ]
            },
        ]
    },

    // 14. Real Estate
    {
        id: "D14",
        slug: "real_estate",
        name: "Real Estate",
        subcategories: [
            {
                id: "D1401",
                slug: "real_estate/property",
                name: "Property",
                items: [
                    { id: "D140101", slug: "real_estate/property/property_valuation", name: "Property Valuation" },
                    { id: "D140102", slug: "real_estate/property/market_analysis", name: "Market Analysis" },
                ]
            },
            {
                id: "D1402",
                slug: "real_estate/management",
                name: "Management",
                items: [
                    { id: "D140201", slug: "real_estate/management/tenant_management", name: "Tenant Management" },
                    { id: "D140202", slug: "real_estate/management/lease_administration", name: "Lease Administration" },
                ]
            },
        ]
    },

    // 15. Hospitality and Tourism
    {
        id: "D15",
        slug: "hospitality_and_tourism",
        name: "Hospitality and Tourism",
        subcategories: [
            {
                id: "D1501",
                slug: "hospitality_and_tourism/travel",
                name: "Travel",
                items: [
                    { id: "D150101", slug: "hospitality_and_tourism/travel/trip_planning", name: "Trip Planning" },
                    { id: "D150102", slug: "hospitality_and_tourism/travel/booking_assistance", name: "Booking Assistance" },
                ]
            },
            {
                id: "D1502",
                slug: "hospitality_and_tourism/hospitality",
                name: "Hospitality",
                items: [
                    { id: "D150201", slug: "hospitality_and_tourism/hospitality/concierge_services", name: "Concierge Services" },
                    { id: "D150202", slug: "hospitality_and_tourism/hospitality/guest_experience", name: "Guest Experience" },
                ]
            },
        ]
    },

    // 16. Telecommunications
    {
        id: "D16",
        slug: "telecommunications",
        name: "Telecommunications",
        subcategories: [
            {
                id: "D1601",
                slug: "telecommunications/network",
                name: "Network",
                items: [
                    { id: "D160101", slug: "telecommunications/network/network_optimization", name: "Network Optimization" },
                    { id: "D160102", slug: "telecommunications/network/traffic_management", name: "Traffic Management" },
                ]
            },
            {
                id: "D1602",
                slug: "telecommunications/customer_service",
                name: "Customer Service",
                items: [
                    { id: "D160201", slug: "telecommunications/customer_service/support_automation", name: "Support Automation" },
                    { id: "D160202", slug: "telecommunications/customer_service/billing_inquiries", name: "Billing Inquiries" },
                ]
            },
        ]
    },

    // 17. Environmental Science
    {
        id: "D17",
        slug: "environmental_science",
        name: "Environmental Science",
        subcategories: [
            {
                id: "D1701",
                slug: "environmental_science/climate",
                name: "Climate",
                items: [
                    { id: "D170101", slug: "environmental_science/climate/climate_modeling", name: "Climate Modeling" },
                    { id: "D170102", slug: "environmental_science/climate/emissions_tracking", name: "Emissions Tracking" },
                ]
            },
            {
                id: "D1702",
                slug: "environmental_science/conservation",
                name: "Conservation",
                items: [
                    { id: "D170201", slug: "environmental_science/conservation/biodiversity_monitoring", name: "Biodiversity Monitoring" },
                    { id: "D170202", slug: "environmental_science/conservation/habitat_analysis", name: "Habitat Analysis" },
                ]
            },
        ]
    },

    // 18. Government and Public Sector
    {
        id: "D18",
        slug: "government_and_public_sector",
        name: "Government and Public Sector",
        subcategories: [
            {
                id: "D1801",
                slug: "government_and_public_sector/public_services",
                name: "Public Services",
                items: [
                    { id: "D180101", slug: "government_and_public_sector/public_services/citizen_assistance", name: "Citizen Assistance" },
                    { id: "D180102", slug: "government_and_public_sector/public_services/document_processing", name: "Document Processing" },
                ]
            },
            {
                id: "D1802",
                slug: "government_and_public_sector/policy",
                name: "Policy",
                items: [
                    { id: "D180201", slug: "government_and_public_sector/policy/policy_analysis", name: "Policy Analysis" },
                    { id: "D180202", slug: "government_and_public_sector/policy/impact_assessment", name: "Impact Assessment" },
                ]
            },
        ]
    },

    // 19. Research and Development
    {
        id: "D19",
        slug: "research_and_development",
        name: "Research and Development",
        subcategories: [
            {
                id: "D1901",
                slug: "research_and_development/research",
                name: "Research",
                items: [
                    { id: "D190101", slug: "research_and_development/research/literature_review", name: "Literature Review" },
                    { id: "D190102", slug: "research_and_development/research/data_collection", name: "Data Collection" },
                ]
            },
            {
                id: "D1902",
                slug: "research_and_development/data_science",
                name: "Data Science",
                items: [
                    { id: "D190201", slug: "research_and_development/data_science/experimentation", name: "Experimentation" },
                    { id: "D190202", slug: "research_and_development/data_science/hypothesis_testing", name: "Hypothesis Testing" },
                ]
            },
        ]
    },

    // 20. Retail and E-commerce
    {
        id: "D20",
        slug: "retail_and_ecommerce",
        name: "Retail and E-commerce",
        subcategories: [
            {
                id: "D2001",
                slug: "retail_and_ecommerce/sales",
                name: "Sales",
                items: [
                    { id: "D200101", slug: "retail_and_ecommerce/sales/product_recommendations", name: "Product Recommendations" },
                    { id: "D200102", slug: "retail_and_ecommerce/sales/pricing_optimization", name: "Pricing Optimization" },
                ]
            },
            {
                id: "D2002",
                slug: "retail_and_ecommerce/customer_service",
                name: "Customer Service",
                items: [
                    { id: "D200201", slug: "retail_and_ecommerce/customer_service/order_support", name: "Order Support" },
                    { id: "D200202", slug: "retail_and_ecommerce/customer_service/returns_processing", name: "Returns Processing" },
                ]
            },
        ]
    },

    // 21. Social Services
    {
        id: "D21",
        slug: "social_services",
        name: "Social Services",
        subcategories: [
            {
                id: "D2101",
                slug: "social_services/welfare",
                name: "Welfare",
                items: [
                    { id: "D210101", slug: "social_services/welfare/benefits_assistance", name: "Benefits Assistance" },
                    { id: "D210102", slug: "social_services/welfare/case_management", name: "Case Management" },
                ]
            },
            {
                id: "D2102",
                slug: "social_services/mental_health",
                name: "Mental Health",
                items: [
                    { id: "D210201", slug: "social_services/mental_health/counseling_support", name: "Counseling Support" },
                    { id: "D210202", slug: "social_services/mental_health/crisis_intervention", name: "Crisis Intervention" },
                ]
            },
        ]
    },

    // 22. Sports and Fitness
    {
        id: "D22",
        slug: "sports_and_fitness",
        name: "Sports and Fitness",
        subcategories: [
            {
                id: "D2201",
                slug: "sports_and_fitness/training",
                name: "Training",
                items: [
                    { id: "D220101", slug: "sports_and_fitness/training/workout_planning", name: "Workout Planning" },
                    { id: "D220102", slug: "sports_and_fitness/training/performance_tracking", name: "Performance Tracking" },
                ]
            },
            {
                id: "D2202",
                slug: "sports_and_fitness/analytics",
                name: "Analytics",
                items: [
                    { id: "D220201", slug: "sports_and_fitness/analytics/game_analysis", name: "Game Analysis" },
                    { id: "D220202", slug: "sports_and_fitness/analytics/player_scouting", name: "Player Scouting" },
                ]
            },
        ]
    },

    // 23. Insurance
    {
        id: "D23",
        slug: "insurance",
        name: "Insurance",
        subcategories: [
            {
                id: "D2301",
                slug: "insurance/underwriting",
                name: "Underwriting",
                items: [
                    { id: "D230101", slug: "insurance/underwriting/risk_assessment", name: "Risk Assessment" },
                    { id: "D230102", slug: "insurance/underwriting/policy_pricing", name: "Policy Pricing" },
                ]
            },
            {
                id: "D2302",
                slug: "insurance/claims",
                name: "Claims",
                items: [
                    { id: "D230201", slug: "insurance/claims/claims_processing", name: "Claims Processing" },
                    { id: "D230202", slug: "insurance/claims/fraud_investigation", name: "Fraud Investigation" },
                ]
            },
        ]
    },

    // 24. Marketing and Advertising
    {
        id: "D24",
        slug: "marketing_and_advertising",
        name: "Marketing and Advertising",
        subcategories: [
            {
                id: "D2401",
                slug: "marketing_and_advertising/marketing",
                name: "Marketing",
                items: [
                    { id: "D240101", slug: "marketing_and_advertising/marketing/campaign_management", name: "Campaign Management" },
                    { id: "D240102", slug: "marketing_and_advertising/marketing/audience_targeting", name: "Audience Targeting" },
                ]
            },
            {
                id: "D2402",
                slug: "marketing_and_advertising/analytics",
                name: "Analytics",
                items: [
                    { id: "D240201", slug: "marketing_and_advertising/analytics/conversion_tracking", name: "Conversion Tracking" },
                    { id: "D240202", slug: "marketing_and_advertising/analytics/roi_analysis", name: "ROI Analysis" },
                ]
            },
        ]
    },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get all selectable items from a category
export function getSelectableItems(category: TaxonomyCategory): TaxonomyItem[] {
    const items: TaxonomyItem[] = [];
    for (const subcategory of category.subcategories) {
        if (subcategory.items.length > 0) {
            items.push(...subcategory.items);
        } else {
            // Subcategory itself is selectable
            items.push({
                id: subcategory.id,
                slug: subcategory.slug,
                name: subcategory.name,
            });
        }
    }
    return items;
}

// Get item name from slug
export function getItemNameFromSlug(slug: string, taxonomies: TaxonomyCategory[]): string | null {
    for (const category of taxonomies) {
        for (const subcategory of category.subcategories) {
            for (const item of subcategory.items) {
                if (item.slug === slug) {
                    return item.name;
                }
            }
            // Check if subcategory slug matches
            if (subcategory.slug === slug) {
                return subcategory.name;
            }
        }
    }
    return null;
}

// Backward compatibility: flat lists for existing code
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

// Generate flat skills list from taxonomy
export const OASF_SKILLS: OASFSkill[] = OASF_SKILLS_TAXONOMY.flatMap(category =>
    category.subcategories.flatMap(subcategory =>
        subcategory.items.map(item => ({
            slug: item.slug,
            name: item.name,
            category: category.name,
        }))
    )
);

// Generate flat domains list from taxonomy
export const OASF_DOMAINS: OASFDomain[] = OASF_DOMAINS_TAXONOMY.flatMap(category =>
    category.subcategories.flatMap(subcategory =>
        subcategory.items.map(item => ({
            slug: item.slug,
            name: item.name,
            category: category.name,
        }))
    )
);

// Group skills by category for UI (backward compatible)
export function getSkillsByCategory(): Record<string, OASFSkill[]> {
    return OASF_SKILLS.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<string, OASFSkill[]>);
}

// Group domains by category for UI (backward compatible)
export function getDomainsByCategory(): Record<string, OASFDomain[]> {
    return OASF_DOMAINS.reduce((acc, domain) => {
        if (!acc[domain.category]) acc[domain.category] = [];
        acc[domain.category].push(domain);
        return acc;
    }, {} as Record<string, OASFDomain[]>);
}
