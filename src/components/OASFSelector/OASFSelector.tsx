import { useState, useCallback } from 'react';
import type { TaxonomyCategory, TaxonomySubcategory } from '../../data/oasfTaxonomy';
import { getItemNameFromSlug } from '../../data/oasfTaxonomy';
import './OASFSelector.css';

interface OASFSelectorProps {
    type: 'skills' | 'domains';
    taxonomy: TaxonomyCategory[];
    selectedSlugs: string[];
    onSelectionChange: (slugs: string[]) => void;
    maxSelections: number;
}

export default function OASFSelector({
    type,
    taxonomy,
    selectedSlugs,
    onSelectionChange,
    maxSelections,
}: OASFSelectorProps) {
    // Track expanded categories and subcategories
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

    const isAtLimit = selectedSlugs.length >= maxSelections;

    // Toggle category expansion
    const toggleCategory = useCallback((categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    }, []);

    // Toggle subcategory expansion
    const toggleSubcategory = useCallback((subcategoryId: string) => {
        setExpandedSubcategories(prev => {
            const next = new Set(prev);
            if (next.has(subcategoryId)) {
                next.delete(subcategoryId);
            } else {
                next.add(subcategoryId);
            }
            return next;
        });
    }, []);

    // Toggle item selection
    const toggleItem = useCallback((slug: string) => {
        if (selectedSlugs.includes(slug)) {
            // Always allow deselection
            onSelectionChange(selectedSlugs.filter(s => s !== slug));
        } else if (!isAtLimit) {
            // Only allow selection if not at limit
            onSelectionChange([...selectedSlugs, slug]);
        }
    }, [selectedSlugs, onSelectionChange, isAtLimit]);

    // Remove selected item (from chip)
    const removeItem = useCallback((slug: string) => {
        onSelectionChange(selectedSlugs.filter(s => s !== slug));
    }, [selectedSlugs, onSelectionChange]);

    // Get display name for a slug
    const getDisplayName = useCallback((slug: string): string => {
        return getItemNameFromSlug(slug, taxonomy) || slug.split('/').pop()?.replace(/_/g, ' ') || slug;
    }, [taxonomy]);

    // Count selected items in a category
    const countSelectedInCategory = useCallback((category: TaxonomyCategory): number => {
        let count = 0;
        for (const subcategory of category.subcategories) {
            for (const item of subcategory.items) {
                if (selectedSlugs.includes(item.slug)) {
                    count++;
                }
            }
        }
        return count;
    }, [selectedSlugs]);

    // Count selected items in a subcategory
    const countSelectedInSubcategory = useCallback((subcategory: TaxonomySubcategory): number => {
        return subcategory.items.filter(item => selectedSlugs.includes(item.slug)).length;
    }, [selectedSlugs]);

    const title = type === 'skills' ? 'Skills' : 'Domains';

    return (
        <div className="oasf-selector">
            {/* Header with count */}
            <div className="oasf-header">
                <h3 className="oasf-title">{title}</h3>
                <span className={`oasf-count ${isAtLimit ? 'at-limit' : ''}`}>
                    {selectedSlugs.length}/{maxSelections} selected
                </span>
            </div>

            {/* Selected chips */}
            {selectedSlugs.length > 0 && (
                <div className="oasf-selected-chips">
                    {selectedSlugs.map(slug => (
                        <span key={slug} className="oasf-chip">
                            {getDisplayName(slug)}
                            <button
                                type="button"
                                className="oasf-chip-remove"
                                onClick={() => removeItem(slug)}
                                aria-label={`Remove ${getDisplayName(slug)}`}
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Limit warning */}
            {isAtLimit && (
                <div className="oasf-limit-warning">
                    Maximum {maxSelections} {title.toLowerCase()} reached. Remove one to add another.
                </div>
            )}

            {/* Accordion tree */}
            <div className="oasf-accordion">
                {taxonomy.map(category => {
                    const isCategoryExpanded = expandedCategories.has(category.id);
                    const selectedInCategory = countSelectedInCategory(category);

                    return (
                        <div key={category.id} className="oasf-category">
                            {/* Category header */}
                            <button
                                type="button"
                                className={`oasf-category-header ${isCategoryExpanded ? 'expanded' : ''}`}
                                onClick={() => toggleCategory(category.id)}
                            >
                                <span className="oasf-expand-icon">
                                    {isCategoryExpanded ? '▼' : '▶'}
                                </span>
                                <span className="oasf-category-name">{category.name}</span>
                                {selectedInCategory > 0 && (
                                    <span className="oasf-category-badge">{selectedInCategory}</span>
                                )}
                            </button>

                            {/* Subcategories */}
                            {isCategoryExpanded && (
                                <div className="oasf-subcategories">
                                    {category.subcategories.map(subcategory => {
                                        const isSubcategoryExpanded = expandedSubcategories.has(subcategory.id);
                                        const selectedInSubcategory = countSelectedInSubcategory(subcategory);

                                        return (
                                            <div key={subcategory.id} className="oasf-subcategory">
                                                {/* Subcategory header */}
                                                <button
                                                    type="button"
                                                    className={`oasf-subcategory-header ${isSubcategoryExpanded ? 'expanded' : ''}`}
                                                    onClick={() => toggleSubcategory(subcategory.id)}
                                                >
                                                    <span className="oasf-expand-icon">
                                                        {isSubcategoryExpanded ? '▼' : '▶'}
                                                    </span>
                                                    <span className="oasf-subcategory-name">{subcategory.name}</span>
                                                    {selectedInSubcategory > 0 && (
                                                        <span className="oasf-subcategory-badge">{selectedInSubcategory}</span>
                                                    )}
                                                </button>

                                                {/* Items */}
                                                {isSubcategoryExpanded && (
                                                    <div className="oasf-items">
                                                        {subcategory.items.map(item => {
                                                            const isSelected = selectedSlugs.includes(item.slug);
                                                            const isDisabled = !isSelected && isAtLimit;

                                                            return (
                                                                <label
                                                                    key={item.id}
                                                                    className={`oasf-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        disabled={isDisabled}
                                                                        onChange={() => toggleItem(item.slug)}
                                                                        className="oasf-checkbox"
                                                                    />
                                                                    <span className="oasf-item-name">{item.name}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
