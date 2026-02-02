
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AppRouter } from './components/AppRouter';

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <AppRouter />
    </>
  );
};

export default App;
