import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- ICONS ---
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/></svg>;
const DeleteIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/></svg>;
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/></svg>;
const ReplayIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V1L7 6L12 11V8C15.31 8 18 10.69 18 14C18 17.31 15.31 20 12 20C8.69 20 6 17.31 6 14H4C4 18.42 7.58 22 12 22C16.42 22 20 18.42 20 14C20 9.58 16.42 6 12 6Z" fill="currentColor"/></svg>;
const PrintIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 8H5C3.34 8 2 9.34 2 11V17H6V21H18V17H22V11C22 9.34 20.66 8 19 8ZM16 19H8V14H16V19ZM19 12C18.45 12 18 11.55 18 11C18 10.45 18.45 10 19 10C19.55 10 20 10.45 20 11C20 11.55 19.55 12 19 12ZM18 3H6V7H18V3Z" fill="currentColor"/></svg>;
const SettingsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.96 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.5 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.5 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.73 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.04 4.95 18.95L7.44 17.94C7.96 18.34 8.52 18.68 9.13 18.93L9.5 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.5 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.94L19.05 18.95C19.27 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="currentColor"/></svg>;
const ImageIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.5L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/></svg>;


// --- DATA TYPES ---
interface Client {
    name: string;
    phone: string;
}

interface UserProfile {
    companyName: string;
    contactName: string;
    phone: string;
    logo: string; // base64 data URL
}

interface EstimateItem {
    id: string;
    name: string;
    type: 'Работа' | 'Материал';
    unit: string;
    quantity: number;
    price: number;
}

interface DirectoryItem {
    name: string;
    type: 'Работа' | 'Материал';
    unit: string;
    price: number;
}

interface Expense {
    id: string;
    date: string;
    description: string;
    amount: number;
    receipt?: string; // base64 data URL
}

interface Payment {
    id: string;
    date: string;
    amount: number;
}

interface Project {
    id: string;
    name: string;
    address: string;
    status: 'В работе' | 'Завершен';
    client: Client;
    estimate: EstimateItem[];
    expenses: Expense[];
    payments: Payment[];
    contractor?: UserProfile;
}

// --- HOOK FOR LOCALSTORAGE ---
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

// --- UTILITY FUNCTIONS ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
};

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


// --- UI COMPONENTS ---

