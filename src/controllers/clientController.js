import prisma from '../../db/index.js'

export const createClient = async (req, res , next) => {
	try {
		const clientData = {
			...req.body,
			createdBy: {
				connect: {
					id: req.user.id
				}
			}
		};

		const existingClient = await prisma.client.findFirst({
			where: {
				email: clientData.email,
				createdById: req.user.id
			}
		});

		if (existingClient) {
			return res.status(400).json({
				success: false,
				message: 'Client with this email already exists'
			});
		}

		const client = await prisma.client.create({
			data: clientData,
			include: {
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				}
			}
		});

		res.status(201).json({
			success: true,
			message: 'Client created successfully',
			data: { client }
		});
	} catch (error) {
		next(error)
	}
};

export const updateClient = async (req, res , next) => {
	try {

		const { id } = req.params;

		const existingClient = await prisma.client.findFirst({
			where: {
				id,
				createdById: req.user.id
			}
		});

		if (!existingClient) {
			return res.status(404).json({
				success: false,
				message: 'Client not found'
			});
		}
		if (req.body.email && req.body.email !== existingClient.email) {
			const emailExists = await prisma.client.findFirst({
				where: {
					email: req.body.email,
					createdById: req.user.id,
					id: { not: id }
				}
			});

			if (emailExists) {
				return res.status(400).json({
					success: false,
					message: 'Client with this email already exists'
				});
			}
		}

		const updatedClient = await prisma.client.update({
			where: { id },
			data: req.body,
			include: {
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				}
			}
		});

		res.json({
			success: true,
			message: 'Client updated successfully',
			data: { client: updatedClient }
		});
	} catch (error) {
		next(error);
	}
};

export const deleteClient = async (req, res , next) => {
	try {
		const { id } = req.params;

		const existingClient = await prisma.client.findFirst({
			where: {
				id,
				createdById: req.user.id
			}
		});

		if (!existingClient) {
			return res.status(404).json({
				success: false,
				message: 'Client not found'
			});
		}

		await prisma.client.update({
			where: { id },
			data: { isActive: false }
		});

		res.json({
			success: true,
			message: 'Client deactivated successfully'
		});
	} catch (error) {
		next(error);
	}
};

export const restoreClient = async (req, res , next) => {
	try {
		const { id } = req.params;

		const client = await prisma.client.findFirst({
			where: {
				id,
				createdById: req.user.id,
				isActive: false
			}
		});

		if (!client) {
			return res.status(404).json({
				success: false,
				message: 'Deactivated client not found'
			});
		}

		const restoredClient = await prisma.client.update({
			where: { id },
			data: { isActive: true }
		});

		res.status(200).json({
			success: true,
			message: 'Client restored successfully',
			data: { client: restoredClient }
		});
	} catch (error) {
		next(error);
	}
};
export const getClient = async (req, res , next) => {
	try {
		const { id } = req.query;

		const clients = await prisma.client.findMany({
			where: {
				id,
				createdById: req.user.id,
				isActive :true
			}
		});


		res.status(200).json({
			success: true,
			message: 'client retrieved successfully',
			data: { client: clients }
		});
	} catch (error) {
		next(error);
	}
};
