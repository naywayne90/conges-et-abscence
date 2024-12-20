import React from 'react';
import { Dialog } from '@headlessui/react';

interface AttachmentPreviewProps {
  attachment: {
    url: string;
    type: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl rounded bg-white p-4">
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute -right-2 -top-2 rounded-full bg-gray-800 p-1 text-white hover:bg-gray-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            {attachment.type.startsWith('image/') ? (
              <img
                src={attachment.url}
                alt="Justificatif"
                className="max-h-[80vh] w-auto"
              />
            ) : (
              <iframe
                src={attachment.url}
                className="h-[80vh] w-full"
                title="Document preview"
              />
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