const Modal = ({ show, onClose, title, children }: { show: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

// --- CORE APP COMPONENTS ---

const FinancialDashboard = ({ project }: { project: Project }) => {
    const totals = useMemo(() => {
        const estimateTotal = project.estimate.reduce((sum, item) => sum + item.quantity * item.price, 0);
        const materialCosts = project.estimate
            .filter(item => item.type === 'Материал')
            .reduce((sum, item) => sum + item.quantity * item.price, 0);
        const expensesTotal = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalPaid = project.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const profit = estimateTotal - materialCosts - expensesTotal;

        return { estimateTotal, expensesTotal, totalPaid, profit };
    }, [project]);

    return (
        <div className="card-inset">
            <div className="financial-summary-grid">
                <div className="summary-item">
                    <div className="summary-item-label">Смета</div>
                    <div className="summary-item-value">{formatCurrency(totals.estimateTotal)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Расходы</div>
                    <div className="summary-item-value">{formatCurrency(totals.expensesTotal)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Оплачено</div>
                    <div className="summary-item-value">{formatCurrency(totals.totalPaid)}</div>
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

const EstimateEditor = ({ project, setProjects, directory, setDirectory }: { project: Project, setProjects: React.Dispatch<React.SetStateAction<Project[]>>, directory: DirectoryItem[], setDirectory: React.Dispatch<React.SetStateAction<DirectoryItem[]>> }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);
    const [newItem, setNewItem] = useState<Omit<EstimateItem, 'id'>>({ name: '', type: 'Работа', unit: 'шт', quantity: 1, price: 0 });
    const [suggestions, setSuggestions] = useState<DirectoryItem[]>([]);
    
    const isEditing = editingItem !== null;

    const openModalForNew = () => {
        setEditingItem(null);
        setNewItem({ name: '', type: 'Работа', unit: 'шт', quantity: 1, price: 0 });
        setShowModal(true);
    };

    const openModalForEdit = (item: EstimateItem) => {
        setEditingItem(item);
        setNewItem({ ...item });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSuggestions([]);
        setEditingItem(null);
    };
    
    const handleSaveItem = () => {
        const trimmedName = newItem.name.trim();
        if (!trimmedName) return;

        if (isEditing) { // Update existing item
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, estimate: p.estimate.map(item => item.id === editingItem.id ? { ...item, ...newItem, name: trimmedName } : item) } : p));
        } else { // Add new item
            const itemWithId: EstimateItem = { ...newItem, name: trimmedName, id: generateId() };
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, estimate: [...p.estimate, itemWithId] } : p));
        }
        
        // Add to personal directory if it's a new item name
        const isInDirectory = directory.some(dirItem => dirItem.name.toLowerCase() === trimmedName.toLowerCase());
        if (!isInDirectory) {
            setDirectory(prev => [...prev, { name: trimmedName, type: newItem.type, unit: newItem.unit, price: newItem.price }]);
        }

        closeModal();
    };

    const handleDeleteItem = (itemId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, estimate: p.estimate.filter(item => item.id !== itemId) } : p));
        }
    };

    const handleShare = () => {
        const estimateLink = `${window.location.origin}${window.location.pathname}?view=estimate&projectId=${project.id}`;
        navigator.clipboard.writeText(estimateLink).then(() => {
            alert(`Ссылка на смету скопирована!\n\n${estimateLink}`);
        });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            price: suggestion.price,
        });
        setSuggestions([]);
    };
    
    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>Смета</h3>
                <div>
                     <button className="btn btn-secondary btn-sm" onClick={handleShare}>Поделиться</button>
                     <button className="btn btn-primary btn-sm" style={{marginLeft: '0.5rem'}} onClick={openModalForNew}>+ Добавить</button>
                </div>
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
                        {project.estimate.length === 0 ? (
                            <tr><td colSpan={5} style={{textAlign: 'center', padding: '1rem'}}>Позиций пока нет.</td></tr>
                        ) : (
                            project.estimate.map((item, index) => (
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
                                            <button className="action-btn" onClick={() => openModalForEdit(item)} title="Редактировать"><EditIcon /></button>
                                            <button className="action-btn" onClick={() => handleDeleteItem(item.id)} title="Удалить"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
             <Modal show={showModal} onClose={closeModal} title={isEditing ? 'Редактировать позицию' : 'Добавить позицию'}>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveItem(); }}>
                    <div className="form-group autocomplete-container">
                        <label>Наименование</label>
                        <input type="text" value={newItem.name} onChange={handleNameChange} required autoComplete="off" />
                        {suggestions.length > 0 && (
                            <div className="autocomplete-suggestions">
                                {suggestions.map(suggestion => (
                                    <div key={suggestion.name} className="suggestion-item" onClick={() => handleSuggestionClick(suggestion)}>
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
                        <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as 'Работа' | 'Материал'})}>
                            <option>Работа</option>
                            <option>Материал</option>
                        </select>
                    </div>
                    <div className="d-flex gap-1">
                        <div className="form-group w-100">
                           <label>Количество</label>
                           <input type="number" step="any" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})} required />
                        </div>
                        <div className="form-group w-100">
                           <label>Ед. изм. (шт, м², час)</label>
                           <input type="text" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Цена за единицу</label>
                        <input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} required />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Отмена</button>
                        <button type="submit" className="btn btn-primary">{isEditing ? 'Сохранить' : 'Добавить'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const ExpenseTracker = ({ project, setProjects }: { project: Project, setProjects: React.Dispatch<React.SetStateAction<Project[]>> }) => {
    const [showModal, setShowModal] = useState(false);
    const [entryType, setEntryType] = useState<'expense' | 'payment'>('expense');
    const [newEntry, setNewEntry] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: 0 });
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

    const transactions = useMemo(() => {
        const combinedExpenses = project.expenses.map(e => ({ ...e, type: 'expense' as const }));
        const combinedPayments = project.payments.map(p => ({ ...p, type: 'payment' as const, description: 'Платеж от клиента' }));
        return [...combinedExpenses, ...combinedPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [project.expenses, project.payments]);

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (entryType === 'expense') {
            let receiptDataUrl: string | undefined = undefined;
            if (receiptFile) {
                receiptDataUrl = await fileToBase64(receiptFile);
            }
            const expenseWithId: Expense = { ...newEntry, id: generateId(), receipt: receiptDataUrl };
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, expenses: [...p.expenses, expenseWithId] } : p));
        } else {
            const paymentWithId: Payment = { id: generateId(), date: newEntry.date, amount: newEntry.amount };
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, payments: [...p.payments, paymentWithId] } : p));
        }
        setShowModal(false);
        setNewEntry({ date: new Date().toISOString().split('T')[0], description: '', amount: 0 });
        setReceiptFile(null);
    };
    
    const handleDeleteTransaction = (id: string, type: 'expense' | 'payment') => {
        if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
        
        setProjects(prevProjects => prevProjects.map(p => {
            if (p.id === project.id) {
                if (type === 'expense') {
                    return { ...p, expenses: p.expenses.filter(e => e.id !== id) };
                } else { // type === 'payment'
                    return { ...p, payments: p.payments.filter(pay => pay.id !== id) };
                }
            }
            return p;
        }));
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
                                 <button className="action-btn" onClick={() => handleDeleteTransaction(t.id, t.type)} title="Удалить"><DeleteIcon /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <Modal show={showModal} onClose={() => setShowModal(false)} title="Добавить операцию">
                 <div className="modal-toggle">
                    <button className={entryType === 'expense' ? 'active' : ''} onClick={() => setEntryType('expense')}>Расход</button>
                    <button className={entryType === 'payment' ? 'active' : ''} onClick={() => setEntryType('payment')}>Платеж</button>
                </div>
                <form onSubmit={handleAddEntry}>
                    <div className="form-group">
                        <label>Сумма</label>
                        <input type="number" step="0.01" value={newEntry.amount} onChange={e => setNewEntry({...newEntry, amount: parseFloat(e.target.value) || 0})} required />
                    </div>
                     <div className="form-group">
                        <label>Дата</label>
                        <input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} required />
                    </div>
                    {entryType === 'expense' && (
                        <>
                            <div className="form-group">
                                <label>Описание</label>
                                <input type="text" value={newEntry.description} onChange={e => setNewEntry({...newEntry, description: e.target.value})} placeholder="Например, материалы с рынка" required />
                            </div>
                            <div className="form-group">
                                <label>Фото чека (необязательно)</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </>
                    )}
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
                        <button type="submit" className="btn btn-primary">Добавить</button>
                    </div>
                </form>
            </Modal>

            <Modal show={!!receiptPreview} onClose={closeReceiptPreview} title="Просмотр чека">
                {receiptPreview && <img src={receiptPreview} alt="Чек" style={{width: '100%', borderRadius: 'var(--border-radius)'}} />}
            </Modal>
        </div>
    );
};


