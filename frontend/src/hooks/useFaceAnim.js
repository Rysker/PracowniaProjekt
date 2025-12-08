import { useState, useEffect, useRef } from 'react';
import { validatePassword } from '../utils/validators';

export const useFaceAnim = (email, password, showPassword, isError) => {
  const [faceState, setFaceState] = useState('idle');
  const [faceLocked, setFaceLocked] = useState(false);
  const revertRef = useRef(null);

  useEffect(() => {
    if (faceLocked) 
        return;
    if (!email && !password) 
        return setFaceState('idle');
    if (showPassword) 
        return setFaceState('peek');
    if (email && !password) 
        return setFaceState('happy');

    const pwdError = validatePassword(password);
    if (password && pwdError) 
        return setFaceState('concern');
    if (password && !pwdError) 
        return setFaceState('confident');
  }, [email, password, showPassword, faceLocked]);

  const triggerErrorAnim = () => {
    setFaceState('neutral flip-mouth');
    setFaceLocked(true);
    if (revertRef.current) 
        clearTimeout(revertRef.current);
    revertRef.current = setTimeout(() => {
      setFaceState('concern');
      setFaceLocked(false);
    }, 3000);
  };

  const triggerSuccessAnim = () => {
    setFaceState('success');
    setTimeout(() => setFaceState('idle'), 1200);
  };

  return { faceState, setFaceState, triggerErrorAnim, triggerSuccessAnim };
};