import React from 'react';

interface OnboardingModalProps {
  title: string;
  message: string;
  confirmText: string;
  declineText: string;
  onConfirm: () => void;
  onDecline: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ title, message, confirmText, declineText, onConfirm, onDecline }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8 text-center animate-fade-in-down">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{title}</h2>
        <p className="text-slate-600 mb-8">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onDecline}
            className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md font-semibold hover:bg-slate-300"
          >
            {declineText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;