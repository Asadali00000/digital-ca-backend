 import jwt from 'jsonwebtoken';


 export const generateToken = (user) => {
   const payload = {
	 id: user.id,
	 role: user.role
   };

   return jwt.sign(payload, process.env.JWT_SECRET, {
	 expiresIn: process.env.JWT_EXPIRES_IN || '7d'
   });
 }

 export const verifyToken = (token) => {

	 return jwt.verify(token, process.env.JWT_SECRET);

 }
