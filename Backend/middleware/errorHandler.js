export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
    console.error(err);
    const status =
      err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
    res.status(status).json({
        message: err.message || "Server error",
    });
};
