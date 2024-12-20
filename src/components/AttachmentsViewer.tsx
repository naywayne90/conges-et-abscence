import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Workaround for webpack 5
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface Attachment {
  id: string;
  filename: string;
  type: string;
  category: string;
  url: string;
  created_at: string;
}

interface AttachmentsViewerProps {
  attachments: Attachment[];
  onDownload: (attachment: Attachment) => void;
}

export const AttachmentsViewer: React.FC<AttachmentsViewerProps> = ({
  attachments,
  onDownload,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  const groupedAttachments = attachments.reduce((acc, attachment) => {
    if (!acc[attachment.category]) {
      acc[attachment.category] = [];
    }
    acc[attachment.category].push(attachment);
    return acc;
  }, {} as Record<string, Attachment[]>);

  const isImage = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  const isPDF = (filename: string) => {
    return /\.pdf$/i.test(filename);
  };

  const renderThumbnail = (attachment: Attachment) => {
    if (isImage(attachment.filename)) {
      return (
        <div className="relative group">
          <img
            src={attachment.url}
            alt={attachment.filename}
            className="h-24 w-24 object-cover rounded-lg cursor-pointer transform transition-transform group-hover:scale-105"
            onClick={() => setSelectedImage(attachment.url)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
        </div>
      );
    } else if (isPDF(attachment.filename)) {
      return (
        <div className="relative">
          <Document
            file={attachment.url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            className="h-24 w-24"
          >
            <Page
              pageNumber={1}
              height={96}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          <button
            onClick={() => onDownload(attachment)}
            className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
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
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedAttachments).map(([category, files]) => (
        <div key={category} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {category}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((attachment) => (
              <div
                key={attachment.id}
                className="flex flex-col items-center space-y-2"
              >
                {renderThumbnail(attachment)}
                <span className="text-sm text-gray-500 text-center truncate max-w-full px-2">
                  {attachment.filename}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal pour l'aperçu des images */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Aperçu"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