const ProjectEditModal = ({ project, show, onClose, setProjects }: { project: Project, show: boolean, onClose: () => void, setProjects: React.Dispatch<React.SetStateAction<Project[]>> }) => {
    const [editedProject, setEditedProject] = useState({ name: '', address: '', clientName: '', clientPhone: '' });

    useEffect(() => {
        if (project) {
            setEditedProject({
                name: project.name,
                address: project.address,
                clientName: project.client.name,
                clientPhone: project.client.phone
            });
        }
    }, [project, show]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setProjects(prev => prev.map(p => p.id === project.id ? {
            ...p,
            name: editedProject.name,
            address: editedProject.address,
            client: {
                name: editedProject.clientName,
                phone: editedProject.clientPhone
            }
        } : p));
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} title="Редактировать проект">
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label>Название проекта</label>
                    <input type="text" value={editedProject.name} onChange={e => setEditedProject({ ...editedProject, name: e.target.value })} required />
                </div>
                 <div className="form-group">
                    <label>Адрес</label>
                    <input type="text" value={editedProject.address} onChange={e => setEditedProject({ ...editedProject, address: e.target.value })} required />
                </div>
                 <div className="form-group">
                    <label>Имя клиента</label>
                    <input type="text" value={editedProject.clientName} onChange={e => setEditedProject({ ...editedProject, clientName: e.target.value })} required />
                </div>
                 <div className="form-group">
                    <label>Телефон клиента</label>
                    <input type="tel" value={editedProject.clientPhone} onChange={e => setEditedProject({ ...editedProject, clientPhone: e.target.value })} required />
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
                    <button type="submit" className="btn btn-primary">Сохранить</button>
                </div>
            </form>
        </Modal>
    );
};

