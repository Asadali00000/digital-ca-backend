import prisma from "../../db/index.js";
export const createAlert = async (req, res, next) => {
  try {

    const { title, description, dueDate, priority = 'MEDIUM', clientId  } = req.body;

    // verify client belong to current ca
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
        message: 'Client not found or you do not have permission to create alerts for this client'
      });
    }
   const id=req.user.id

    // Create compliance alert
    const alert = await prisma.complianceAlert.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        priority,
        clientId,
        status: 'PENDING',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Compliance alert created successfully',
      data: { alert }
    });
  } catch (error) {

    next(error);
  }
};

export const updateAlert = async (req, res, next) => {
  try {

    const { id } = req.params;
    const { title, description, dueDate, priority, status } = req.body;

    // Find alert and verify permissions
    const existingAlert = await prisma.complianceAlert.findFirst({
      where: {
        id,
        client: {
          createdById: req.user.id
        }
      }
    });

    if (!existingAlert) {
      return res.status(404).json({
        success: false,
        message: 'Compliance alert not found or you do not have permission to update it'
      });
    }

    // Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;

    // Update compliance alert
    const updatedAlert = await prisma.complianceAlert.update({
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
        }
      }
    });

    res.json({
      success: true,
      message: 'Compliance alert updated successfully',
      data: { alert: updatedAlert }
    });
  } catch (error) {

    next(error);
  }
};

export const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingAlert = await prisma.complianceAlert.findFirst({
      where: {
        id,
        client: {
          createdById: req.user.id
        }
      }
    });

    if (!existingAlert) {
      return res.status(404).json({
        success: false,
        message: 'Compliance alert not found or you do not have permission to delete it'
      });
    }

    // Delete compliance alert
    await prisma.complianceAlert.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Compliance alert deleted successfully'
    });
  } catch (error) {

    next(error);
  }
};

export const getAllAlerts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'all',
      priority = 'all',
      clientId = null,
      upcoming = null,
      search = '',
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {
      client: {
        createdById: req.user.id
      }
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    if (priority !== 'all') {
      whereClause.priority = priority;
    }

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search} },
        { description: { contains: search  } },
        { client: { name: { contains: search  } } }
      ];
    }

    if (upcoming) {
      const upcomingDays = parseInt(upcoming);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + upcomingDays);

      whereClause.dueDate = {
        gte: new Date(),
        lte: futureDate
      };
      whereClause.status = 'PENDING';
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get alerts with pagination
    const [alerts, totalCount] = await Promise.all([
      prisma.complianceAlert.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.complianceAlert.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    const alertsWithDays = alerts.map(alert => {
      const daysUntilDue = Math.ceil((new Date(alert.dueDate) - new Date()) / (1000 * 60 * 60 * 24));



      return {
        ...alert,
        daysUntilDue,

      };
    });

    res.json({
      success: true,
      message: 'Compliance alerts retrieved successfully',
      data: {
        alerts: alertsWithDays,
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

