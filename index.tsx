import React, { useState, useEffect, useMemo, useCallback, Dispatch, SetStateAction } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';

// Local module imports
import { api } from './api';
import { useLocalStorage } from './hooks';
import { formatCurrency, generateId, fileToBase64 } from './utils';
import { Loader, Modal, PhotoViewerModal, ToastProvider, useToasts } from './components';
import type {
    User, Project, Client, UserProfile, Comment, EstimateItem, Estimate, EstimateTemplate,
    DirectoryItem, Expense, Payment, Discount, PhotoReport, ProjectScheduleItem,
    ProjectDocument, InventoryItem, ProjectNote, FormEstimateItem, ViewState
} from './types';
import {
    LogoIcon, EditIcon, DeleteIcon, CheckIcon, ReplayIcon, PrintIcon, SettingsIcon, ImageIcon,
    LogoutIcon, EmailIcon, LockIcon, ReportsIcon, DirectoryIcon, ProjectsIcon, SearchIcon,
    ShareIcon, ShoppingListIcon, DocumentIcon, CommentIcon, SaveTemplateIcon, ToolIcon, TemplateIcon
} from './icons';


// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('Service Worker registered: ', registration);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}


// --- CORE APP COMPONENTS ---

interface FinancialDashboardProps {
    project: Project;
}
const FinancialDashboard = ({ project }: FinancialDashboardProps) => {
    const totals = useMemo(() => {
        const estimateTotal = project.estimates.reduce((projectSum, estimate) => {
            const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
            const discountAmount = estimate.discount
                ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value)
                : 0;
            return projectSum + (subtotal - discountAmount);
        }, 0);

        const workTotal = project.estimates.flatMap(e => e.items)
            .filter(item => item.type === 'Работа')
            .reduce((sum, item) => sum + item.quantity * item.price, 0);

        const expensesTotal = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalPaid = project.payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Profit is the money for work minus additional expenses.
        const profit = workTotal - expensesTotal;
        const clientDebt = estimateTotal - totalPaid;

        return { estimateTotal, workTotal, expensesTotal, totalPaid, profit, clientDebt };
    }, [project]);

    return (
        <div className="card-inset">
            <div className="financial-summary-grid">
                <div className="summary-item">
                    <div className="summary-item-label">Смета</div>
                    <div className="summary-item-value">{formatCurrency(totals.estimateTotal)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Оплачено</div>
                    <div className="summary-item-value">{formatCurrency(totals.totalPaid)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Долг клиента</div>
                    <div className={`summary-item-value ${totals.clientDebt > 0 ? 'loss' : ''}`}>
                        {formatCurrency(totals.clientDebt)}
                    </div>
                </div>
                 <div className="summary-item">
                    <div className="summary-item-label">Стоимость работ</div>
                    <div className="summary-item-value">{formatCurrency(totals.workTotal)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Расходы</div>
                    <div className="summary-item-value">{formatCurrency(totals.expensesTotal)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Прибыль</div>
                    <div className={`summary-item-value ${totals.profit >= 0 ? 'profit' : 'loss'}`}>
                        {formatCurrency(totals.profit)}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CommentModalProps {
    show: boolean;
    onClose: () => void;
    item: EstimateItem | null;
    onAddComment: (itemId: string, commentText: string) => void;
}
const CommentModal = ({ show, onClose, item, onAddComment }: CommentModalProps) => {
    const [newComment, setNewComment] = useState('');
    
    if (!item) return null;

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(item.id, newComment.trim());
            setNewComment('');
        }
    };

    return (
        <Modal show={show} onClose={onClose} title={`Комментарии: ${item.name}`}>
            <div className="comment-modal-body">
                <div className="comment-thread">
                    {(item.comments || []).length === 0 ? (
                        <p style={{textAlign: 'center', color: 'hsl(var(--text-secondary))'}}>Комментариев пока нет.</p>
                    ) : (
                        item.comments?.map(comment => (
                            <div key={comment.id} className={`comment-bubble author-${comment.author === 'Клиент' ? 'client' : 'contractor'}`}>
                                <p>{comment.text}</p>
                                <small>{new Date(comment.timestamp).toLocaleString('ru-RU')}</small>
                            </div>
                        ))
                    )}
                </div>
                <form className="comment-form" onSubmit={handleCommentSubmit}>
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ваш комментарий..."
                        style={{flex: 1}}
                    />
                    <button type="submit" className="btn btn-primary">Отправить</button>
                </form>
            </div>
        </Modal>
    );
};

interface TemplateModalProps {
    show: boolean;
    onClose: () => void;
    templates: EstimateTemplate[];
    onApplyTemplate: (template: EstimateTemplate) => void;
    onDeleteTemplate: (templateId: string) => void;
}
const TemplateModal = ({ show, onClose, templates, onApplyTemplate, onDeleteTemplate }: TemplateModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredTemplates = useMemo(() => {
        const sortedTemplates = [...templates].sort((a, b) => a.name.localeCompare(b.name));
        if (!searchTerm.trim()) return sortedTemplates;
        return sortedTemplates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [templates, searchTerm]);

    const handleApply = (template: EstimateTemplate) => {
        onApplyTemplate(template);
        onClose();
    }

    return (
        <Modal show={show} onClose={onClose} title="Применить шаблон">
             <div className="search-container" style={{marginBottom: 'var(--space-4)'}}>
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Поиск по названию шаблона..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="template-list-container">
                {filteredTemplates.length > 0 ? (
                    <div className="data-list">
                        {filteredTemplates.map(template => (
                            <div key={template.id} className="data-item">
                                <div className="data-item-info">
                                    <p><strong>{template.name}</strong></p>
                                    <small>{template.items.length} поз.</small>
                                </div>
                                <div className="item-actions">
                                    <button className="btn btn-primary btn-sm" onClick={() => handleApply(template)}>Применить</button>
                                    <button className="action-btn" onClick={() => onDeleteTemplate(template.id)} aria-label="Удалить шаблон"><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: 'var(--space-4) 0'}}>
                        {searchTerm ? 'Шаблоны не найдены.' : 'У вас нет сохраненных шаблонов.'}
                    </p>
                )}
            </div>
        </Modal>
    );
}


interface EstimateEditorProps {
    estimate: Estimate;
    projectId: string;
    onUpdate: (updatedEstimate: Estimate) => Promise<void>;
    onDelete: (estimateId: string) => Promise<void>;
    directory: DirectoryItem[];
    setDirectory: React.Dispatch<React.SetStateAction<DirectoryItem[]>>;
    userKey: string;
    onSaveTemplate: (template: EstimateTemplate) => Promise<void>;
    templates: EstimateTemplate[];
    onDeleteTemplate: (templateId: string) => Promise<void>;
}

const EstimateEditor = ({ estimate, projectId, onUpdate, onDelete, directory, setDirectory, userKey, onSaveTemplate, templates, onDeleteTemplate }: EstimateEditorProps) => {
    const [showModal, setShowModal] = useState(false);
    const [showShoppingListModal, setShowShoppingListModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);
    const [newItem, setNewItem] = useState<FormEstimateItem>({ name: '', type: 'Работа', unit: 'шт', quantity: '1', price: '' });
    const [suggestions, setSuggestions] = useState<DirectoryItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(estimate.discount?.type || 'percent');
    const [discountValue, setDiscountValue] = useState<string | number>(estimate.discount?.value || '');
    const [estimateName, setEstimateName] = useState(estimate.name);

    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentingItem, setCommentingItem] = useState<EstimateItem | null>(null);

    useEffect(() => {
        setDiscountType(estimate.discount?.type || 'percent');
        setDiscountValue(estimate.discount?.value || '');
        setEstimateName(estimate.name);
    }, [estimate]);

    const isEditing = editingItem !== null;

    const parsedDiscountValue = parseFloat(String(discountValue)) || 0;

    const subtotal = useMemo(() => estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0), [estimate.items]);
    const discountAmount = useMemo(() => {
        if (discountType === 'percent') {
            return subtotal * (parsedDiscountValue / 100);
        }
        return parsedDiscountValue;
    }, [subtotal, discountType, parsedDiscountValue]);
    const total = subtotal - discountAmount;

    const shoppingList = useMemo(() => {
        return estimate.items
            .filter(item => item.type === 'Материал')
            .map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit }));
    }, [estimate.items]);

    const handleCopyShoppingList = () => {
        if (shoppingList.length === 0) return;
        const listText = shoppingList
            .map(item => `${item.name} - ${item.quantity} ${item.unit}`)
            .join('\n');
        navigator.clipboard.writeText(listText).then(() => {
            addToast('Список покупок скопирован!', 'success');
            setShowShoppingListModal(false);
        }, (err) => {
            console.error('Could not copy text: ', err);
            addToast('Не удалось скопировать', 'error');
        });
    };

    const openModalForNew = () => {
        setEditingItem(null);
        setNewItem({ name: '', type: 'Работа', unit: 'шт', quantity: '1', price: '' });
        setShowModal(true);
    };

    const openModalForEdit = (item: EstimateItem) => {
        setEditingItem(item);
        setNewItem({ ...item, quantity: String(item.quantity), price: String(item.price) });
        setShowModal(true);
    };

    const closeModal = () => {
        if(isSaving) return;
        setShowModal(false);
        setSuggestions([]);
        setEditingItem(null);
    };
    
    const handleSaveItem = async () => {
        const trimmedName = newItem.name.trim();
        if (!trimmedName) return;
        setIsSaving(true);

        const finalItemData = {
            name: trimmedName,
            type: newItem.type,
            unit: newItem.unit,
            quantity: parseFloat(String(newItem.quantity)) || 1,
            price: parseFloat(String(newItem.price)) || 0,
        };

        try {
            let updatedItems;
            if (isEditing && editingItem) { // Update existing item
                updatedItems = estimate.items.map(item => item.id === editingItem.id ? { ...item, ...finalItemData } : item);
            } else { // Add new item
                const itemWithId: EstimateItem = { ...finalItemData, id: generateId() };
                updatedItems = [...estimate.items, itemWithId];
            }
            await onUpdate({ ...estimate, items: updatedItems });
            
            const isInDirectory = directory.some(dirItem => dirItem.name.toLowerCase() === trimmedName.toLowerCase());
            if (!isInDirectory) {
                const newDirectoryItem: DirectoryItem = { 
                    id: generateId(), 
                    name: finalItemData.name, 
                    type: finalItemData.type, 
                    unit: finalItemData.unit, 
                    price: finalItemData.price 
                };
                const updatedDirectory = [...directory, newDirectoryItem];
                setDirectory(updatedDirectory);
                await api.saveData(userKey, 'directory', updatedDirectory);
            }
            addToast(isEditing ? 'Позиция обновлена' : 'Позиция добавлена', 'success');
            closeModal();
        } catch (e) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
            try {
                const updatedItems = estimate.items.filter(item => item.id !== itemId);
                await onUpdate({ ...estimate, items: updatedItems });
                addToast('Позиция удалена', 'success');
            } catch (e) {
                addToast('Не удалось удалить', 'error');
            }
        }
    };

    const handleDiscountChange = async (type: 'percent' | 'fixed', value: string | number) => {
        try {
            const newDiscount: Discount = { type, value: parseFloat(String(value)) || 0 };
            await onUpdate({ ...estimate, discount: newDiscount });
            addToast('Скидка применена', 'success');
        } catch (e) {
            addToast('Не удалось применить скидку', 'error');
        }
    };

    const handleNameChangeOnBlur = async () => {
        if (estimateName.trim() && estimateName !== estimate.name) {
            try {
                await onUpdate({ ...estimate, name: estimateName.trim() });
                addToast('Название сметы обновлено', 'success');
            } catch (e) {
                 addToast('Не удалось обновить название', 'error');
            }
        }
    };

    const handleShare = () => {
        const estimateLink = `${window.location.origin}${window.location.pathname}?view=estimate&projectId=${projectId}&estimateId=${estimate.id}`;
        navigator.clipboard.writeText(estimateLink).then(() => {
            addToast('Ссылка на смету скопирована!', 'success');
        });
    };

    const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewItem({ ...newItem, name: value });
        if (value.trim().length > 1) {
            const filteredSuggestions = directory.filter(item =>
                item.name.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion: DirectoryItem) => {
        setNewItem({
            ...newItem,
            name: suggestion.name,
            type: suggestion.type,
            unit: suggestion.unit,
            price: String(suggestion.price),
        });
        setSuggestions([]);
    };

    const handleSaveAsTemplate = () => {
        if (!estimateName.trim()) {
            addToast('Сначала введите название сметы', 'error');
            return;
        }
        if (estimate.items.length === 0) {
            addToast('Нельзя сохранить пустую смету как шаблон', 'error');
            return;
        }

        const template: EstimateTemplate = {
            id: generateId(),
            name: estimateName.trim(),
            items: estimate.items.map(({ name, type, unit, price }) => ({ name, type, unit, price }))
        };

        onSaveTemplate(template);
    };

    const openCommentModal = (item: EstimateItem) => {
        setCommentingItem(item);
        setShowCommentModal(true);
    };

    const handleAddComment = (itemId: string, commentText: string) => {
        const newComment: Comment = {
            id: generateId(),
            author: 'Исполнитель',
            text: commentText,
            timestamp: new Date().toISOString()
        };

        const updatedItems = estimate.items.map(item => {
            if (item.id === itemId) {
                return { ...item, comments: [...(item.comments || []), newComment] };
            }
            return item;
        });

        onUpdate({ ...estimate, items: updatedItems });
    };

    const handleApplyTemplate = (template: EstimateTemplate) => {
        const newItems: EstimateItem[] = template.items.map(item => ({
            ...item,
            id: generateId(),
            quantity: 1, // Default quantity
        }));
        const updatedItems = [...estimate.items, ...newItems];
        onUpdate({ ...estimate, items: updatedItems });
        addToast(`Шаблон "${template.name}" применен`, 'success');
    };
    
    return (
        <div className="card">
            <div className="estimate-card-header">
                <input 
                    type="text" 
                    value={estimateName} 
                    onChange={(e) => setEstimateName(e.target.value)}
                    onBlur={handleNameChangeOnBlur}
                    className="estimate-name-input"
                    aria-label="Название сметы"
                />
                <div className="card-header-actions">
                    <button className="btn btn-primary btn-sm" onClick={openModalForNew}>+ Добавить</button>
                    <button className="action-btn" onClick={() => setShowTemplateModal(true)} aria-label="Применить шаблон"><TemplateIcon /></button>
                    <button className="action-btn" onClick={handleSaveAsTemplate} aria-label="Сохранить как шаблон"><SaveTemplateIcon /></button>
                    <button className="action-btn" onClick={() => setShowShoppingListModal(true)} aria-label="Список покупок"><ShoppingListIcon /></button>
                    <button className="action-btn" onClick={handleShare} aria-label="Поделиться"><ShareIcon /></button>
                    <button className="action-btn" onClick={() => onDelete(estimate.id)} aria-label="Удалить смету"><DeleteIcon /></button>
                </div>
            </div>
             {estimate.approvedOn && (
                <span className="approval-badge">
                    <CheckIcon />
                    Согласована клиентом {new Date(estimate.approvedOn).toLocaleDateString('ru-RU')}
                </span>
            )}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Позиция</th>
                            <th className="align-right">Кол-во</th>
                            <th className="align-right">Цена</th>
                            <th className="align-right">Итог</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {estimate.items.length === 0 ? (
                            <tr><td colSpan={5} style={{textAlign: 'center', padding: '1rem'}}>Позиций пока нет.</td></tr>
                        ) : (
                            estimate.items.map((item, index) => (
                                <tr key={item.id} className="animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <td>
                                        <strong>{item.name}</strong>
                                        <br />
                                        <small>{item.type}</small>
                                    </td>
                                    <td className="align-right">{item.quantity} {item.unit}</td>
                                    <td className="align-right">{formatCurrency(item.price)}</td>
                                    <td className="align-right">{formatCurrency(item.quantity * item.price)}</td>
                                    <td className="align-right">
                                        <div className="item-actions">
                                            <button className="action-btn comment-btn" onClick={() => openCommentModal(item)} aria-label="Комментарии">
                                                <CommentIcon />
                                                {(item.comments?.length || 0) > 0 && <span className="comment-badge">{item.comments?.length}</span>}
                                            </button>
                                            <button className="action-btn" onClick={() => openModalForEdit(item)} aria-label="Редактировать"><EditIcon /></button>
                                            <button className="action-btn" onClick={() => handleDeleteItem(item.id)} aria-label="Удалить"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="estimate-summary-container">
                <div className="discount-controls">
                    <label>Скидка</label>
                    <div className="d-flex">
                        <div className="modal-toggle">
                            <button className={discountType === 'percent' ? 'active' : ''} onClick={() => { setDiscountType('percent'); handleDiscountChange('percent', discountValue); }}>%</button>
                            <button className={discountType === 'fixed' ? 'active' : ''} onClick={() => { setDiscountType('fixed'); handleDiscountChange('fixed', discountValue); }}>₽</button>
                        </div>
                        <input 
                            type="number" 
                            className="discount-input"
                            value={discountValue} 
                            placeholder="0"
                            onChange={(e) => setDiscountValue(e.target.value)}
                            onBlur={() => handleDiscountChange(discountType, discountValue)}
                            step={discountType === 'percent' ? '0.1' : '100'}
                        />
                    </div>
                </div>

                <div className="estimate-totals">
                     <div className="total-row">
                         <span>Подытог</span>
                         <span>{formatCurrency(subtotal)}</span>
                     </div>
                     {discountAmount > 0 && (
                         <div className="total-row discount-row">
                             <span>Скидка ({discountType === 'percent' ? `${parsedDiscountValue}%` : formatCurrency(parsedDiscountValue)})</span>
                             <span>- {formatCurrency(discountAmount)}</span>
                         </div>
                     )}
                     <div className="total-row grand-total">
                         <span>Итого</span>
                         <span>{formatCurrency(total)}</span>
                     </div>
                 </div>
            </div>

             <Modal show={showModal} onClose={closeModal} title={isEditing ? 'Редактировать позицию' : 'Добавить позицию'}>
                <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSaveItem(); }}>
                    <div className="form-group autocomplete-container">
                        <label>Наименование</label>
                        <input type="text" value={newItem.name} onChange={handleNameInputChange} required autoComplete="off" disabled={isSaving}/>
                        {suggestions.length > 0 && (
                            <div className="autocomplete-suggestions">
                                {suggestions.map(suggestion => (
                                    <div key={suggestion.id} className="suggestion-item" onClick={() => handleSuggestionClick(suggestion)}>
                                        <div className="suggestion-name">{suggestion.name}</div>
                                        <div className="suggestion-details">
                                            {formatCurrency(suggestion.price)} ({suggestion.type})
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                     <div className="form-group">
                        <label>Тип</label>
                        <select value={newItem.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItem({...newItem, type: e.target.value as 'Работа' | 'Материал'})} disabled={isSaving}>
                            <option>Работа</option>
                            <option>Материал</option>
                        </select>
                    </div>
                    <div className="d-flex gap-1">
                        <div className="form-group w-100">
                           <label>Количество</label>
                           <input type="number" step="any" value={newItem.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, quantity: e.target.value})} required disabled={isSaving}/>
                        </div>
                        <div className="form-group w-100">
                           <label>Ед. изм.</label>
                           <input type="text" value={newItem.unit} placeholder="шт, м², час" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, unit: e.target.value})} required disabled={isSaving}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Цена за единицу</label>
                        <input type="number" step="0.01" value={newItem.price} placeholder="0" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, price: e.target.value})} required disabled={isSaving}/>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? <Loader /> : (isEditing ? 'Сохранить' : 'Добавить')}
                        </button>
                    </div>
                </form>
            </Modal>
             <Modal show={showShoppingListModal} onClose={() => setShowShoppingListModal(false)} title="Список покупок">
                <div className="shopping-list-container">
                    {shoppingList.length > 0 ? (
                        <ul className="shopping-list">
                            {shoppingList.map((item, index) => (
                                <li key={index} className="shopping-list-item">
                                    <span className="shopping-list-name">{item.name}</span>
                                    <span className="shopping-list-quantity">{item.quantity} {item.unit}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>В смете нет материалов для составления списка.</p>
                    )}
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowShoppingListModal(false)}>Закрыть</button>
                    <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={handleCopyShoppingList}
                        disabled={shoppingList.length === 0}
                    >
                        Скопировать список
                    </button>
                </div>
            </Modal>
            <CommentModal
                show={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                item={commentingItem}
                onAddComment={handleAddComment}
            />
            <TemplateModal
                show={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                templates={templates}
                onApplyTemplate={handleApplyTemplate}
                onDeleteTemplate={onDeleteTemplate}
            />
        </div>
    );
};

interface ExpenseTrackerProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const ExpenseTracker = ({ project, projects, setProjects, userKey }: ExpenseTrackerProps) => {
    const [showModal, setShowModal] = useState(false);
    const [entryType, setEntryType] = useState<'expense' | 'payment'>('expense');
    const [newEntry, setNewEntry] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '' as string | number });
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();

    const transactions = useMemo(() => {
        const combinedExpenses = project.expenses.map(e => ({ ...e, type: 'expense' as const }));
        const combinedPayments = project.payments.map(p => ({ ...p, type: 'payment' as const, description: 'Платеж от клиента' }));
        return [...combinedExpenses, ...combinedPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [project.expenses, project.payments]);

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const finalAmount = parseFloat(String(newEntry.amount)) || 0;
        if (finalAmount <= 0) {
            addToast('Сумма должна быть больше нуля', 'error');
            setIsSaving(false);
            return;
        }

        try {
            if (entryType === 'expense') {
                let receiptDataUrl: string | undefined = undefined;
                if (receiptFile) {
                    receiptDataUrl = await fileToBase64(receiptFile);
                }
                const expenseWithId: Expense = { ...newEntry, amount: finalAmount, id: generateId(), receipt: receiptDataUrl };
                const updatedProjects = projects.map(p => p.id === project.id ? { ...p, expenses: [...p.expenses, expenseWithId] } : p);
                setProjects(updatedProjects);
                await api.saveData(userKey, 'projects', updatedProjects);
            } else {
                const paymentWithId: Payment = { id: generateId(), date: newEntry.date, amount: finalAmount };
                const updatedProjects = projects.map(p => p.id === project.id ? { ...p, payments: [...p.payments, paymentWithId] } : p);
                setProjects(updatedProjects);
                await api.saveData(userKey, 'projects', updatedProjects);
            }
            addToast('Операция добавлена', 'success');
            setShowModal(false);
            setNewEntry({ date: new Date().toISOString().split('T')[0], description: '', amount: '' });
            setReceiptFile(null);
        } catch (e) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteTransaction = async (id: string, type: 'expense' | 'payment') => {
        if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
        
        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    if (type === 'expense') {
                        return { ...p, expenses: p.expenses.filter(e => e.id !== id) };
                    } else { // type === 'payment'
                        return { ...p, payments: p.payments.filter(pay => pay.id !== id) };
                    }
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Запись удалена', 'success');
        } catch (e) {
            addToast('Не удалось удалить', 'error');
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReceiptFile(e.target.files[0]);
        }
    };
    
    const openReceiptPreview = (imageData: string) => {
        setReceiptPreview(imageData);
    };

    const closeReceiptPreview = () => {
        setReceiptPreview(null);
    };

    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>Финансы</h3>
                 <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Добавить</button>
            </div>

            {transactions.length === 0 ? (
                <div className="transaction-list-empty">Операций пока нет.</div>
            ) : (
                <div className="transaction-list">
                    {transactions.map((t, index) => (
                        <div key={t.id} className="transaction-item animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="transaction-details">
                                <span className="transaction-description">{t.description}</span>
                                <span className="transaction-date">{new Date(t.date).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <div className="d-flex align-center">
                                {t.type === 'expense' && t.receipt && (
                                    <img src={t.receipt} alt="Чек" className="receipt-image" onClick={() => openReceiptPreview(t.receipt!)} />
                                )}
                                <span className={`transaction-amount ${t.type}`}>
                                    {t.type === 'expense' ? '-' : '+'}
                                    {formatCurrency(t.amount)}
                                </span>
                                 <button className="action-btn" onClick={() => handleDeleteTransaction(t.id, t.type)} aria-label="Удалить"><DeleteIcon /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <Modal show={showModal} onClose={() => !isSaving && setShowModal(false)} title="Добавить операцию">
                 <div className="modal-toggle" style={{justifyContent: 'center', marginBottom: 'var(--space-6)'}}>
                    <button className={entryType === 'expense' ? 'active' : ''} onClick={() => setEntryType('expense')}>Расход</button>
                    <button className={entryType === 'payment' ? 'active' : ''} onClick={() => setEntryType('payment')}>Платеж</button>
                </div>
                <form onSubmit={handleAddEntry}>
                    <div className="form-group">
                        <label>Сумма</label>
                        <input type="number" step="0.01" value={newEntry.amount} placeholder="0" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({...newEntry, amount: e.target.value})} required disabled={isSaving}/>
                    </div>
                     <div className="form-group">
                        <label>Дата</label>
                        <input type="date" value={newEntry.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({...newEntry, date: e.target.value})} required disabled={isSaving}/>
                    </div>
                    {entryType === 'expense' && (
                        <>
                            <div className="form-group">
                                <label>Описание</label>
                                <input type="text" value={newEntry.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({...newEntry, description: e.target.value})} placeholder="Например, материалы с рынка" required disabled={isSaving}/>
                            </div>
                            <div className="form-group">
                                <label>Фото чека</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} disabled={isSaving}/>
                            </div>
                        </>
                    )}
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                           {isSaving ? <Loader /> : 'Добавить'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal show={!!receiptPreview} onClose={closeReceiptPreview} title="Просмотр чека">
                {receiptPreview && <img src={receiptPreview} alt="Чек" style={{width: '100%', borderRadius: 'var(--border-radius)'}} />}
            </Modal>
        </div>
    );
};

interface PhotoReportsProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const PhotoReports = ({ project, projects, setProjects, userKey }: PhotoReportsProps) => {
    const [showModal, setShowModal] = useState(false);
    const [newReport, setNewReport] = useState({ date: new Date().toISOString().split('T')[0], description: '' });
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const photoReports = project.photoReports || [];

    const openViewer = (index: number) => {
        setCurrentImageIndex(index);
        setIsViewerOpen(true);
    };

    const closeViewer = () => {
        setIsViewerOpen(false);
    };

    const handleAddReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportFile) {
            addToast('Пожалуйста, выберите файл', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const imageDataUrl = await fileToBase64(reportFile);
            const reportWithId: PhotoReport = {
                ...newReport,
                id: generateId(),
                image: imageDataUrl,
            };

            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    const existingReports = p.photoReports || [];
                    return { ...p, photoReports: [reportWithId, ...existingReports] };
                }
                return p;
            });

            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Фотоотчет добавлен', 'success');
            setShowModal(false);
            setNewReport({ date: new Date().toISOString().split('T')[0], description: '' });
            setReportFile(null);
        } catch (err) {
            addToast('Не удалось добавить фотоотчет', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот фотоотчет?')) return;

        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    const updatedReports = (p.photoReports || []).filter(r => r.id !== reportId);
                    return { ...p, photoReports: updatedReports };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Фотоотчет удален', 'success');
        } catch (err) {
            addToast('Не удалось удалить фотоотчет', 'error');
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReportFile(e.target.files[0]);
        }
    };

    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>Фотоотчеты</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Добавить фото</button>
            </div>
            {photoReports.length === 0 ? (
                <div className="transaction-list-empty">Фотоотчетов пока нет.</div>
            ) : (
                <div className="photo-reports-grid">
                    {photoReports.map((report, index) => (
                        <div key={report.id} className="photo-report-card" onClick={() => openViewer(index)}>
                            <img src={report.image} alt={report.description} />
                            <div className="photo-report-info">
                                <p>{report.description}</p>
                                <small>{new Date(report.date).toLocaleDateString('ru-RU')}</small>
                            </div>
                            <button className="photo-report-delete-btn action-btn" onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }} aria-label="Удалить фотоотчет">
                                <DeleteIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <Modal show={showModal} onClose={() => !isSaving && setShowModal(false)} title="Добавить фотоотчет">
                <form onSubmit={handleAddReport}>
                    <div className="form-group">
                        <label>Фотография</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} required disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label>Описание</label>
                        <input type="text" value={newReport.description} onChange={e => setNewReport({ ...newReport, description: e.target.value })} placeholder="Например, укладка плитки" required disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label>Дата</label>
                        <input type="date" value={newReport.date} onChange={e => setNewReport({ ...newReport, date: e.target.value })} required disabled={isSaving} />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                           {isSaving ? <Loader /> : 'Добавить'}
                        </button>
                    </div>
                </form>
            </Modal>
            <PhotoViewerModal
                show={isViewerOpen}
                onClose={closeViewer}
                images={photoReports}
                startIndex={currentImageIndex}
            />
        </div>
    );
};

interface ProjectScheduleProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const ProjectSchedule = ({ project, projects, setProjects, userKey }: ProjectScheduleProps) => {
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', startDate: '', endDate: '' });
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const schedule = project.schedule || [];

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.startDate || !newItem.endDate) {
            addToast('Заполните все поля', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const itemWithId: ProjectScheduleItem = { ...newItem, id: generateId(), completed: false };
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    const existingSchedule = p.schedule || [];
                    return { ...p, schedule: [...existingSchedule, itemWithId] };
                }
                return p;
            });

            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Этап добавлен в график', 'success');
            setShowModal(false);
            setNewItem({ name: '', startDate: '', endDate: '' });
        } catch (err) {
            addToast('Не удалось добавить этап', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm('Удалить этот этап?')) return;
        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, schedule: (p.schedule || []).filter(item => item.id !== itemId) };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Этап удален', 'success');
        } catch (err) {
            addToast('Не удалось удалить этап', 'error');
        }
    };

    const toggleItemCompletion = async (itemId: string) => {
         try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    const updatedSchedule = (p.schedule || []).map(item =>
                        item.id === itemId ? { ...item, completed: !item.completed } : item
                    );
                    return { ...p, schedule: updatedSchedule };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
        } catch (err) {
            addToast('Не удалось обновить статус', 'error');
        }
    };

    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>График работ</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Добавить этап</button>
            </div>
            {schedule.length === 0 ? (
                <div className="transaction-list-empty">Этапы работ пока не добавлены.</div>
            ) : (
                <div className="data-list">
                    {schedule.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(item => (
                        <div key={item.id} className={`data-item schedule-item ${item.completed ? 'completed' : ''}`}>
                             <div className="schedule-item-toggle">
                                <button className="action-btn" onClick={() => toggleItemCompletion(item.id)}>
                                    {item.completed ? <ReplayIcon /> : <CheckIcon />}
                                </button>
                            </div>
                            <div className="data-item-info">
                                <p><strong>{item.name}</strong></p>
                                <span className="data-item-subtext">
                                    {new Date(item.startDate).toLocaleDateString('ru-RU')} - {new Date(item.endDate).toLocaleDateString('ru-RU')}
                                </span>
                            </div>
                            <button className="action-btn" onClick={() => handleDeleteItem(item.id)} aria-label="Удалить этап">
                                <DeleteIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
             <Modal show={showModal} onClose={() => !isSaving && setShowModal(false)} title="Добавить этап работ">
                <form onSubmit={handleAddItem}>
                    <div className="form-group">
                        <label>Наименование этапа</label>
                        <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Например, Черновые работы" required disabled={isSaving} />
                    </div>
                     <div className="d-flex gap-1">
                        <div className="form-group w-100">
                            <label>Дата начала</label>
                            <input type="date" value={newItem.startDate} onChange={e => setNewItem({ ...newItem, startDate: e.target.value })} required disabled={isSaving} />
                        </div>
                        <div className="form-group w-100">
                            <label>Дата окончания</label>
                            <input type="date" value={newItem.endDate} onChange={e => setNewItem({ ...newItem, endDate: e.target.value })} required disabled={isSaving} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                           {isSaving ? <Loader /> : 'Добавить'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};


interface ProjectDocumentsProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const ProjectDocuments = ({ project, projects, setProjects, userKey }: ProjectDocumentsProps) => {
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '' });
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const documents = project.documents || [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDocumentFile(e.target.files[0]);
            if (!newItem.name) {
                setNewItem({ name: e.target.files[0].name.replace(/\.[^/.]+$/, "") });
            }
        }
    };
    
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!documentFile) {
            addToast('Выберите файл для загрузки', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const fileData = await fileToBase64(documentFile);
            const itemWithId: ProjectDocument = {
                id: generateId(),
                name: newItem.name.trim(),
                file: fileData,
                fileName: documentFile.name
            };
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, documents: [...(p.documents || []), itemWithId] };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Документ загружен', 'success');
            setShowModal(false);
            setNewItem({ name: '' });
            setDocumentFile(null);
        } catch (err) {
            addToast('Не удалось загрузить документ', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm('Удалить этот документ?')) return;
        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, documents: (p.documents || []).filter(item => item.id !== itemId) };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Документ удален', 'success');
        } catch (err) {
            addToast('Не удалось удалить документ', 'error');
        }
    };
    
    const handleDownload = (fileDataUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = fileDataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>Документы</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Загрузить</button>
            </div>
            {documents.length === 0 ? (
                <div className="transaction-list-empty">Документов пока нет.</div>
            ) : (
                <div className="data-list">
                    {documents.map(doc => (
                        <div key={doc.id} className="data-item">
                            <div className="data-item-info">
                                <a href="#" onClick={(e) => { e.preventDefault(); handleDownload(doc.file, doc.fileName); }}>
                                    {doc.name}
                                </a>
                            </div>
                            <button className="action-btn" onClick={() => handleDeleteItem(doc.id)} aria-label="Удалить документ">
                                <DeleteIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
             <Modal show={showModal} onClose={() => !isSaving && setShowModal(false)} title="Загрузить документ">
                <form onSubmit={handleAddItem}>
                    <div className="form-group">
                        <label>Файл</label>
                        <input type="file" onChange={handleFileChange} required disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label>Название документа</label>
                        <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Например, Договор" required disabled={isSaving} />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                           {isSaving ? <Loader /> : 'Загрузить'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

interface ProjectNotesProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const ProjectNotes = ({ project, projects, setProjects, userKey }: ProjectNotesProps) => {
    const [newNote, setNewNote] = useState('');
    const { addToast } = useToasts();
    
    const notes = project.notes || [];

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            const noteWithId: ProjectNote = {
                id: generateId(),
                text: newNote.trim(),
                createdAt: new Date().toISOString()
            };
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, notes: [...(p.notes || []), noteWithId] };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            setNewNote('');
        } catch (err) {
            addToast('Не удалось добавить заметку', 'error');
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!window.confirm('Удалить эту заметку?')) return;
        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, notes: (p.notes || []).filter(note => note.id !== noteId) };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Заметка удалена', 'success');
        } catch (err) {
            addToast('Не удалось удалить заметку', 'error');
        }
    };

    return (
        <div className="card">
            <h3>Заметки по объекту</h3>
            {notes.length === 0 ? (
                <div className="transaction-list-empty">Заметок пока нет.</div>
            ) : (
                <div className="data-list">
                    {notes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                        <div key={note.id} className="data-item">
                            <div className="data-item-info">
                                <p>{note.text}</p>
                                <span className="data-item-subtext">{new Date(note.createdAt).toLocaleString('ru-RU')}</span>
                            </div>
                            <button className="action-btn" onClick={() => handleDeleteNote(note.id)} aria-label="Удалить заметку">
                                <DeleteIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <form onSubmit={handleAddNote} className="add-note-form">
                <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Новая заметка..."
                />
                <button type="submit" className="btn btn-primary btn-sm">Добавить</button>
            </form>
        </div>
    );
};

// --- VIEWS ---

interface ProjectDetailsViewProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    onBack: () => void;
    userKey: string;
    directory: DirectoryItem[];
    setDirectory: React.Dispatch<React.SetStateAction<DirectoryItem[]>>;
    templates: EstimateTemplate[];
    onSaveTemplate: (template: EstimateTemplate) => Promise<void>;
    onDeleteTemplate: (templateId: string) => Promise<void>;
}
const ProjectDetailsView = ({ project, projects, setProjects, onBack, userKey, directory, setDirectory, templates, onSaveTemplate, onDeleteTemplate }: ProjectDetailsViewProps) => {
    const { addToast } = useToasts();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showActModal, setShowActModal] = useState(false);
    const [actContent, setActContent] = useState('');
    const [isActGenerating, setIsActGenerating] = useState(false);

    const handleUpdateProject = async (updatedProject: Project) => {
        try {
            const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
        } catch (e) {
            addToast('Ошибка при сохранении проекта', 'error');
        }
    };
    
    const handleDeleteProject = async () => {
        if (window.confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
            try {
                const updatedProjects = projects.filter(p => p.id !== project.id);
                setProjects(updatedProjects);
                await api.saveData(userKey, 'projects', updatedProjects);
                addToast('Проект удален', 'success');
                onBack();
            } catch (e) {
                addToast('Ошибка при удалении проекта', 'error');
            }
        }
    };

    const handleUpdateEstimate = async (updatedEstimate: Estimate) => {
        const updatedEstimates = project.estimates.map(e => e.id === updatedEstimate.id ? updatedEstimate : e);
        await handleUpdateProject({ ...project, estimates: updatedEstimates });
    };
    
    const handleAddEstimate = async () => {
        const newEstimate: Estimate = {
            id: generateId(),
            name: `Новая смета №${project.estimates.length + 1}`,
            items: [],
        };
        await handleUpdateProject({ ...project, estimates: [...project.estimates, newEstimate] });
        addToast('Новая смета добавлена', 'success');
    };

    const handleDeleteEstimate = async (estimateId: string) => {
        if (project.estimates.length <= 1) {
            addToast('Нельзя удалить последнюю смету', 'error');
            return;
        }
        if (window.confirm('Вы уверены, что хотите удалить эту смету?')) {
            const updatedEstimates = project.estimates.filter(e => e.id !== estimateId);
            await handleUpdateProject({ ...project, estimates: updatedEstimates });
            addToast('Смета удалена', 'success');
        }
    };

    const generateAct = async () => {
        if (!process.env.API_KEY) {
            setActContent("Ошибка: API_KEY не настроен. Пожалуйста, установите его в переменных окружения.");
            setShowActModal(true);
            return;
        }
        setIsActGenerating(true);
        setShowActModal(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const totalAmount = project.estimates.reduce((projectSum, estimate) => {
                const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
                const discountAmount = estimate.discount ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value) : 0;
                return projectSum + (subtotal - discountAmount);
            }, 0);

            const prompt = `
                Сгенерируй формальный "Акт сдачи-приемки выполненных работ" в текстовом формате (не JSON).
                Используй следующие данные:
                - Исполнитель: ${project.contractor?.companyName || project.contractor?.contactName || 'Исполнитель'}
                - Заказчик: ${project.client.name}
                - Объект: "${project.name}" по адресу ${project.address}
                - Общая сумма работ по смете: ${formatCurrency(totalAmount)}
                - Дата завершения работ: ${new Date(project.completedAt!).toLocaleDateString('ru-RU')}

                Текст должен быть строгим, официальным и содержать стандартные формулировки о том, что работы выполнены в полном объеме, в надлежащем качестве и в установленные сроки, а заказчик не имеет претензий.
                В конце акта оставь поля для подписей "_________________ (Исполнитель)" и "_________________ (Заказчик)".
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            setActContent(response.text);

        } catch (error) {
            console.error(error);
            setActContent("Произошла ошибка при генерации акта. Проверьте консоль для получения дополнительной информации.");
        } finally {
            setIsActGenerating(false);
        }
    };
    
    return (
        <>
            <button className="back-button" onClick={onBack}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/></svg>
                Все проекты
            </button>
            <div className="project-details-header">
                <div className="d-flex justify-between align-start">
                    <div>
                        <h2>{project.name}</h2>
                        <p>{project.address}</p>
                        <p><strong>Клиент:</strong> {project.client.name}, {project.client.phone}</p>
                    </div>
                    <div className="project-header-actions">
                        {project.status === 'Завершен' && (
                            <button className="action-btn" onClick={generateAct} aria-label="Сгенерировать акт"><DocumentIcon /></button>
                        )}
                        <button className="action-btn" onClick={() => setShowEditModal(true)} aria-label="Редактировать проект"><EditIcon /></button>
                        <button className="action-btn" onClick={handleDeleteProject} aria-label="Удалить проект"><DeleteIcon /></button>
                    </div>
                </div>
            </div>

            <FinancialDashboard project={project} />

            <div className="estimates-container">
                {project.estimates.map(estimate => (
                     <EstimateEditor 
                        key={estimate.id}
                        estimate={estimate} 
                        projectId={project.id}
                        onUpdate={handleUpdateEstimate} 
                        onDelete={handleDeleteEstimate}
                        directory={directory}
                        setDirectory={setDirectory}
                        userKey={userKey}
                        templates={templates}
                        onSaveTemplate={onSaveTemplate}
                        onDeleteTemplate={onDeleteTemplate}
                    />
                ))}
            </div>
             <div style={{textAlign: 'center', marginTop: 'var(--space-6)'}}>
                 <button className="btn btn-secondary" onClick={handleAddEstimate}>+ Добавить смету</button>
             </div>

            <ExpenseTracker project={project} projects={projects} setProjects={setProjects} userKey={userKey} />
            <PhotoReports project={project} projects={projects} setProjects={setProjects} userKey={userKey} />
            <ProjectSchedule project={project} projects={projects} setProjects={setProjects} userKey={userKey} />
            <ProjectDocuments project={project} projects={projects} setProjects={setProjects} userKey={userKey} />
            <ProjectNotes project={project} projects={projects} setProjects={setProjects} userKey={userKey} />

            <ProjectFormModal 
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleUpdateProject}
                existingProject={project}
            />
            <Modal show={showActModal} onClose={() => setShowActModal(false)} title="Акт сдачи-приемки работ">
                {isActGenerating ? <Loader /> : (
                    <>
                        <textarea className="act-textarea" value={actContent} readOnly />
                        <div className="form-actions">
                             <button className="btn btn-secondary" onClick={() => setShowActModal(false)}>Закрыть</button>
                             <button className="btn btn-primary" onClick={() => navigator.clipboard.writeText(actContent).then(() => addToast('Акт скопирован', 'success'))}>Скопировать</button>
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
};

interface ProjectFormModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (project: Project) => Promise<void>;
    existingProject?: Project;
}
const ProjectFormModal = ({ show, onClose, onSave, existingProject }: ProjectFormModalProps) => {
    const [projectData, setProjectData] = useState({
        name: '', address: '', status: 'В работе' as 'В работе' | 'Завершен',
        clientName: '', clientPhone: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    useEffect(() => {
        if (show && existingProject) {
            setProjectData({
                name: existingProject.name,
                address: existingProject.address,
                status: existingProject.status,
                clientName: existingProject.client.name,
                clientPhone: existingProject.client.phone
            });
        } else if (show) {
            setProjectData({ name: '', address: '', status: 'В работе', clientName: '', clientPhone: '' });
        }
    }, [show, existingProject]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const projectToSave: Project = {
                ...(existingProject || {
                    id: generateId(), estimates: [{ id: generateId(), name: 'Основная смета', items: [] }],
                    expenses: [], payments: [], createdAt: new Date().toISOString()
                }),
                name: projectData.name,
                address: projectData.address,
                status: projectData.status,
                client: { name: projectData.clientName, phone: projectData.clientPhone },
                completedAt: projectData.status === 'Завершен' && !existingProject?.completedAt ? new Date().toISOString() : existingProject?.completedAt,
            };
            await onSave(projectToSave);
            addToast(existingProject ? 'Проект обновлен' : 'Проект создан', 'success');
            onClose();
        } catch (e) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProjectData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal show={show} onClose={() => !isSaving && onClose()} title={existingProject ? 'Редактировать проект' : 'Новый проект'}>
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label>Название объекта</label>
                    <input type="text" name="name" value={projectData.name} onChange={handleChange} required disabled={isSaving}/>
                </div>
                <div className="form-group">
                    <label>Адрес</label>
                    <input type="text" name="address" value={projectData.address} onChange={handleChange} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Имя клиента</label>
                    <input type="text" name="clientName" value={projectData.clientName} onChange={handleChange} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Телефон клиента</label>
                    <input type="tel" name="clientPhone" value={projectData.clientPhone} onChange={handleChange} required disabled={isSaving}/>
                </div>
                <div className="form-group">
                    <label>Статус</label>
                    <select name="status" value={projectData.status} onChange={handleChange} required disabled={isSaving}>
                        <option>В работе</option>
                        <option>Завершен</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Отмена</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader /> : 'Сохранить'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface ReportsViewProps {
    projects: Project[];
}
const ReportsView = ({ projects }: ReportsViewProps) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const completedDate = p.completedAt;
            return p.status === 'Завершен' && completedDate && completedDate >= startDate && completedDate <= endDate + 'T23:59:59';
        });
    }, [projects, startDate, endDate]);

    const reportData = useMemo(() => {
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalProfit = 0;

        filteredProjects.forEach(project => {
            const estimateTotal = project.estimates.reduce((projectSum, estimate) => {
                const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
                const discountAmount = estimate.discount ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value) : 0;
                return projectSum + (subtotal - discountAmount);
            }, 0);
            
            const workTotal = project.estimates.flatMap(e => e.items)
                .filter(item => item.type === 'Работа')
                .reduce((sum, item) => sum + item.quantity * item.price, 0);
            
            const expensesTotal = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);

            totalRevenue += estimateTotal;
            totalExpenses += expensesTotal;
            totalProfit += (workTotal - expensesTotal);
        });

        return {
            totalRevenue,
            totalExpenses,
            totalProfit,
            completedProjectsCount: filteredProjects.length,
            averageProfit: filteredProjects.length > 0 ? totalProfit / filteredProjects.length : 0,
        };
    }, [filteredProjects]);

    const handleExportCSV = () => {
        if (filteredProjects.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel
        csvContent += "Проект,Клиент,Дата завершения,Сумма сметы,Расходы,Прибыль\n";

        filteredProjects.forEach(p => {
            const estimateTotal = p.estimates.reduce((sum, est) => sum + est.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
            const expensesTotal = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const workTotal = p.estimates.flatMap(e => e.items).filter(i => i.type === 'Работа').reduce((sum, i) => sum + i.price * i.quantity, 0);
            const profit = workTotal - expensesTotal;
            
            const row = [
                `"${p.name.replace(/"/g, '""')}"`,
                `"${p.client.name.replace(/"/g, '""')}"`,
                new Date(p.completedAt!).toLocaleDateString('ru-RU'),
                estimateTotal,
                expensesTotal,
                profit
            ].join(',');
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="reports-header">
                <h3>Сводный отчет</h3>
                <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} disabled={filteredProjects.length === 0}>
                    Скачать отчет (CSV)
                </button>
            </div>
            
            <div className="card date-filter-container">
                 <div className="d-flex gap-1 align-center">
                    <div className="form-group w-100">
                        <label>Начало периода</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                     <span>&mdash;</span>
                    <div className="form-group w-100">
                        <label>Конец периода</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                 </div>
            </div>

            <div className="reports-grid">
                <div className="report-card">
                    <div className="report-card-label">Общая выручка</div>
                    <div className="report-card-value">{formatCurrency(reportData.totalRevenue)}</div>
                </div>
                <div className="report-card">
                    <div className="report-card-label">Общие расходы</div>
                    <div className="report-card-value">{formatCurrency(reportData.totalExpenses)}</div>
                </div>
                <div className="report-card">
                    <div className="report-card-label">Чистая прибыль</div>
                    <div className={`report-card-value ${reportData.totalProfit >= 0 ? 'profit' : 'loss'}`}>
                        {formatCurrency(reportData.totalProfit)}
                    </div>
                </div>
            </div>

            <div className="reports-grid small" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
                 <div className="report-card small">
                    <div className="report-card-label">Завершено проектов</div>
                    <div className="report-card-value">{reportData.completedProjectsCount}</div>
                </div>
                 <div className="report-card small">
                    <div className="report-card-label">Средняя прибыль</div>
                    <div className="report-card-value">{formatCurrency(reportData.averageProfit)}</div>
                </div>
            </div>
            
             <div className="card">
                <h3>Детализация по проектам</h3>
                <div className="table-container">
                    <table className="profit-table">
                        <thead>
                            <tr>
                                <th>Проект</th>
                                <th className="align-right">Сумма</th>
                                <th className="align-right">Прибыль</th>
                            </tr>
                        </thead>
                        <tbody>
                             {filteredProjects.length === 0 ? (
                                <tr><td colSpan={3} style={{textAlign: 'center', padding: '1rem'}}>Нет завершенных проектов за выбранный период.</td></tr>
                            ) : (
                                filteredProjects.map(p => {
                                    const estimateTotal = p.estimates.reduce((sum, est) => {
                                        const subtotal = est.items.reduce((s, i) => s + i.price * i.quantity, 0);
                                        const discount = est.discount ? (est.discount.type === 'percent' ? subtotal * (est.discount.value / 100) : est.discount.value) : 0;
                                        return sum + (subtotal - discount);
                                    }, 0);
                                    const expensesTotal = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                                    const workTotal = p.estimates.flatMap(e => e.items).filter(i => i.type === 'Работа').reduce((sum, i) => sum + i.price * i.quantity, 0);
                                    const profit = workTotal - expensesTotal;

                                    return (
                                        <tr key={p.id}>
                                            <td>
                                                <strong>{p.name}</strong><br/>
                                                <small>{p.client.name}</small>
                                            </td>
                                            <td className="align-right">{formatCurrency(estimateTotal)}</td>
                                            <td className={`align-right ${profit >= 0 ? 'profit' : 'loss'}`}>{formatCurrency(profit)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </>
    );
};

// --- MAIN APP ---

const App = () => {
    const [user, setUser] = useLocalStorage<User | null>('prorab_user', null);
    const userKey = useMemo(() => user?.email || 'guest', [user]);

    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [directory, setDirectory] = useState<DirectoryItem[]>([]);
    const [profile, setProfile] = useState<UserProfile>({ companyName: '', contactName: '', phone: '', logo: '' });
    const [templates, setTemplates] = useState<EstimateTemplate[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [inventoryNotes, setInventoryNotes] = useState<ProjectNote[]>([]);

    const [currentView, setCurrentView] = useState<ViewState>({ view: 'projects' });
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showDirectoryModal, setShowDirectoryModal] = useState(false);
    const [editingDirectoryItem, setEditingDirectoryItem] = useState<DirectoryItem | null>(null);
    const [newDirectoryItemData, setNewDirectoryItemData] = useState<Omit<DirectoryItem, 'id'>>({ name: '', type: 'Работа', unit: 'шт', price: 0 });
    const [isDirectorySaving, setIsDirectorySaving] = useState(false);
    const [directorySearchTerm, setDirectorySearchTerm] = useState('');

    const { addToast } = useToasts();
    
    useEffect(() => {
        const loadInitialData = async () => {
            if (userKey !== 'guest') {
                try {
                    const data = await api.getData(userKey);
                    setProjects(data.projects);
                    setDirectory(data.directory);
                    setProfile(data.profile);
                    setTemplates(data.templates);
                    setInventory(data.inventory);
                    setInventoryNotes(data.inventoryNotes);
                } catch (error) {
                    addToast('Не удалось загрузить данные', 'error');
                }
            }
            setLoading(false);
        };
        loadInitialData();
    }, [userKey, addToast]);
    
    const handleSaveProject = async (project: Project) => {
        const updatedProjects = projects.find(p => p.id === project.id)
            ? projects.map(p => p.id === project.id ? project : p)
            : [project, ...projects];
        
        setProjects(updatedProjects);
        await api.saveData(userKey, 'projects', updatedProjects);
    };

    const handleSaveProfile = async (updatedProfile: UserProfile) => {
        setProfile(updatedProfile);
        await api.saveData(userKey, 'profile', updatedProfile);
    };
    
    const handleSaveTemplate = async (template: EstimateTemplate) => {
        try {
            const updatedTemplates = [...templates, template];
            setTemplates(updatedTemplates);
            await api.saveData(userKey, 'templates', updatedTemplates);
            addToast('Шаблон сохранен!', 'success');
        } catch (e) {
            addToast('Не удалось сохранить шаблон', 'error');
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот шаблон?')) return;
        try {
            const updatedTemplates = templates.filter(t => t.id !== templateId);
            setTemplates(updatedTemplates);
            await api.saveData(userKey, 'templates', updatedTemplates);
            addToast('Шаблон удален', 'success');
        } catch (e) {
            addToast('Не удалось удалить шаблон', 'error');
        }
    };
    
    const openDirectoryEditModal = (item: DirectoryItem) => {
        setEditingDirectoryItem(item);
        setNewDirectoryItemData(item);
        setShowDirectoryModal(true);
    };

    const handleDeleteDirectoryItem = async (itemId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту позицию из справочника?')) {
            try {
                const updatedDirectory = directory.filter(item => item.id !== itemId);
                setDirectory(updatedDirectory);
                await api.saveData(userKey, 'directory', updatedDirectory);
                addToast('Позиция удалена из справочника', 'success');
            } catch (e) {
                addToast('Не удалось удалить позицию', 'error');
            }
        }
    };

    const handleSaveDirectoryItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDirectorySaving(true);
        const trimmedName = newDirectoryItemData.name.trim();
        if (!trimmedName) {
            addToast('Название не может быть пустым', 'error');
            setIsDirectorySaving(false);
            return;
        }

        try {
            let updatedDirectory;
            if (editingDirectoryItem) {
                updatedDirectory = directory.map(item => item.id === editingDirectoryItem.id ? { ...item, ...newDirectoryItemData, name: trimmedName } : item);
            } else {
                // This case is not used as we don't have a dedicated "add to directory" button
                // It's populated from estimates, but this logic is here for completeness.
                const newItem: DirectoryItem = { ...newDirectoryItemData, name: trimmedName, id: generateId() };
                updatedDirectory = [...directory, newItem];
            }
            setDirectory(updatedDirectory);
            await api.saveData(userKey, 'directory', updatedDirectory);
            addToast('Справочник обновлен', 'success');
            setShowDirectoryModal(false);
        } catch (e) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsDirectorySaving(false);
        }
    };
    
    if (loading) {
        return <Loader fullScreen />;
    }

    if (!user) {
        return <AuthScreen onLogin={setUser} />;
    }
    
    if (currentView.view === 'project_details') {
        const project = projects.find(p => p.id === currentView.projectId);
        if (!project) {
            // Fallback if project not found
            setCurrentView({ view: 'projects' });
            return null;
        }
        return (
             <main className="app-container">
                <ProjectDetailsView 
                    project={project}
                    projects={projects}
                    setProjects={setProjects}
                    onBack={() => setCurrentView({ view: 'projects' })}
                    userKey={userKey}
                    directory={directory}
                    setDirectory={setDirectory}
                    templates={templates}
                    onSaveTemplate={handleSaveTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                />
            </main>
        );
    }
    
    const renderContent = () => {
        if (currentView.view === 'projects') {
            return <ProjectListView projects={projects} setProjects={setProjects} onSelectProject={(id) => setCurrentView({ view: 'project_details', projectId: id })} onShowNewProjectModal={() => setShowProjectModal(true)} />;
        }
        if (currentView.view === 'reports') {
            return <ReportsView projects={projects} />;
        }
        if (currentView.view === 'directory') {
             const filteredDirectory = useMemo(() => {
                const sortedDirectory = [...directory].sort((a, b) => a.name.localeCompare(b.name));
                if (!directorySearchTerm.trim()) {
                    return sortedDirectory;
                }
                return sortedDirectory.filter(item =>
                    item.name.toLowerCase().includes(directorySearchTerm.toLowerCase())
                );
            }, [directory, directorySearchTerm]);

            return (
                 <div className="card">
                    <h3>Справочник</h3>
                    <p className="field-hint">Здесь хранятся все работы и материалы, которые вы добавляли в сметы. Вы можете управлять ими централизованно.</p>
                    
                    <div className="search-container">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Поиск по названию..."
                            className="search-input"
                            value={directorySearchTerm}
                            onChange={e => setDirectorySearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Наименование</th>
                                    <th>Тип</th>
                                    <th className="align-right">Цена</th>
                                    <th className="align-right">Ед. изм.</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDirectory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                                            {directorySearchTerm ? 'Ничего не найдено' : 'Справочник пока пуст.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDirectory.map((item, index) => (
                                        <tr key={item.id} className="animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                            <td><strong>{item.name}</strong></td>
                                            <td>{item.type}</td>
                                            <td className="align-right">{formatCurrency(item.price)}</td>
                                            <td className="align-right">{item.unit}</td>
                                            <td className="align-right">
                                                <div className="item-actions">
                                                    <button className="action-btn" onClick={() => openDirectoryEditModal(item)} aria-label="Редактировать"><EditIcon /></button>
                                                    <button className="action-btn" onClick={() => handleDeleteDirectoryItem(item.id)} aria-label="Удалить"><DeleteIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
        if (currentView.view === 'inventory') {
            return <InventoryView inventory={inventory} setInventory={setInventory} notes={inventoryNotes} setNotes={setInventoryNotes} projects={projects} userKey={userKey} />;
        }
        if (currentView.view === 'settings') {
            return <SettingsView profile={profile} onSave={handleSaveProfile} onLogout={() => setUser(null)} />;
        }
        return null;
    };


    return (
        <>
            <Header user={user} onNavigate={setCurrentView} onLogout={() => setUser(null)} />
            <main className="app-container">
                {renderContent()}
            </main>
            <BottomNav currentView={currentView.view} onNavigate={setCurrentView} />
            <ProjectFormModal 
                show={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                onSave={handleSaveProject}
            />
            <Modal show={showDirectoryModal} onClose={() => setShowDirectoryModal(false)} title="Редактировать справочник">
                <form onSubmit={handleSaveDirectoryItem}>
                    <div className="form-group">
                        <label>Наименование</label>
                        <input type="text" value={newDirectoryItemData.name} onChange={e => setNewDirectoryItemData(p => ({...p, name: e.target.value}))} required disabled={isDirectorySaving} />
                    </div>
                     <div className="form-group">
                        <label>Тип</label>
                        <select value={newDirectoryItemData.type} onChange={e => setNewDirectoryItemData(p => ({...p, type: e.target.value as 'Работа' | 'Материал'}))} disabled={isDirectorySaving}>
                            <option>Работа</option>
                            <option>Материал</option>
                        </select>
                    </div>
                    <div className="d-flex gap-1">
                        <div className="form-group w-100">
                           <label>Цена</label>
                           <input type="number" step="0.01" value={newDirectoryItemData.price} onChange={e => setNewDirectoryItemData(p => ({...p, price: parseFloat(e.target.value) || 0}))} required disabled={isDirectorySaving}/>
                        </div>
                        <div className="form-group w-100">
                           <label>Ед. изм.</label>
                           <input type="text" value={newDirectoryItemData.unit} onChange={e => setNewDirectoryItemData(p => ({...p, unit: e.target.value}))} required disabled={isDirectorySaving}/>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowDirectoryModal(false)} disabled={isDirectorySaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isDirectorySaving}>
                            {isDirectorySaving ? <Loader /> : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

// --- AUTH SCREEN ---
const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = isLogin ? await api.login(email, password) : await api.register(email, password);
            onLogin(user);
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <LogoIcon size={48} />
                    <h1>{isLogin ? 'Вход в Прораб' : 'Регистрация'}</h1>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    <div className="form-group form-group-icon">
                        <EmailIcon />
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group form-group-icon">
                        <LockIcon />
                        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-large w-100" disabled={loading}>
                        {loading ? <Loader /> : (isLogin ? 'Войти' : 'Создать аккаунт')}
                    </button>
                    <div style={{textAlign: 'center', marginTop: 'var(--space-6)'}}>
                        <button type="button" className="link-button" onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'У меня еще нет аккаунта' : 'Уже есть аккаунт? Войти'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- PUBLIC ESTIMATE VIEW ---
const PublicEstimateView = () => {
    const [project, setProject] = useState<Project | null>(null);
    const [estimate, setEstimate] = useState<Estimate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { addToast } = useToasts();
    
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentingItem, setCommentingItem] = useState<EstimateItem | null>(null);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const projectId = params.get('projectId');
        const estimateId = params.get('estimateId');

        if (!projectId || !estimateId) {
            setError('Неверная ссылка на смету.');
            setLoading(false);
            return;
        }

        const allProjects = JSON.parse(localStorage.getItem('prorab_projects_all') || '[]');
        const foundProject = allProjects.find((p: Project) => p.id === projectId);
        const foundEstimate = foundProject?.estimates.find((e: Estimate) => e.id === estimateId);


        if (foundProject && foundEstimate) {
            setProject(foundProject);
            setEstimate(foundEstimate);
        } else {
            setError('Смета не найдена. Возможно, она была удалена.');
        }
        setLoading(false);
    }, []);

    const handleApprove = () => {
        if (!project || !estimate || estimate.approvedOn) return;
        if (window.confirm('Вы уверены, что хотите согласовать эту смету? Это действие нельзя будет отменить.')) {
            const allProjects = JSON.parse(localStorage.getItem('prorab_projects_all') || '[]');
            const updatedProjects = allProjects.map((p: Project) => {
                if (p.id === project.id) {
                    const updatedEstimates = p.estimates.map(e => e.id === estimate.id ? {...e, approvedOn: new Date().toISOString()} : e);
                    return {...p, estimates: updatedEstimates};
                }
                return p;
            });
            localStorage.setItem('prorab_projects_all', JSON.stringify(updatedProjects));
            
            // Also update the specific user's project data
            const userKey = project.contractor?.contactName; // This is a bit of a hack
            if (userKey) {
                const userProjects = JSON.parse(localStorage.getItem(`prorab_projects_${userKey}`) || '[]');
                const updatedUserProjects = userProjects.map((p: Project) => {
                    if (p.id === project.id) {
                        const updatedEstimates = p.estimates.map(e => e.id === estimate.id ? {...e, approvedOn: new Date().toISOString()} : e);
                        return {...p, estimates: updatedEstimates};
                    }
                    return p;
                });
                localStorage.setItem(`prorab_projects_${userKey}`, JSON.stringify(updatedUserProjects));
            }

            setEstimate(prev => prev ? {...prev, approvedOn: new Date().toISOString()} : null);
            addToast('Смета успешно согласована!', 'success');
        }
    };

    const handleAddComment = (itemId: string, commentText: string) => {
        if (!project || !estimate) return;

        const newComment: Comment = {
            id: generateId(),
            author: 'Клиент',
            text: commentText,
            timestamp: new Date().toISOString()
        };

        const updatedEstimate = {
            ...estimate,
            items: estimate.items.map(item =>
                item.id === itemId ? { ...item, comments: [...(item.comments || []), newComment] } : item
            )
        };
        setEstimate(updatedEstimate);
        
        // This is tricky without a backend. We'll update the public store.
        const allProjects = JSON.parse(localStorage.getItem('prorab_projects_all') || '[]');
        const updatedProjects = allProjects.map((p: Project) => {
            if (p.id === project.id) {
                return { ...p, estimates: p.estimates.map(e => e.id === estimate.id ? updatedEstimate : e) };
            }
            return p;
        });
        localStorage.setItem('prorab_projects_all', JSON.stringify(updatedProjects));
    };

    if (loading) return <Loader fullScreen />;
    if (error) return <div className="app-container"><div className="auth-error">{error}</div></div>;
    if (!project || !estimate) return null;

    const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const discountAmount = estimate.discount ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value) : 0;
    const total = subtotal - discountAmount;
    
    return (
        <div className="public-estimate-container">
            <div className="public-header">
                <a href={window.location.origin + window.location.pathname} className="header-logo" aria-label="На главную">
                    <LogoIcon />
                    <span>Прораб</span>
                </a>
                <button className="btn btn-secondary btn-sm print-button" onClick={() => window.print()}>
                    <PrintIcon /> Печать / PDF
                </button>
            </div>
            
            <div className="card contractor-card">
                {project.contractor?.logo ? (
                     <img src={project.contractor.logo} alt="Логотип исполнителя" className="contractor-logo" />
                ) : (
                    <div className="logo-placeholder"><ImageIcon /></div>
                )}
                <div className="contractor-info">
                    <strong>{project.contractor?.companyName || project.contractor?.contactName}</strong>
                    <p>{project.contractor?.phone}</p>
                </div>
            </div>

            <div className="card">
                <div className="project-details-header">
                    <h2>Смета: {estimate.name}</h2>
                    <p><strong>Объект:</strong> {project.name}, {project.address}</p>
                    <p><strong>Заказчик:</strong> {project.client.name}, {project.client.phone}</p>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Позиция</th>
                                <th className="align-right">Кол-во</th>
                                <th className="align-right">Цена</th>
                                <th className="align-right">Итог</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {estimate.items.map(item => (
                                <tr key={item.id}>
                                    <td><strong>{item.name}</strong><br/><small>{item.type}</small></td>
                                    <td className="align-right">{item.quantity} {item.unit}</td>
                                    <td className="align-right">{formatCurrency(item.price)}</td>
                                    <td className="align-right">{formatCurrency(item.quantity * item.price)}</td>
                                    <td className="align-right">
                                        <button className="action-btn comment-btn" onClick={() => { setCommentingItem(item); setShowCommentModal(true); }}>
                                            <CommentIcon />
                                            {(item.comments?.length || 0) > 0 && <span className="comment-badge">{item.comments.length}</span>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="estimate-summary-container">
                    <div />
                    <div className="estimate-totals">
                        <div className="total-row"><span>Подытог</span><span>{formatCurrency(subtotal)}</span></div>
                        {discountAmount > 0 && (
                            <div className="total-row discount-row">
                                <span>Скидка</span>
                                <span>- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <div className="total-row grand-total"><span>Итого</span><span>{formatCurrency(total)}</span></div>
                    </div>
                </div>
            </div>
            
            {(project.photoReports || []).length > 0 && (
                <div className="card">
                    <h3>Фотоотчеты</h3>
                    <div className="photo-reports-grid public-view">
                         {(project.photoReports || []).map(report => (
                            <div key={report.id} className="photo-report-card-public">
                                <img src={report.image} alt={report.description} />
                                <div className="photo-report-info-public">
                                    <p>{report.description}</p>
                                    <small>{new Date(report.date).toLocaleDateString('ru-RU')}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="approval-section">
                {estimate.approvedOn ? (
                    <div className="approval-status approved">
                        <CheckIcon/>
                        <div>
                            <strong>Смета согласована</strong>
                            <p>Заказчик утвердил эту смету {new Date(estimate.approvedOn).toLocaleString('ru-RU')}.</p>
                        </div>
                    </div>
                ) : (
                     <>
                        <p>Пожалуйста, внимательно ознакомьтесь со сметой. Если у вас есть вопросы, свяжитесь с исполнителем. Если все верно, нажмите кнопку "Согласовать смету".</p>
                        <button className="btn btn-primary btn-large" onClick={handleApprove}>Согласовать смету</button>
                    </>
                )}
            </div>

            <footer className="public-footer">
                <p>
                    Смета сформирована в&nbsp;
                    <a href={window.location.origin + window.location.pathname} className="footer-logo-link" target="_blank" rel="noopener noreferrer">
                        <LogoIcon size={16}/> Прораб
                    </a>
                </p>
            </footer>
             <CommentModal
                show={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                item={commentingItem}
                onAddComment={handleAddComment}
            />
        </div>
    );
};

const Header = ({ user, onNavigate, onLogout }: { user: User | null, onNavigate: (view: ViewState) => void, onLogout: () => void }) => {
    return (
        <header>
            <div className="header-content">
                 <a href="#" onClick={(e) => { e.preventDefault(); onNavigate({ view: 'projects' }); }} className="header-logo" aria-label="На главную">
                    <LogoIcon />
                    <span>Прораб</span>
                </a>
                <div className="header-actions">
                     <button className="settings-btn" onClick={() => onNavigate({ view: 'reports' })} aria-label="Отчеты"><ReportsIcon /></button>
                     <button className="settings-btn" onClick={() => onNavigate({ view: 'directory' })} aria-label="Справочник"><DirectoryIcon /></button>
                     <button className="settings-btn" onClick={() => onNavigate({ view: 'inventory' })} aria-label="Инвентарь"><ToolIcon /></button>
                     <button className="settings-btn" onClick={() => onNavigate({ view: 'settings' })} aria-label="Настройки"><SettingsIcon /></button>
                     <button className="settings-btn" onClick={onLogout} aria-label="Выход"><LogoutIcon /></button>
                </div>
            </div>
        </header>
    );
};

const BottomNav = ({ currentView, onNavigate }: { currentView: ViewState['view'], onNavigate: (view: ViewState) => void }) => {
    const navItems = [
        { view: 'projects' as const, label: 'Проекты', icon: <ProjectsIcon /> },
        { view: 'reports' as const, label: 'Отчеты', icon: <ReportsIcon /> },
        { view: 'directory' as const, label: 'Справочник', icon: <DirectoryIcon /> },
        { view: 'inventory' as const, label: 'Инвентарь', icon: <ToolIcon /> },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map(item => (
                <button
                    key={item.view}
                    className={`bottom-nav-btn ${currentView === item.view ? 'active' : ''}`}
                    onClick={() => onNavigate({ view: item.view })}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

const ProjectListView = ({ projects, onSelectProject, onShowNewProjectModal }: { projects: Project[], setProjects: React.Dispatch<React.SetStateAction<Project[]>>, onSelectProject: (projectId: string) => void, onShowNewProjectModal: () => void }) => {
    const [filter, setFilter] = useState<'В работе' | 'Завершен'>('В работе');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => p.status === filter)
            .filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.client.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [projects, filter, searchTerm]);

    return (
        <>
            <div className="d-flex justify-between align-center mb-1">
                <div className="filter-toggle">
                    <button className={filter === 'В работе' ? 'active' : ''} onClick={() => setFilter('В работе')}>В работе</button>
                    <button className={filter === 'Завершен' ? 'active' : ''} onClick={() => setFilter('Завершен')}>Завершен</button>
                </div>
            </div>
            
            <div className="search-container">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Поиск по названию, адресу, клиенту..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredProjects.length > 0 ? (
                <div className="project-list-grid">
                    {filteredProjects.map((p, index) => (
                        <div key={p.id} className="card project-card animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }} onClick={() => onSelectProject(p.id)}>
                            <div className="project-card-header">
                                <div>
                                    <div className="project-card-title">{p.name}</div>
                                    <div className="project-card-client">{p.client.name}</div>
                                </div>
                                <span className={`status-badge ${p.status === 'В работе' ? 'status-in-progress' : 'status-completed'}`}>
                                    {p.status}
                                </span>
                            </div>
                            <FinancialDashboard project={p} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <h3>Проектов пока нет</h3>
                    <p>{searchTerm ? `Не найдено проектов по запросу "${searchTerm}"` : `У вас пока нет проектов со статусом "${filter}".`}</p>
                    {filter === 'В работе' && !searchTerm && <button className="btn btn-primary" onClick={onShowNewProjectModal}>Создать первый проект</button>}
                </div>
            )}

            {filter === 'В работе' && <button className="fab" onClick={onShowNewProjectModal} aria-label="Новый проект">+</button>}
        </>
    );
};

const SettingsView = ({ profile, onSave, onLogout }: { profile: UserProfile, onSave: (profile: UserProfile) => Promise<void>, onLogout: () => void }) => {
    const [formData, setFormData] = useState(profile);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setFormData(prev => ({ ...prev, logo: base64 }));
            } catch (err) {
                addToast('Не удалось загрузить логотип', 'error');
            }
        }
    };
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            addToast('Профиль сохранен', 'success');
        } catch (err) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="card">
            <h3>Настройки профиля</h3>
            <form onSubmit={handleSave}>
                <div className="d-flex align-center gap-1 mb-1">
                    {formData.logo ? (
                        <img src={formData.logo} alt="Логотип" className="logo-preview" />
                    ) : (
                        <div className="logo-placeholder"><ImageIcon /></div>
                    )}
                    <div>
                        <label htmlFor="logo-upload" className="btn btn-secondary btn-sm">Загрузить лого</label>
                        <input id="logo-upload" type="file" accept="image/*" onChange={handleFileChange} style={{display: 'none'}} />
                        <p className="field-hint">Рекомендуется квадратное изображение</p>
                    </div>
                </div>
                <div className="form-group">
                    <label>Название компании / ИП</label>
                    <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>Контактное лицо</label>
                    <input type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} required />
                </div>
                <div className="form-group">
                    <label>Телефон</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-actions" style={{justifyContent: 'space-between'}}>
                    <button type="button" className="btn btn-secondary" onClick={onLogout}>Выйти</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader /> : 'Сохранить'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const InventoryView = ({ inventory, setInventory, notes, setNotes, projects, userKey }: { inventory: InventoryItem[], setInventory: Dispatch<SetStateAction<InventoryItem[]>>, notes: ProjectNote[], setNotes: Dispatch<SetStateAction<ProjectNote[]>>, projects: Project[], userKey: string }) => {
    const { addToast } = useToasts();
    const [showItemModal, setShowItemModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newNoteText, setNewNoteText] = useState('');

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        const newItem: InventoryItem = {
            id: generateId(),
            name: newItemName.trim(),
            location: 'На базе',
        };
        const updatedInventory = [...inventory, newItem];
        setInventory(updatedInventory);
        await api.saveData(userKey, 'inventory', updatedInventory);
        setNewItemName('');
        setShowItemModal(false);
    };
    
    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm('Удалить инструмент?')) return;
        const updatedInventory = inventory.filter(i => i.id !== itemId);
        setInventory(updatedInventory);
        await api.saveData(userKey, 'inventory', updatedInventory);
    };

    const handleLocationChange = async (itemId: string, location: string) => {
        const updatedInventory = inventory.map(i => i.id === itemId ? {...i, location} : i);
        setInventory(updatedInventory);
        await api.saveData(userKey, 'inventory', updatedInventory);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteText.trim()) return;
        const newNote: ProjectNote = {
            id: generateId(),
            text: newNoteText.trim(),
            createdAt: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        await api.saveData(userKey, 'inventory_notes', updatedNotes);
        setNewNoteText('');
    };
    
    const handleDeleteNote = async (noteId: string) => {
        const updatedNotes = notes.filter(n => n.id !== noteId);
        setNotes(updatedNotes);
        await api.saveData(userKey, 'inventory_notes', updatedNotes);
    };

    const activeProjects = projects.filter(p => p.status === 'В работе');

    return (
        <>
            <div className="card">
                <div className="d-flex justify-between align-center mb-1">
                    <h3>Инструменты и оборудование</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowItemModal(true)}>+ Добавить</button>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr><th>Наименование</th><th>Местоположение</th><th></th></tr>
                        </thead>
                        <tbody>
                            {inventory.length === 0 ? (
                                <tr><td colSpan={3} style={{textAlign: 'center', padding: '1rem'}}>Инструменты не добавлены</td></tr>
                            ) : (
                                inventory.map(item => (
                                    <tr key={item.id}>
                                        <td><strong>{item.name}</strong></td>
                                        <td>
                                            <select value={item.location} onChange={(e) => handleLocationChange(item.id, e.target.value)} style={{maxWidth: '200px', padding: 'var(--space-2)'}}>
                                                <option value="На базе">На базе</option>
                                                {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="align-right">
                                            <button className="action-btn" onClick={() => handleDeleteItem(item.id)}><DeleteIcon /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="card">
                <h3>Заметки по инвентарю</h3>
                 {notes.map(note => (
                    <div key={note.id} className="data-item">
                        <div className="data-item-info">
                            <p>{note.text}</p>
                            <span className="data-item-subtext">{new Date(note.createdAt).toLocaleString('ru-RU')}</span>
                        </div>
                        <button className="action-btn" onClick={() => handleDeleteNote(note.id)} aria-label="Удалить заметку">
                            <DeleteIcon />
                        </button>
                    </div>
                 ))}
                 <form onSubmit={handleAddNote} className="add-note-form">
                    <input type="text" value={newNoteText} onChange={e => setNewNoteText(e.target.value)} placeholder="Что-то сломалось или нужно купить..."/>
                    <button type="submit" className="btn btn-primary btn-sm">Добавить</button>
                </form>
            </div>
            
            <Modal show={showItemModal} onClose={() => setShowItemModal(false)} title="Добавить инструмент">
                <form onSubmit={handleAddItem}>
                    <div className="form-group">
                        <label>Название</label>
                        <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Например, Перфоратор Makita" required/>
                    </div>
                     <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Отмена</button>
                        <button type="submit" className="btn btn-primary">Добавить</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};


// --- APP INITIALIZATION ---
const queryParams = new URLSearchParams(window.location.search);
const isPublicView = queryParams.has('view') && queryParams.get('view') === 'estimate';

const AppWrapper = () => (
    <ToastProvider>
        {isPublicView ? <PublicEstimateView /> : <App />}
    </ToastProvider>
);

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<AppWrapper />);
}