const ProjectDetails = ({ project, setProjects, onBack, directory, setDirectory }: { project: Project, setProjects: React.Dispatch<React.SetStateAction<Project[]>>, onBack: () => void, directory: DirectoryItem[], setDirectory: React.Dispatch<React.SetStateAction<DirectoryItem[]>> }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleToggleStatus = () => {
        const newStatus = project.status === 'В работе' ? 'Завершен' : 'В работе';
        const confirmationText = newStatus === 'Завершен' 
            ? 'Вы уверены, что хотите завершить проект?' 
            : 'Вы уверены, что хотите вернуть проект в работу?';
        
        if (window.confirm(confirmationText)) {
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus } : p));
        }
    };

    return (
        <div className="animate-fade-slide-up">
            <button onClick={onBack} className="back-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/></svg>
                <span>Все проекты</span>
            </button>
            <div className="project-details-header">
                <div className="d-flex justify-between align-start">
                    <div>
                        <h2>{project.name}</h2>
                        <p>{project.address} &bull; {project.client.name}, {project.client.phone}</p>
                    </div>
                    <div className="project-header-actions">
                         <button className="action-btn" onClick={() => setIsEditing(true)} title="Редактировать проект"><EditIcon /></button>
                         <button className="action-btn" onClick={handleToggleStatus} title={project.status === 'В работе' ? "Завершить проект" : "Вернуть в работу"}>
                             {project.status === 'В работе' ? <CheckIcon /> : <ReplayIcon />}
                         </button>
                    </div>
                </div>
            </div>
            <FinancialDashboard project={project} />
            <EstimateEditor project={project} setProjects={setProjects} directory={directory} setDirectory={setDirectory} />
            <ExpenseTracker project={project} setProjects={setProjects} />

            <ProjectEditModal project={project} show={isEditing} onClose={() => setIsEditing(false)} setProjects={setProjects} />
        </div>
    );
};

const ProjectCreationModal = ({ show, onClose, setProjects, userProfile }: { show: boolean, onClose: () => void, setProjects: React.Dispatch<React.SetStateAction<Project[]>>, userProfile: UserProfile }) => {
    const [newProject, setNewProject] = useState({ name: '', address: '', clientName: '', clientPhone: '' });

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        const project: Project = {
            id: generateId(),
            name: newProject.name,
            address: newProject.address,
            status: 'В работе',
            client: { name: newProject.clientName, phone: newProject.clientPhone },
            estimate: [],
            expenses: [],
            payments: [],
            contractor: userProfile,
        };
        setProjects(prev => [project, ...prev]);
        setNewProject({ name: '', address: '', clientName: '', clientPhone: '' });
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} title="Новый проект">
            <form onSubmit={handleCreateProject}>
                <div className="form-group">
                    <label>Название проекта</label>
                    <input type="text" placeholder="Ремонт квартиры на Лесной" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} required />
                </div>
                 <div className="form-group">
                    <label>Адрес</label>
                    <input type="text" placeholder="г. Москва, ул. Лесная, д. 5, кв. 10" value={newProject.address} onChange={e => setNewProject({ ...newProject, address: e.target.value })} required />
                </div>
                 <div className="form-group">
                    <label>Имя клиента</label>
                    <input type="text" placeholder="Иван Петров" value={newProject.clientName} onChange={e => setNewProject({ ...newProject, clientName: e.target.value })} required />
                </div>
                 <div className="form-group">
                    <label>Телефон клиента</label>
                    <input type="tel" placeholder="+7 (999) 123-45-67" value={newProject.clientPhone} onChange={e => setNewProject({ ...newProject, clientPhone: e.target.value })} required />
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
                    <button type="submit" className="btn btn-primary">Создать</button>
                </div>
            </form>
        </Modal>
    );
};

