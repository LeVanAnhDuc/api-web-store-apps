// libs
import { Response } from "express";

/**
 * Format string interpolation - For Example:
 * stringDataSource: "Are you sure you want to delete [0]:[1]?"
 * stringInterpolation: ["01", "Name Item"]
 * result: "Are you sure you want to delete 01:Name Item?"
 * @param {string} stringDataSource - string be localed
 * @param {Array} stringInterpolation - includes item need replace
 */
export const formatSI = (
  stringDataSource: string,
  stringInterpolation: object
) => {
  if (stringDataSource === "") return "";

  if (!stringDataSource) {
    throw TypeError("stringDataSource should be a string");
  }
  if (!stringInterpolation) {
    throw TypeError("stringInterpolation should be an array or object");
  }
  let stringFormatted = stringDataSource;
  // stringInterpolation = ["A", 20]
  // Result: placeholderNames = [["0", "A"], ["1", 20]]
  // stringInterpolation = { name: "A", age: [20]}
  // Result: 8 = [["name", "A"], ["age", 20]]
  const placeholderNames = Object.entries({ ...stringInterpolation });
  placeholderNames.forEach(([placeholderName, placeholderValue]) => {
    stringFormatted = stringFormatted.replace(
      new RegExp(`\\[${placeholderName}\\]`, "g"),
      placeholderValue as string
    );
  });
  return stringFormatted;
};

/**
 * Sets a cookie on the response object with the specified name and value.
 * The cookie is set with HTTP-only, secure, and same-site attributes.
 *
 * @param {Response} res - The Express response object.
 * @param {string} name - The name of the cookie.
 * @param {any} value - The value to be stored in the cookie.
 * @param {number} maxAge - The maximum age in milliseconds for the cookie.
 */

export const setCookie = <T>({
  res,
  name,
  value,
  maxAge
}: {
  res: Response;
  name: string;
  value: T;
  maxAge: number;
}) =>
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge
  });
