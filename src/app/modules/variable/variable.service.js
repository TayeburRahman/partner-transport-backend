const ApiError = require("../../../errors/ApiError"); 
const httpStatus = require("http-status"); 
const Variable = require("./variable.model");
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");

const createVariable = async (req) => {
    const data = req.body;
    const { userId, emailAuth } = req.user;
  
    if (!data || Object.keys(data).length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Data is missing in the request body!");
    }
  
    try { 
      const result = await Variable.create(data);
  
      // Log success
      const newTask = {
        admin: userId,
        email: emailAuth,
        description: `Variable '${data.name || "unknown"}' was successfully created with ID ${result._id}.`,
        types: "Create",
        activity: "reglue",
        status: "Success",
      };
      await LogsDashboardService.createTaskDB(newTask);
  
      return result;
    } catch (error) {
      // Log failure
      const newTask = {
        admin: userId,
        email: emailAuth,
        description: `Failed to create variable '${data.name || "unknown"}': ${error.message || "Unknown error"}.`,
        types: "Failed",
        activity: "reglue",
        status: "Error",
      };
      await LogsDashboardService.createTaskDB(newTask); 
    }
  };
  
  const updateVariable = async (req) => {
    const data = req.body;
    const { userId, emailAuth } = req.user;
  
    if (!data || Object.keys(data).length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Data is missing in the request body!");
    }
  
    try { 
      const variable = await Variable.findOneAndUpdate({}, data, { new: true, runValidators: true });
  
      if (!variable) {
        throw new ApiError(httpStatus.NOT_FOUND, "Variable not found!");
      }
  
      // Log success
      const newTask = {
        admin: userId,
        email: emailAuth,
        description: `Variable was successfully updated. update author email: '${emailAuth}'`,
        types: "Update",
        activity: "reglue",
        status: "Success",
      };
      await LogsDashboardService.createTaskDB(newTask);
  
      return variable;
    } catch (error) {
      // Log failure
      const newTask = {
        admin: userId,
        email: emailAuth,
        description: `Failed to update variable: ${error.message || "Unknown error"}.`,
        types: "Failed",
        activity: "reglue",
        status: "Error",
      };
      await LogsDashboardService.createTaskDB(newTask);
    }
  };
  
 
const VariableService = {
  createVariable,
  updateVariable,
//   updateProfile,
};

module.exports = { VariableService };