const ProfileModal = ({ show, onClose, profile, setProfile }: { show: boolean, onClose: () => void, profile: UserProfile, setProfile: React.Dispatch<React.SetStateAction<UserProfile>> }) => {
    const [formData, setFormData] = useState<UserProfile>(profile);

    useEffect(() => {
        if (show) {
            setFormData(profile);
        }
    }, [profile, show]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setFormData(prev => ({ ...prev, logo: base64 }));
            } catch (error) {
                console.error("Error converting file to base64", error);
                alert("Не удалось загрузить файл.");
            }
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setProfile(formData);
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} title="Профиль исполнителя">
            <form onSubmit={handleSave}>
                <div className="form-group logo-upload-section">
                    <div className="logo-preview-container">
                        {formData.logo ? (
                             <img src={formData.logo} alt="Логотип" className="logo-preview" />
                        ) : (
                            <div className="logo-placeholder"><ImageIcon/></div>
                        )}
                    </div>
                    <div>
                        <input type="file" id="logo-upload" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                        <label htmlFor="logo-upload" className="btn btn-secondary btn-sm">Загрузить логотип</label>
                        <p className="field-hint">Рекомендуется квадратное изображение</p>
                    </div>
                </div>

                <div className="form-group">
                    <label>Название компании / ИП</label>
                    <input type="text" placeholder="ИП Петров / Бригада 'Мастер'" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Контактное лицо</label>
                    <input type="text" placeholder="Иван Петров" value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Телефон</label>
                    <input type="tel" placeholder="+7 (999) 123-45-67" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
                    <button type="submit" className="btn btn-primary">Сохранить</button>
                </div>
            </form>
        </Modal>
    );
};


const ProjectList = ({ projects, onSelectProject, onNewProject }: { projects: Project[], onSelectProject: (id: string) => void, onNewProject: () => void }) => {
    const [statusFilter, setStatusFilter] = useState<'В работе' | 'Завершен'>('В работе');
    
    const filteredProjects = useMemo(() => 
        projects
            .filter(p => p.status === statusFilter)
            .sort((a, b) => a.name.localeCompare(b.name)), 
        [projects, statusFilter]
    );

    return (
        <div>
            <div className="d-flex justify-between align-center mb-1">
                <h2>Проекты</h2>
                <div className="filter-toggle">
                    <button className={statusFilter === 'В работе' ? 'active' : ''} onClick={() => setStatusFilter('В работе')}>В работе</button>
                    <button className={statusFilter === 'Завершен' ? 'active' : ''} onClick={() => setStatusFilter('Завершен')}>Завершенные</button>
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="empty-state">
                    {projects.length === 0 ? (
                        <>
                            <p>У вас пока нет проектов. <br/>Начните с создания первого!</p>
                            <button className="btn btn-primary" onClick={onNewProject}>Создать первый проект</button>
                        </>
                    ) : (
                         <p>Нет проектов со статусом "{statusFilter}".</p>
                    )}
                </div>
            ) : (
                <div className="project-list-grid">
                    {filteredProjects.map((p, index) => (
                         <div key={p.id} className="card project-card animate-fade-slide-up" onClick={() => onSelectProject(p.id)} style={{ animationDelay: `${index * 75}ms` }}>
                             <div className="project-card-header">
                                <div>
                                    <div className="project-card-title">{p.name}</div>
                                    <div className="project-card-client">{p.client.name}</div>
                                </div>
                                <span className={`status-badge ${p.status === 'В работе' ? 'status-in-progress' : 'status-completed'}`}>{p.status}</span>
                            </div>
                            <FinancialDashboard project={p} />
                         </div>
                    ))}
                </div>
            )}
            <button className="fab" onClick={onNewProject} title="Новый проект">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/></svg>
            </button>
        </div>
    );
};

