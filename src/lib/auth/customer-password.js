export const CUSTOMER_PASSWORD_MIN_LENGTH = 8;

export function getCustomerPasswordError(password) {
  if (typeof password !== "string" || password.length < CUSTOMER_PASSWORD_MIN_LENGTH) {
    return "passwordMustBeAtLeastEightCharacters";
  }

  return null;
}
