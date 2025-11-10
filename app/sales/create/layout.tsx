
import React from 'react';

interface CreateLayoutProps {
  children: React.ReactNode;
}

const CreateLayout: React.FC< CreateLayoutProps> = ({ children }) => {
  return (
    <div >
      {children}
    </div>
  );
};

export default CreateLayout;
