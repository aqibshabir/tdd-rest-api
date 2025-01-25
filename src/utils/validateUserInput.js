export default function validateUserInput(name, email) {
  const emailValidation = /^\S+@\S+\.\S+$/;
  const isValidEmail = emailValidation.test(email);
  if (!name || !email) {
    return 'Missing Field(s)';
  }
  if (typeof name !== 'string') {
    return 'Name Must Be a String';
  }
  if (!isValidEmail) {
    return 'Invalid Email Address';
  }
  return null;
}
