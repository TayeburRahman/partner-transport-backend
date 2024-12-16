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
 
   

const getMostCreatedUsers = async (req) => {
  try {
    const {searchQuery = '', page = 1, pageSize = 10} = req.query 
    const sanitizedSearchQuery = searchQuery ? String(searchQuery) : '';
 
    const mostCreatedUsers = await Services.aggregate([
      { 
        $lookup: {
          from: "users", // User collection name
          localField: "user", // Field in Services collection (user ID)
          foreignField: "_id", // Field in User collection (user ID)
          as: "userDetails", // Output array field containing user details
        },
      },
      {
        // Unwind the userDetails array to work with single user details
        $unwind: "$userDetails",
      },
      {
        // Match users by name using regex if searchQuery is not empty
        $match: sanitizedSearchQuery
          ? {
              "userDetails.name": { $regex: sanitizedSearchQuery, $options: "i" },
            }
          : {}, // Empty object if no search query is provided, so it returns all users
      },
      {
        // Group by user and count the number of services each user has created
        $group: {
          _id: "$user", // Group by user ID
          serviceCount: { $sum: 1 }, // Count the number of services created by each user
        },
      },
      {
        // Sort by the number of services created in descending order
        $sort: { serviceCount: -1 },
      },
      {
        // Skip the results based on the current page and pageSize
        $skip: (page - 1) * pageSize, // Skip the results for previous pages
      },
      {
        // Limit the result to the current page's size
        $limit: pageSize, // Limit the number of users per page
      },
      {
        // Lookup again to fetch user details (name, email, etc.)
        $lookup: {
          from: "users", // User collection name
          localField: "_id", // User ID from previous group stage
          foreignField: "_id", // User ID from User collection
          as: "userDetails", // Output array field containing user details
        },
      },
      {
        // Unwind userDetails to flatten the structure
        $unwind: "$userDetails",
      },
      {
        // Project the desired fields: user name, email, and service count
        $project: {
            name: "$userDetails.name",
            email: "$userDetails.email",
            image: "$userDetails.image",
          serviceCount: 1,
        },
      },
    ]);

    // Get the total count of users that match the search query (for pagination)
    const totalUsersCount = await Services.aggregate([
      {
        // Lookup to get user details based on the user ID
        $lookup: {
          from: "users", // User collection name
          localField: "user", // Field in Services collection (user ID)
          foreignField: "_id", // Field in User collection (user ID)
          as: "userDetails", // Output array field containing user details
        },
      },
      {
        // Unwind the userDetails array to work with single user details
        $unwind: "$userDetails",
      },
      {
        // Match users by name using regex if searchQuery is not empty
        $match: sanitizedSearchQuery
          ? {
              "userDetails.name": { $regex: sanitizedSearchQuery, $options: "i" },
            }
          : {}, // Empty object if no search query is provided, so it returns all users
      },
      {
        // Group by user and count the number of services each user has created
        $group: {
          _id: "$user", // Group by user ID
        },
      },
    ]);

    const totalCount = totalUsersCount.length;
    const totalPages = Math.ceil(totalCount / pageSize); // Calculate total pages

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

  
  



const LogsDashboardService = {
    eventsCreationRate, 
    getMostCreatedUsers
  };
  
  module.exports = { LogsDashboardService };