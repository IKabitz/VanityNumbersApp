"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lambdaHandler = void 0;
exports.lambdaHandler = async (event) => {
    const endPoint = event.Details.ContactData.CustomerEndpoint.Address;
    return {
        endPoint: endPoint
    };
};
//# sourceMappingURL=app.js.map