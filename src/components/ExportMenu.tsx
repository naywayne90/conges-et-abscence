import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToExcel } from '../services/exportService';
import toast from 'react-hot-toast';

interface ExportMenuProps {
  data: any[];
  isLoading: boolean;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ data, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExport = async (type: 'all' | 'validated' | 'rejected') => {
    if (isLoading) {
      toast.error('Veuillez attendre le chargement des données');
      return;
    }

    if (data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    try {
      const toastId = toast.loading('Exportation en cours...');
      exportToExcel(data, type);
      toast.success('Exportation réussie', { id: toastId });
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast.error('Erreur lors de l\'exportation');
    }

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <svg
          className="-ml-1 mr-2 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Exporter
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
          >
            <div
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="export-menu"
            >
              <button
                onClick={() => handleExport('all')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                Exporter toutes les demandes
              </button>
              <button
                onClick={() => handleExport('validated')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                Exporter les demandes validées
              </button>
              <button
                onClick={() => handleExport('rejected')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
              >
                Exporter les demandes rejetées
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
