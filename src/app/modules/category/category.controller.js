const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const CategoryService = require("./category.service");

const createCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.createCategory(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category creation successful",
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.updateCategory(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category update successful",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.deleteCategory(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category deletion successful",
    data: result,
  });
});

const getAllCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.getAllCategory(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category retrieval successful",
    data: result,
  });
});

const CategoryController = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategory,
};

module.exports = { CategoryController };
