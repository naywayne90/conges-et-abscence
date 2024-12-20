import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { motion, AnimatePresence } from 'framer-motion';

// Configure le worker PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FileViewerProps {
  file: {
    url: string;
    type: string;
    name: string;
  };
  onClose: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({ file, onClose }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const isPDF = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{file.name}</h3>
          <div className="flex items-center space-x-4">
            <a
              href={file.url}
              download={file.name}
              className="text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              <svg
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Télécharger
            </a>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-8rem)]">
          {isPDF ? (
            <div className="flex flex-col items-center">
              <div className="mb-4 flex items-center space-x-4">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                >
                  Précédent
                </button>
                <span>
                  Page {currentPage} sur {numPages || '?'}
                </span>
                <button
                  disabled={currentPage >= (numPages || 1)}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(numPages || 1, p + 1))
                  }
                  className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
                >
                  Suivant
                </button>
                <button
                  onClick={() => setScale((s) => s + 0.1)}
                  className="px-3 py-1 rounded bg-gray-200"
                >
                  Zoom +
                </button>
                <button
                  onClick={() => setScale((s) => Math.max(0.1, s - 0.1))}
                  className="px-3 py-1 rounded bg-gray-200"
                >
                  Zoom -
                </button>
              </div>
              <Document
                file={file.url}
                onLoadSuccess={onDocumentLoadSuccess}
                className="border rounded"
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          ) : isImage ? (
            <div className="flex justify-center">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full h-auto"
                style={{ maxHeight: 'calc(90vh - 8rem)' }}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p>Ce type de fichier ne peut pas être prévisualisé.</p>
              <a
                href={file.url}
                download={file.name}
                className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
              >
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
