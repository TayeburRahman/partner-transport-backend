const ApiError = require("../../../errors/ApiError");
const Services = require("../services/services.model");

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
      "Second-hand items": 0,
      "Recyclable materials": 0,
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


  const getMostCreatedUsers = async (limit = 10) => {
    try {
      // Aggregation pipeline to count services per user
      const mostCreatedUsers = await Services.aggregate([
        {
          // Group by user and count the number of services
          $group: {
            _id: "$user", // Group by user ID
            serviceCount: { $sum: 1 }, // Count the number of services created by each user
          },
        },
        {
          // Sort users by service count in descending order
          $sort: { serviceCount: -1 },
        },
        {
          // Limit the result to the top `limit` users
          $limit: limit,
        },
        {
          // Populate user details from the User collection
          $lookup: {
            from: "users", // Collection name of the User model
            localField: "_id", // Field from the Services collection (user ID)
            foreignField: "_id", // Field in the User collection (user ID)
            as: "userDetails", // Output array field containing user details
          },
        },
        {
          // Unwind the userDetails array to get the user as a single object
          $unwind: "$userDetails",
        },
        {
          // Project the desired fields (user details and service count)
          $project: {
            user: "$userDetails.name", // User's name
            email: "$userDetails.email", // User's email
            serviceCount: 1, // Service count for the user
          },
        },
      ]);
  
      return mostCreatedUsers;
    } catch (error) {
      console.error("Error fetching most created users:", error);
      throw new ApiError(400, "Failed to fetch most created users:" + error.message);
    }
  };
  
  



const LogsDashboardService = {
    eventsCreationRate, 
    getMostCreatedUsers
  };
  
  module.exports = { LogsDashboardService };