import React, { createContext, useContext } from 'react';

// Runtime contract injected by the Core host. Never import from another module.
const RuntimeContext = createContext(null);
export const RuntimeProvider = RuntimeContext.Provider;
export const useRuntime = () => useContext(RuntimeContext);
