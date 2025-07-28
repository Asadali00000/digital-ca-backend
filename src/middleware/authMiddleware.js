import prisma from '../../db/index.js';
import { verifyToken } from '../utils/jwt.js';

export const protect = async (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			return res.status(401).json({ message: "Not authorized, token missing" });
		}

		const decoded = verifyToken(token);
		const user = await prisma.user.findUnique({
			where: { id: decoded.id },
			select: {
				id: true,

			}
		});




		req.user = { id: decoded.id };


		next();
	} catch (err) {
		return res.status(401).json({ message: "Not authorized, invalid token" });
	}
};
