const axios = require("axios");

const configuredBaseUrl =
  process.env.KORA_API_URL ||
  process.env.KORAPAY_API_BASE_URL ||
  "https://api.korapay.com/merchant/api/v1";
const providerUrl = configuredBaseUrl.endsWith("/merchant/api/v1")
  ? configuredBaseUrl
  : `${configuredBaseUrl}/merchant/api/v1`;
const secretKey = () =>
  process.env.KORA_SECRET_KEY || process.env.KORAPAY_SECRET_KEY;
const getHeaders = () => ({
  Authorization: `Bearer ${secretKey()}`,
  "Content-Type": "application/json",
});

exports.initialize = async ({
  email,
  amount,
  reference,
  callbackUrl,
  metadata,
  notificationUrl,
}) => {
  if (!secretKey())
    throw Object.assign(new Error("Kora is not configured"), {
      statusCode: 503,
      code: "PAYMENT_PROVIDER_UNAVAILABLE",
    });
  const response = await axios.post(
    `${providerUrl}/charges/initialize`,
    {
      amount: Math.round(amount),
      currency: "NGN",
      reference,
      redirect_url: callbackUrl,
      notification_url: notificationUrl,
      customer: { email },
      metadata,
      merchant_bears_cost: true,
    },
    { headers: getHeaders() },
  );
  return response.data.data || response.data;
};

exports.verify = async (reference) => {
  if (!secretKey())
    throw Object.assign(new Error("Kora is not configured"), {
      statusCode: 503,
      code: "PAYMENT_PROVIDER_UNAVAILABLE",
    });
  const response = await axios.get(
    `${providerUrl}/charges/${encodeURIComponent(reference)}`,
    { headers: getHeaders() },
  );
  return response.data.data || response.data;
};

exports.isSuccessful = (transaction) =>
  transaction &&
  ["success", "successful"].includes(String(transaction.status).toLowerCase());

exports.isFailed = (transaction) =>
  transaction &&
  ["failed", "abandoned", "cancelled"].includes(
    String(transaction.status).toLowerCase(),
  );

exports.isPending = (transaction) =>
  transaction &&
  ["pending", "processing", "initialized"].includes(
    String(transaction.status).toLowerCase(),
  );
