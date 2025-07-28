import prisma from "../../db/index.js";


const generateInvoiceNumber = async () => {
	const year = new Date().getFullYear();
	const month = String(new Date().getMonth() + 1).padStart(2, '0');

	// Get the count of invoices for current month
	const startOfMonth = new Date(year, new Date().getMonth(), 1);
	const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);

	const monthlyCount = await prisma.invoice.count({
		where: {
			createdAt: {
				gte: startOfMonth,
				lte: endOfMonth
			}
		}
	});

	const sequence = String(monthlyCount + 1).padStart(4, '0');
	return `INV-${year}${month}-${sequence}`;
};

export const createInvoice = async (req, res, next) => {
	try {

		const { clientId, amount, tax = 0, dueDate, description, status = 'DRAFT' } = req.body;
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
				message: 'Client not found or you do not have permission to create invoices for this client'
			});
		}

		// generate invoice number
		const invoiceNumber = await generateInvoiceNumber();

		// calculate total amount
		const totalAmount = parseFloat(amount) + parseFloat(tax);

		// create invoice
		const invoice = await prisma.invoice.create({
			data: {
				invoiceNumber,
				clientId,
				issuedById: req.user.id,
				amount: parseFloat(amount),
				tax: parseFloat(tax),
				totalAmount,
				status,
				dueDate: new Date(dueDate),
				description: description || null
			},
			include: {
				client: {
					select: {
						id: true,
						name: true,
						email: true,
						companyName: true
					}
				},
				issuedBy: {
					select: {
						firstName: true,
						lastName: true,
						email: true
					}
				}
			}
		});

		res.status(201).json({
			success: true,
			message: 'Invoice created successfully',
			data: { invoice }
		});
	} catch (error) {

		next(error);
	}
};

export const getInvoiceById = async (req, res, next) => {
	try {
		const { id } = req.params;

		const invoice = await prisma.invoice.findFirst({
			where: {
				id,
				client: {
					createdById: req.user.id
				}
			},
			include: {
				client: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
						companyName: true,
						gstin: true,
						pan: true,
						address: true
					}
				},
				issuedBy: {
					select: {
						firstName: true,
						lastName: true,
						email: true,
						caProfile: {
							select: {
								firm: true,
								licenseNumber: true
							}
						}
					}
				}
			}
		});

		if (!invoice) {
			return res.status(404).json({
				success: false,
				message: 'Invoice not found'
			});
		}

		res.json({
			success: true,
			message: 'Invoice retrieved successfully',
			data: { invoice }
		});
	} catch (error) {

		next(error);
	}
};

export const getAllInvoice = async (req, res, next) => {
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
				{ invoiceNumber: { contains: search } },
				{ description: { contains: search } },
				{ client: { name: { contains: search } } }
			];
		}


		const [documents, totalCount] = await Promise.all([

			prisma.invoice.findMany({
				where: whereClause,
				include: {
					client: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
							companyName: true,
							gstin: true,
							pan: true,
							address: true
						}
					},
					issuedBy: {
						select: {
							firstName: true,
							lastName: true,
							email: true,
							caProfile: {
								select: {
									firm: true,
									licenseNumber: true
								}
							}
						}
					}
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: parseInt(limit)

			})

		])


		res.json({
			success: true,
			message: 'Invoice retrieved successfully',
			data:documents
		});
	} catch (error) {

		next(error);
	}
};

export const updateInvoice = async (req, res, next) => {
	try {

		const { id } = req.params;
		const { amount, tax, dueDate, description, status } = req.body;

		// Find invoice and verify permissions
		const existingInvoice = await prisma.invoice.findFirst({
			where: {
				id,
				client: {
					createdById: req.user.id
				}
			}
		});

		if (!existingInvoice) {
			return res.status(404).json({
				success: false,
				message: 'Invoice not found or you do not have permission to update it'
			});
		}


		const updateData = {};

		if (amount !== undefined) {
			updateData.amount = parseFloat(amount);
		}

		if (tax !== undefined) {
			updateData.tax = parseFloat(tax);
		}

		// recalculate total amount
		if (amount !== undefined || tax !== undefined) {
			const newAmount = amount !== undefined ? parseFloat(amount) : existingInvoice.amount;
			const newTax = tax !== undefined ? parseFloat(tax) : existingInvoice.tax;
			updateData.totalAmount = newAmount + newTax;
		}

		if (dueDate) {
			updateData.dueDate = new Date(dueDate);
		}

		if (description !== undefined) {
			updateData.description = description;
		}

		if (status) {
			updateData.status = status;
		}

		// Update invoice
		const updatedInvoice = await prisma.invoice.update({
			where: { id },
			data: updateData,
			include: {
				client: {
					select: {
						id: true,
						name: true,
						email: true,
						companyName: true
					}
				},
				issuedBy: {
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
			message: 'Invoice updated successfully',
			data: { invoice: updatedInvoice }
		});
	} catch (error) {

		next(error);
	}
};

export const deleteInvoice = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Find invoice and verify permissions
		const existingInvoice = await prisma.invoice.findFirst({
			where: {
				id,
				client: {
					createdById: req.user.id
				}
			}
		});

		if (!existingInvoice) {
			return res.status(404).json({
				success: false,
				message: 'Invoice not found or you do not have permission to delete it'
			});
		}
		// Check if invoice can be deleted  only draft ones
		if (existingInvoice.status !== 'DRAFT') {
			return res.status(400).json({
				success: false,
				message: 'only draft invoices can be deleted'
			});
		}

		// Delete invoice
		await prisma.invoice.delete({
			where: { id }
		});

		res.json({
			success: true,
			message: 'Invoice deleted successfully'
		});
	} catch (error) {

		next(error);
	}
};
