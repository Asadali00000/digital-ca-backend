

import prisma from "../../db/index.js";
import { generateToken } from "../utils/jwt.js";
import bcrypt from 'bcrypt'

export const register = async (req, res) => {
	try {
		const { email, password, firstName, lastName, role, profileData } = req.body;

		const existingUser = await prisma.user.findUnique({
			where: { email }
		});
		if (existingUser) {
			return res.status(400).json({ success: false, message: "User already exists" });
		}

		const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		const userData = {
			email,
			password: hashedPassword,
			firstName,
			lastName,
			role
		};
		if (role == 'CLIENT') {
			userData.clientProfile = {
				create: profileData
			};
		} else if (role == 'CA') {
			userData.caProfile = {
				create: profileData
			};
		}
		const user = await prisma.user.create({
			data: userData,
			select: {
				id: true,
				email: true,
				role: true
			}
		});
		const token = generateToken({ id: user.id, role: user.role });
		const { password: _, ...userResponse } = user;

		res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: {
				user: userResponse,
				token
			}
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Registration failed',
			error: error.message
		});
	}
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        caProfile: true,
        clientProfile: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account deactivated'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken({ id: user.id, role: user.role });

    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};
