const { buildQueryString } = require('./scratch4.js');

const queryParams = {
    page: 1,
    searchTerm: "",
    mainService: "",
    service: "",
    category: "",
    status: "",
    order: "desc"
};

console.log(buildQueryString(queryParams));
