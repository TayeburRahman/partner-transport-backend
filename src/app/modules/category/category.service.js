const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const Category = require("./category.model");
const QueryBuilder = require("../../../builder/queryBuilder");
const { LogsDashboardService } = require("../logs-dashboard/logsdashboard.service");

const createCategory = async (req) => {
  const { userId, emailAuth } = req.user;

  try { 
    const result = await Category.create(req.body);

    // Log success
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Category '${req.body.category}' successfully created with ID ${result._id}.`,
      types: "Create",
      activity: "task",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask);

    return result;
  } catch (error) {
    // Log failure
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Failed to create category '${req.body.category}': ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: "task",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask); 
  }
};


const updateCategory = async (req) => {
  const { id, ...others } = req.body;
  //  console.log("=====", others)
  const { userId, emailAuth } = req.user;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing category id");
  }

  try {
    const result = await Category.findByIdAndUpdate(
      id,
      { ...others },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!result) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    // Log success
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Category with ID ${id} successfully updated.`,
      types: "Update",
      activity: "reglue",
      status: "Success",
    };
    
    await LogsDashboardService.createTaskDB(newTask);
   //------
    return result;
  } catch (error) {
    // Log failure
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Failed to update category with ID ${id}: ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: "reglue",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask); 
  }
};


const deleteCategory = async (req) => {
  const { id } = req.query;
  const { userId, emailAuth } = req.user;

  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing category id");
  }

  try { 
    const result = await Category.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    // Log success
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Category with ID ${id} was successfully deleted.`,
      types: "Delete",
      activity: "reglue",
      status: "Success",
    };
    await LogsDashboardService.createTaskDB(newTask);

    return { message: "Category deleted successfully" };
  } catch (error) {
    // Log failure
    const newTask = {
      admin: userId,
      email: emailAuth,
      description: `Failed to delete category with ID ${id}: ${error.message || "Unknown error"}.`,
      types: "Failed",
      activity: "reglue",
      status: "Error",
    };
    await LogsDashboardService.createTaskDB(newTask);
 
  }
};


const getAllCategory = async (query) => {
  const categoryQuery = new QueryBuilder(Category.find({}), query)
    .search([])
    .filter()
    // .sort()
    // .paginate()
    .fields();

  const result = await categoryQuery.modelQuery;
  const meta = await categoryQuery.countTotal();
 

  return {
    meta,
    data: result,
  };
};

const CategoryService = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategory,
};

module.exports = CategoryService;
