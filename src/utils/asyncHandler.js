// ******* Method - 01 ******* --> for providing async try catch wrapper

const asyncHandler = (fxn) => {
  return (req, res, next) => {
    Promise.resolve(fxn(req, res, next)).catch((error) => {
      const err = {
        code: error.code || 500,
        message: error.message || "Internal Server Error",
      };
      res.status(err.code).json({
        success: false,
        message: err.message,
      });
    });
  };
};

// ******* Method - 02 ******* --> for providing async try catch wrapper

// const asyncHandler = () => {};
// const asyncHandler = (fxn) => { async () => {};};
// const asyncHandler = (fxn) => async () => {};

// const asyncHandler = (fxn) => {
//   async (err, req, res, next) => {
//     try {
//       await fxn(err, req, res, next);
//     } catch (error) {
//       res.status(err.code || 500).json({
//         success: false,
//         message: err.message,
//       });
//     }
//   };
// };

export {asyncHandler};
