import { ApiResponse } from "@nestjs/swagger";

export async function generateOtp() {
  let digits = "123456789";
  let otp = "";
  let len = digits.length;
  for (let i = 0; i < 4; i++) {
    otp += digits[Math.floor(Math.random() * len)];
  }
  return Number(otp);
}

export const generateRandomCandidateId = (length = 9): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  console.log("generated id ------->>>> ", result);
  return result;
};

export const validateRequiredFieldForProfile = (
  dtoData: Array<{ keyId: string; value: any }>,
  formKeys: Array<{
    _id: string;
    keyName: string;
    label: string;
    isRequired: boolean;
    isVisible: boolean;
  }>,
): {
  success: boolean;
  message?: string;
  filteredData?: Array<{ keyId: string; value: any }>;
} => {
  const formKeyIds = formKeys.map((k) => k._id.toString());
  const requiredFormKeys = formKeys.filter((k) => k.isRequired && k.isVisible);
  // Check required keys
  for (const reqKey of requiredFormKeys) {
    if (!dtoData.some((item) => item.keyId === reqKey._id.toString())) {
      return {
        success: false,
        message: `Missing required field: ${reqKey.label}`,
      };
    }
  }

  // Filter only valid keys
  const filteredData = dtoData.filter((item) =>
    formKeyIds.includes(item.keyId),
  );

  if (filteredData.length !== dtoData.length) {
    return { success: false, message: "Invalid form key(s) found" };
  }

  return { success: true, filteredData };
};

// ! Reusable Swagger decorators

// Reusable Swagger decorator for 401 errors
export const UnauthorizedSwagger = () => {
  return ApiResponse({
    status: 401,
    description: "Unauthorized",
    schema: { example: { statusCode: 401, message: "Unauthorized user" } },
  });
};

// Reusable Swagger response for 500 errors
export const InternalServerErrorSwagger = () => {
  return ApiResponse({
    status: 500,
    description: "Something Went Wrong",
    schema: {
      example: { statusCode: 500, error: "Something Went Wrong" },
    },
  });
};
