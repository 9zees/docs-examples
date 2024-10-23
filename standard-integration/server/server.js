import express from "express";
import fetch from "node-fetch";
import "dotenv/config";
import path from "path";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8888 } = process.env;
// const base = "https://api.msmaster.qa.paypal.com";
const base = "https://api-m.sandbox.paypal.com";
const app = express();

app.set("view engine", "ejs");
app.set("views", "./server/views");

// host static files
app.use(express.static("client"));

// parse post params sent in body in json format
app.use(express.json());

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const authenticate = async (bodyParams) => {
  const params = {
    grant_type: "client_credentials",
    response_type: "id_token",
    ...bodyParams,
  };

  // pass the url encoded value as the body of the post call
  const urlEncodedParams = new URLSearchParams(params).toString();
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET
    ).toString("base64");

    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: urlEncodedParams,
      /*headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },*/
      headers: {
        Authorization: `Basic ${auth}`,
        // "X-CSRF-TOKEN": csrf,
        // "content-type": "application/json",
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

const generateAccessToken = async () => {
  const { jsonResponse } = await authenticate();
  console.log("Access Token: ", jsonResponse.access_token);
  return jsonResponse.access_token;
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (cart) => {
  // use the cart information passed from the front-end to calculate the purchase unit details
  console.log(
    "shopping cart information passed from the frontend createOrder() callback:",
    cart
  );

  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "110.00",
        },
      },
    ],
  };

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

/**
 * Create a subscription
 * @see https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_create
 */
const createSubscription = async (payload) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v1/billing/subscriptions`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

/**
 * Get a subscription
 * @see https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_get
 */
const getSubscription = async (subscriptionID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v1/billing/subscriptions/${subscriptionID}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "GET",
  });

  return handleResponse(response);
};
/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
  });

  return handleResponse(response);
};

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

app.post("/api/subscriptions", async (req, res) => {
  console.log(
    "mschin server.js: createSubscription(..) is called with req.body => ",
    req.body
  );
  try {
    //const { plan_id } = req.body;
    //const { jsonResponse, httpStatusCode } = await createSubscription(plan_id);
    const { jsonResponse, httpStatusCode } = await createSubscription(req.body);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create subscription:", error);
    res.status(500).json({ error: "Failed to create subscription." });
  }
});

app.post("/api/subscriptions/:subscriptionID", async (req, res) => {
  console.log(
    "mschin server.js: getSubscription(..) is called with req.params => ",
    req.params
  );
  try {
    const { subscriptionID } = req.params;
    const { jsonResponse, httpStatusCode } = await getSubscription(
      subscriptionID
    );
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to get subscription:", error);
    res.status(500).json({ error: "Failed to get subscription." });
  }
});

app.post("/api/orders", async (req, res) => {
  console.log(
    "mschin server.js: createOrder(..) is called with req.body => ",
    req.body
  );
  try {
    // use the cart information passed from the front-end to calculate the order amount detals
    const { cart } = req.body;
    const { jsonResponse, httpStatusCode } = await createOrder(cart);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
  console.log(
    "mschin server.js: captureOrder(..) is called with req.params => ",
    req.params
  );
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
});

// serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.resolve("./client/checkout.html"));
});

app.get("/oneTimeCheckoutVaultedWallet", async (req, res) => {
  try {
    const { jsonResponse } = await authenticate({
      // target_customer_id: 'ArqWQnYXUR'
      // SANDBOX:
      // sb-pgni616333786@personal.example.com
      // last-4: 9472

      // target_customer_id: 'RepYxluUMm' //mschinBuyerQA@paypal.com, last-4: 0026|777

      // target_customer_id: 'jCMWTAbPOM' //coffee-buyer@paypal.com, last-4: 1753
      target_customer_id: req.query.customerID,
    });
    res.render("oneTimeCheckoutVaultedWallet", {
      clientId: PAYPAL_CLIENT_ID,
      userIdToken: jsonResponse.id_token,
      customerIdQueryParam: req.query.customerID,
    });
    console.log(
      "Vault userID Token obtained by /oneTimeCheckoutVaultedWallet: ",
      jsonResponse.id_token
    );
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/vaultedSubscription", async (req, res) => {
  try {
    const { jsonResponse } = await authenticate({
      // target_customer_id: 'ArqWQnYXUR'
      // SANDBOX:
      // sb-pgni616333786@personal.example.com
      // last-4: 9472

      // target_customer_id: 'RepYxluUMm' //mschinBuyerQA@paypal.com, last-4: 0026|777

      // target_customer_id: 'jCMWTAbPOM' //coffee-buyer@paypal.com, last-4: 1753
      target_customer_id: req.query.customerID,
    });
    res.render("vaultedSubscription", {
      clientId: PAYPAL_CLIENT_ID,
      userIdToken: jsonResponse.id_token,
      customerIdQueryParam: req.query.customerID,
    });
    console.log("Vault userID Token: ", jsonResponse.id_token);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});
