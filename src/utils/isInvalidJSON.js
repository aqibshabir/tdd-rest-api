const isInvalidJSON = (err) => err instanceof SyntaxError && err.statusCode === 400 && err.body;

export default isInvalidJSON;
