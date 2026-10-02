import { MouseEvent, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ModalProps } from "@/types";

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
    
        if (isOpen) {
          dialog.showModal(); 
        } else {
          dialog.close();
        }
    }, [isOpen]);

    const handleBackdropClick = (event: MouseEvent) => {
        const dialogDimensions = dialogRef.current?.getBoundingClientRect();
        if (
            dialogDimensions && (event.clientX < dialogDimensions.left ||
            event.clientX > dialogDimensions.right ||
            event.clientY < dialogDimensions.top ||
            event.clientY > dialogDimensions.bottom)
        ) {
            onClose();
        }
    };

    if (typeof document === "undefined") return null;
    
    const modalRoot = document.getElementById("root-modal");
    if (!modalRoot) return null;

    return createPortal((
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onClick={handleBackdropClick}
            className="fixed inset-0 m-auto w-full max-w-lg p-0 rounded-2xl shadow-2xl border-0 bg-white backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        >
          <div className="flex flex-col w-full">
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
              <button 
                onClick={onClose} 
                aria-label="Close modal"
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </header>
            <main className="p-6 max-h-[75vh] overflow-y-auto">
              {children}
            </main>
          </div>
        </dialog>
    ), modalRoot);
}