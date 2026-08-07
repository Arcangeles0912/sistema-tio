import React, { useState } from 'react';
import OnboardingModal from './OnboardingModal';
import GuidedTour from './GuidedTour';
import { useAppContext } from '../context/AppContext';

const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState<'promptSeed' | 'promptTour' | 'tourActive'>('promptSeed');
  const { seedSampleData, completeOnboarding } = useAppContext();

  const handleSeedData = async (shouldSeed: boolean) => {
    if (shouldSeed) {
      await seedSampleData();
    }
    setStep('promptTour');
  };

  const handleTourPrompt = (shouldStart: boolean) => {
    if (shouldStart) {
      setStep('tourActive');
    } else {
      completeOnboarding();
    }
  };

  const handleTourEnd = () => {
    completeOnboarding();
  };

  switch (step) {
    case 'promptSeed':
      return (
        <OnboardingModal
          title="¡Bienvenido a LevelBlack V2!"
          message="Para ayudarte a empezar, ¿quieres que agreguemos algunos datos de prueba (productos y habitaciones de ejemplo) a tu sistema?"
          confirmText="Sí, agregar datos"
          declineText="No, empezaré de cero"
          onConfirm={() => handleSeedData(true)}
          onDecline={() => handleSeedData(false)}
        />
      );
    case 'promptTour':
      return (
        <OnboardingModal
          title="¿Te gustaría un recorrido?"
          message="Podemos mostrarte las funciones principales en un rápido recorrido guiado."
          confirmText="Sí, mostrarme"
          declineText="No, gracias"
          onConfirm={() => handleTourPrompt(true)}
          onDecline={() => handleTourPrompt(false)}
        />
      );
    case 'tourActive':
      return <GuidedTour onComplete={handleTourEnd} />;
    default:
      return null;
  }
};

export default OnboardingFlow;