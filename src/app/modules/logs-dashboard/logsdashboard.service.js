const ApiError = require("../../../errors/ApiError");
const Services = require("../services/services.model");
const { LogAdmin } = require("./logsdashboard.model");

// ---------
const createTaskDB = async ({ admin, email, description, types, activity, status }) => {
  // console.log("Creating", admin, email, description, types, activity, status)
    try { 
      const task = new LogAdmin({
        admin,
        email, 
        description,
        types,
        activity,
        status,
      });
      await task.save();
      console.log("Task created successfully!");
    } catch (error) { 
      throw new ApiError(`Failed to create task: ${error?.message}`);    
    }
  };
  
// Audit Dashboards ================================
const eventsCreationRate = async (query) => {
    const { year, month = "all", service } = query;
    const filter = {};
    let startDate, endDate;
   
    if (year) {
      if (month !== "all") {
        const monthInt = parseInt(month, 10);
         
        startDate = new Date(`${year}-${monthInt}-01`);
         
        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1); 
        endDate.setDate(0);  
      } else { 
        startDate = new Date(`${year}-01-01`);  
        endDate = new Date(`${parseInt(year) + 1}-01-01`); 
      }
    } else { 
      const currentDate = new Date();
      startDate = new Date(`${currentDate.getFullYear()}-01-01`);
      endDate = new Date(`${currentDate.getFullYear() + 1}-01-01`);
    }
   
    if (service) {
      filter.service = service;
    }
   
    filter.createdAt = { $gte: startDate, $lt: endDate };
  
    const events = await Services.find(filter).select("service scheduleDate createdAt");
   
    const serviceCounts = {
      Goods: 0,
      Waste: 0,
      "Second_hand_items": 0,
      "Recyclable_materials": 0,
    };
  
    events.forEach((event) => {
      if (serviceCounts[event.service] !== undefined) {
        serviceCounts[event.service] += 1;
      }
    });

    const totalEvents = events.length;
   
    const totalDays = (endDate - startDate) / (1000 * 3600 * 24); 
    const eventsCreationRate = totalDays ? (totalEvents / totalDays).toFixed(2) : 0; 
   
    const mostCommonEventType = Object.keys(serviceCounts).reduce((a, b) =>
      serviceCounts[a] > serviceCounts[b] ? a : b
    );
  
    return {
      totalEvents,
      mostCommonEventType,
      eventsCreationRate,
      serviceCounts
    };
  }; 

const getMostCreatedUsers = async (req) => {
  try {
    const {searchQuery = '', page = 1, limit = 50} = req.query 
    const pageSize = parseInt(limit, 10);
    const sanitizedSearchQuery = searchQuery ? String(searchQuery) : '';
 
    const mostCreatedUsers = await Services.aggregate([
      { 
        $lookup: {
          from: "users", 
          localField: "user",  
          foreignField: "_id",  
          as: "userDetails", 
        },
      },
      { 
        $unwind: "$userDetails",
      },
      { 
        $match: sanitizedSearchQuery
          ? {
              "userDetails.name": { $regex: sanitizedSearchQuery, $options: "i" },
            }
          : {},  
      },
      { 
        $group: {
          _id: "$user", 
          serviceCount: { $sum: 1 },  
        },
      },
      { 
        $sort: { serviceCount: -1 },
      },
      { 
        $skip: (page - 1) * pageSize,  
      },
      { 
        $limit: pageSize,  
      },
      { 
        $lookup: {
          from: "users", 
          localField: "_id", 
          foreignField: "_id",  
          as: "userDetails",  
        },
      },
      { 
        $unwind: "$userDetails",
      },
      {
         
        $project: {
            name: "$userDetails.name",
            email: "$userDetails.email",
            image: "$userDetails.image",
          serviceCount: 1,
        },
      },
    ]);
 
    const totalUsersCount = await Services.aggregate([
      { 
        $lookup: {
          from: "users", 
          localField: "user",  
          foreignField: "_id", 
          as: "userDetails",  
        },
      },
      { 
        $unwind: "$userDetails",
      },
      { 
        $match: sanitizedSearchQuery
          ? {
              "userDetails.name": { $regex: sanitizedSearchQuery, $options: "i" },
            }
          : {},  
      },
      { 
        $group: {
          _id: "$user",  
        },
      },
    ]);

    const totalCount = totalUsersCount.length;
    const totalPages = Math.ceil(totalCount / pageSize); 

    return {
      totalUsers: totalCount,
      totalPages: totalPages,
      currentPage: page,
      users: mostCreatedUsers,
    };
  } catch (error) {
    console.error("Error fetching most created users:", error);
    throw error;
  }
}; 
// ===============================================
   

const LogsDashboardService = {
    eventsCreationRate, 
    getMostCreatedUsers,
    createTaskDB
  };
  
  module.exports = { LogsDashboardService };



    //   // log=====
    //   const newTask = {
    //     admin: userId,
    //     email: emailAuth,
    //     description: `Refund successful: Service ID ${serviceId} refunded an amount of $${amount} via PayPal.`,
    //     types: "Refund",
    //     activity: "task",
    //     status: "Success",
    //   }; 
    //   await LogsDashboardService.createTaskDB(newTask)
    //   // =====


    //       // log=====
    // const newTask = {
    //   admin: userId,
    //   email: emailAuth,
    //   description: `Refund failed: Service ID ${serviceId},  ${error.message || "An unexpected error occurred"}.`,
    //   types: "Failed",
    //   activity: "task",
    //   status: "Error",
    // }; 
    // await LogsDashboardService.createTaskDB(newTask)
    // // =====

