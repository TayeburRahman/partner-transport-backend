
const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchasync");
const { VariableService } = require("./variable.service");
const { findOne } = require("./variable.model");
const Variable = require("./variable.model");
const VariableCount = require("./variable.count");

const createVariable = catchAsync(async (req, res) => {
    const result = await VariableService.createVariable(req);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Create successfully",
        data: result,
    });
});

const updateVariable = catchAsync(async (req, res) => {
    const result = await VariableService.updateVariable(req);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Update successfully",
        data: result,
    });
});

const getVariable = catchAsync(async (req, res) => {
    const result = await Variable.findOne()
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Get successfully",
        data: result,
    });
});

const convertDollarToPeso = catchAsync(async (req, res) => {
    const result = await VariableCount.convertDollarToPeso(req.body.price);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Get successfully",
        data: result,
    });
});

const convertPesoToDollar = catchAsync(async (req, res) => {
    const result = await VariableCount.convertPesoToDollar(req.body.price);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Get successfully",
        data: result,
    });
});

const changeContactNumber = catchAsync(async (req, res) => {
    const result = await VariableCount.changeContactNumber(req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Get successfully",
        data: result,
    });
});

const getContactNumber = catchAsync(async (req, res) => {
    const result = await VariableCount.getContactNumber(req.body);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Get successfully",
        data: result,
    });
});
 

 
 
const VariableController = {
    createVariable,
    updateVariable,
    getVariable,
    convertDollarToPeso,
    convertPesoToDollar,
    changeContactNumber,
    getContactNumber
};

module.exports = { VariableController };