const PublicEstimateView = ({ projects, projectId }: { projects: Project[], projectId: string }) => {
    const project = projects.find(p => p.id === projectId);

    if (!project) {
        return <div className="loader">Смета не найдена или ссылка некорректна.</div>;
    }

    const totals = {
        work: project.estimate.filter(i => i.type === 'Работа').reduce((sum, item) => sum + item.quantity * item.price, 0),
        material: project.estimate.filter(i => i.type === 'Материал').reduce((sum, item) => sum + item.quantity * item.price, 0),
        total: project.estimate.reduce((sum, item) => sum + item.quantity * item.price, 0)
    };
    
    return (
        <div className="public-estimate-container">
            <header className="public-header">
                <h1>Смета по объекту</h1>
                <button className="btn btn-primary print-button" onClick={() => window.print()}>
                    <PrintIcon />
                    <span>Печать / Сохранить в PDF</span>
                </button>
            </header>
            
            {project.contractor && (project.contractor.companyName || project.contractor.logo) && (
                <div className="card contractor-card">
                    {project.contractor.logo && <img src={project.contractor.logo} alt="Логотип" className="contractor-logo" />}
                    <div className="contractor-info">
                        <strong>{project.contractor.companyName || 'Исполнитель'}</strong>
                        {project.contractor.contactName && <p>{project.contractor.contactName}</p>}
                        {project.contractor.phone && <p>{project.contractor.phone}</p>}
                    </div>
                </div>
            )}

            <div className="card">
                <h2>{project.name}</h2>
                <p className="project-meta">{project.address}</p>
                <p className="project-meta"><strong>Заказчик:</strong> {project.client.name}, {project.client.phone}</p>
            </div>

            <div className="card">
                <h3>Детализация сметы</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Позиция</th>
                                <th className="align-right">Кол-во</th>
                                <th className="align-right">Цена</th>
                                <th className="align-right">Итог</th>
                            </tr>
                        </thead>
                        <tbody>
                            {project.estimate.length === 0 ? (
                                <tr><td colSpan={4} style={{textAlign: 'center', padding: '1rem'}}>Позиций нет.</td></tr>
                            ) : (
                                project.estimate.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.name}</strong>
                                            <br />
                                            <small>{item.type}</small>
                                        </td>
                                        <td className="align-right">{item.quantity} {item.unit}</td>
                                        <td className="align-right">{formatCurrency(item.price)}</td>
                                        <td className="align-right">{formatCurrency(item.quantity * item.price)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                 <h3>Итоги</h3>
                 <div className="estimate-totals">
                     <div className="total-row">
                         <span>Работы</span>
                         <span>{formatCurrency(totals.work)}</span>
                     </div>
                     <div className="total-row">
                         <span>Материалы</span>
                         <span>{formatCurrency(totals.material)}</span>
                     </div>
                     <div className="total-row grand-total">
                         <span>Всего по смете</span>
                         <span>{formatCurrency(totals.total)}</span>
                     </div>
                 </div>
            </div>

            <footer className="public-footer">
                <p>Смета сформирована в <a href={window.location.origin} target="_blank" rel="noopener noreferrer">Прораб</a></p>
            </footer>
        </div>
    );
};

const App = () => {
    const [projects, setProjects] = useLocalStorage<Project[]>('prorab_projects', []);
    const [directory, setDirectory] = useLocalStorage<DirectoryItem[]>('prorab_directory', []);
    const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('prorab_profile', { companyName: '', contactName: '', phone: '', logo: '' });
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // --- Routing Logic ---
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
    const view = urlParams.get('view');
    const publicProjectId = urlParams.get('projectId');

    if (view === 'estimate' && publicProjectId) {
        return <PublicEstimateView projects={projects} projectId={publicProjectId} />;
    }
    // --- End Routing Logic ---


    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);
    
    // Simple routing based on component state
    const handleSelectProject = (id: string) => {
        setSelectedProjectId(id);
    };

    const handleBack = () => {
        setSelectedProjectId(null);
    };

    return (
        <>
            <header>
                <div className="header-content">
                    <h1>Прораб</h1>
                    <button className="settings-btn" onClick={() => setShowProfileModal(true)} title="Настройки профиля">
                        <SettingsIcon />
                    </button>
                </div>
            </header>
            <main className="app-container">
                 {selectedProject ? (
                    <ProjectDetails 
                        project={selectedProject} 
                        setProjects={setProjects} 
                        onBack={handleBack}
                        directory={directory}
                        setDirectory={setDirectory}
                    />
                ) : (
                    <ProjectList 
                        projects={projects} 
                        onSelectProject={handleSelectProject}
                        onNewProject={() => setShowNewProjectModal(true)}
                    />
                )}
            </main>
            <ProjectCreationModal 
                show={showNewProjectModal} 
                onClose={() => setShowNewProjectModal(false)} 
                setProjects={setProjects}
                userProfile={userProfile}
            />
            <ProfileModal
                show={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                profile={userProfile}
                setProfile={setUserProfile}
            />
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);