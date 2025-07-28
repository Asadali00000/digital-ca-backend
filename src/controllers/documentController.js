import prisma from "../../db/index.js";
import fs from 'fs'
import path from "path";
export const uploadDocument = async (req, res, next) => {
	try {


		const { clientId, category, description } = req.body;
		// Verify client exists and belongs to current CA
		const client = await prisma.client.findFirst({
			where: {
				id: clientId,
				createdById: req.user.id,
				isActive: true
			}
		});

		if (!client) {
			return res.status(404).json({
				success: false,
				message: 'Client not found or you do not have permission to upload documents for this client'
			});
		}

		if (!req.files || req.files.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'No files uploaded'
			});
		}

		// Process uploaded files
		const uploadedDocuments = [];

		for (const file of req.files) {
			const document = await prisma.document.create({
				data: {
					filename: file.filename,
					originalName: file.originalname,
					mimetype: file.mimetype,
					size: file.size,
					path: file.path,
					category: category || 'OTHERS',
					description: description || null,
					uploadedBy: {
						connect: {
							id: req.user.id
						}
					},
					client: { connect: { id: clientId } },
				},
				include: {
					client: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					uploadedBy: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							email: true
						}
					}
				}
			});

			uploadedDocuments.push(document);
		}

		res.status(201).json({
			success: true,
			message: `${uploadedDocuments.length} document(s) uploaded successfully`,
			data: {
				documents: uploadedDocuments,
				count: uploadedDocuments.length
			}
		});
	} catch (error) {
		// clean up uploaded files if database operation fails
		if (req.files) {
			req.files.forEach(file => {
				fs.unlink(file.path, (err) => {
					if (err) console.error('Error deleting file:', err);
				});
			});
		}
		next(error);
	}
};


export const getDocumentsByClient = async (req, res, next) => {
	try {
		const clientId = req.params.id;
		const { page = 1, limit = 10, category = 'all', search = '' } = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		if (!clientId) {
			return res.status(404).json({
				success: false,
				message: 'ClientId not found'
			});
		}
		//  client belong to current CA
		const client = await prisma.client.findFirst({
			where: {
				id: clientId,
				createdById: req.user.id
			}
		});


		if (!client) {
			return res.status(404).json({
				success: false,
				message: 'Client not found or you do not have permission to view this client'
			});
		}

		// create where clause
		const whereClause = {
			clientId: clientId
		};

		if (category !== 'all') {
			whereClause.category = category;
		}

		if (search) {
			whereClause.OR = [
				{ originalName: { contains: search } },
				{ description: { contains: search } }
			];
		}


		const [documents, totalCount] = await Promise.all([
			prisma.document.findMany({
				where: whereClause,
				include: {
					uploadedBy: {
						select: {
							firstName: true,
							lastName: true,
							email: true
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: parseInt(limit)
			}),
			prisma.document.count({ where: whereClause })
		]);

		const totalPages = Math.ceil(totalCount / parseInt(limit));

		res.json({
			success: true,
			message: 'Documents retrieved successfully',
			data: {
				client: {
					id: client.id,
					name: client.name,
					email: client.email
				},
				documents,
				pagination: {
					currentPage: parseInt(page),
					totalPages,
					totalCount,
					hasNextPage: parseInt(page) < totalPages,
					hasPrevPage: parseInt(page) > 1
				}
			}
		});
	} catch (error) {

		next(error);
	}
};
export const getAllDocuments = async (req, res, next) => {
	try {

		const { page = 1, limit = 10, category = 'all', search = '' } = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);


		// create where clause
		const whereClause = {
			client: {
				createdById: req.user.id
			}
		};

		if (category !== 'all') {
			whereClause.category = category;
		}

		if (search) {
			whereClause.OR = [
				{ originalName: { contains: search } },
				{ description: { contains: search } },
				{ client: { name: { contains: search } } }
			];
		}


		const [documents, totalCount] = await Promise.all([
			prisma.document.findMany({
				where: whereClause,
				include: {
					client: {
						select: {
							id: true,
							name: true,
							email: true
						}
					},
					uploadedBy: {
						select: {
							firstName: true,
							lastName: true,
							email: true
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: parseInt(limit)
			}),
			prisma.document.count({ where: whereClause })
		]);

		const totalPages = Math.ceil(totalCount / parseInt(limit));

		res.json({
			success: true,
			message: 'Documents retrieved successfully',
			data: documents,
			pagination: {
				currentPage: parseInt(page),
				totalPages,
				totalCount,
				hasNextPage: parseInt(page) < totalPages,
				hasPrevPage: parseInt(page) > 1
			}

		});
	} catch (error) {

		next(error);
	}
};


export const deleteDocument = async (req, res, next) => {
	try {
		const { id } = req.params;

		// check if document exists and belongs to current CA
		const document = await prisma.document.findFirst({
			where: {
				id,
				client: {
					createdById: req.user.id
				}
			}
		});

		if (!document) {
			return res.status(404).json({
				success: false,
				message: 'Document not found or you do not have permission to delete it'
			});
		}

		// delete from database
		await prisma.document.delete({
			where: { id }
		});

		// delete file from filesystem
		if (fs.existsSync(document.path)) {
			fs.unlink(document.path, (err) => {
				if (err) {
					console.error('Error deleting file from filesystem:', err);
				}
			});
		}

		res.json({
			success: true,
			message: 'Document deleted successfully'
		});
	} catch (error) {

		next(error);
	}
};

export const updateDocument = async (req, res, next) => {
	try {

		const { id } = req.params;
		const { category, description } = req.body;

		// Find document and verify permissions
		const existingDocument = await prisma.document.findFirst({
			where: {
				id,
				client: {
					createdById: req.user.id
				}
			}
		});

		if (!existingDocument) {
			return res.status(404).json({
				success: false,
				message: 'Document not found or you do not have permission to update it'
			});
		}

		// Update document
		const updatedDocument = await prisma.document.update({
			where: { id },
			data: {
				category: category || existingDocument.category,
				description: description !== undefined ? description : existingDocument.description
			},
			include: {
				client: {
					select: {
						id: true,
						name: true,
						email: true
					}
				},
				uploadedBy: {
					select: {
						firstName: true,
						lastName: true,
						email: true
					}
				}
			}
		});

		res.json({
			success: true,
			message: 'Document updated successfully',
			data: { document: updatedDocument }
		});
	} catch (error) {

		next(error);
	}
};
