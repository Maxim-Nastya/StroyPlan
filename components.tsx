import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ToastMessage, PhotoReport } from './types';

// --- UI COMPONENTS ---

interface LoaderProps {
  fullScreen?: boolean;
}
export const Loader = ({ fullScreen = false }: LoaderProps) => (
    <div className={fullScreen ? "loader-overlay" : ""}>
        <div className="loader-spinner"></div>
    </div>
);

const ToastContext = createContext<{ addToast: (message: string, type: 'success' | 'error') => void; }>({ addToast: () => {} });

interface ToastProviderProps {
    children: React.ReactNode;
}
export const ToastProvider = ({ children }: ToastProviderProps) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToasts = () => useContext(ToastContext);

interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}
export const Modal = ({ show, onClose, title, children }: ModalProps) => {
    useEffect(() => {
        if (show) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [show]);

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 id="modal-title">{title}</h3>
                    <button onClick={onClose} className="close-button" aria-label="Закрыть">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};


interface PhotoViewerModalProps {
    show: boolean;
    onClose: () => void;
    images: PhotoReport[];
    startIndex: number;
}
export const PhotoViewerModal = ({ show, onClose, images, startIndex }: PhotoViewerModalProps) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        if (show) {
            setCurrentIndex(startIndex);
        }
    }, [show, startIndex]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    }, [images.length]);

    useEffect(() => {
        if (!show) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToNext();
            else if (e.key === 'ArrowLeft') goToPrevious();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [show, goToNext, goToPrevious, onClose]);

    if (!show || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <div className="photo-viewer-overlay" onClick={onClose}>
            <button className="photo-viewer-close-btn" aria-label="Закрыть" onClick={onClose}>&times;</button>
            <button className="photo-viewer-nav-btn prev" aria-label="Предыдущее фото" onClick={(e) => { e.stopPropagation(); goToPrevious(); }}>&#10094;</button>
            <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
                <img src={currentImage.image} alt={currentImage.description} />
                {currentImage.description && <p className="photo-viewer-description">{currentImage.description}</p>}
            </div>
            <button className="photo-viewer-nav-btn next" aria-label="Следующее фото" onClick={(e) => { e.stopPropagation(); goToNext(); }}>&#10095;</button>
        </div>
    );
};
