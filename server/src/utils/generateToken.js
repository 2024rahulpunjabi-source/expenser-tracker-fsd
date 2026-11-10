import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'dev_secret_key_123456',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};
