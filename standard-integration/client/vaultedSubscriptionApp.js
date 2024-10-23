// const PLAN_ID = "P-5TA4440421944643LM4IEWFI"; // msmaster
const PLAN_ID = "P-18N054251K828063VM4MCFZQ"; // sandbox

const startTime = getStartTime();

const COMPLETE_REQUEST_OBJECT = {
  plan_id: PLAN_ID,
  application_context: {
    brand_name: "walmart",
    locale: "en-US",
    shipping_preference: "SET_PROVIDED_ADDRESS",
    user_action: "SUBSCRIBE_NOW",
    payment_method: {
      payer_selected: "PAYPAL",
      payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
    },
    return_url: "https://example.com/returnUrl",
    cancel_url: "https://example.com/cancelUrl",
  },
  start_time: startTime,
  quantity: "20",
  shipping_amount: {
    currency_code: "USD",
    value: "10.00",
  },
  subscriber: {
    name: {
      given_name: "John",
      surname: "Doe",
    },
    email_address: "customer@example.com",
    shipping_address: {
      name: {
        full_name: "John Doe",
      },
      address: {
        address_line_1: "2211 N First Street",
        address_line_2: "Building 17",
        admin_area_2: "San Jose",
        admin_area_1: "CA",
        postal_code: "95131",
        country_code: "US",
      },
    },
  },
};

window.paypal
  .Buttons({
    async createSubscription() {
      try {
        console.log("createSubscription() hooks is called");
        const response = await fetch("/api/subscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // use the "body" param to optionally pass additional order information
          body: JSON.stringify(COMPLETE_REQUEST_OBJECT),
        });

        const jsonResponse = await response.json();
        console.log(
          "==>> createSubscription() response before buyer approval: ",
          jsonResponse
        );
        return jsonResponse.id;
      } catch (error) {
        console.error(error);
        resultMessage(
          `Could not initiate PayPal Subscription...<br><br>${error}`
        );
      }
    },
    async onApprove(data, actions) {
      try {
        console.log("data received for onApprove: ", data);

        const response = await fetch(
          `/api/subscriptions/${data.subscriptionID}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const jsonResponse = await response.json();
        console.log(
          "==>> getSubscription() response after buyer approval: ",
          jsonResponse
        );
        return jsonResponse.id;
      } catch (error) {
        console.error(error);
        resultMessage(
          `Sorry, your subscription could not be processed...<br><br>${error}`
        );
      }
    },
  })
  .render("#paypal-button-container");

// Example function to show a result to the user. Your site's UI library can be used instead.
function resultMessage(message) {
  const container = document.querySelector("#result-message");
  container.innerHTML = message;
}

function fetchVaultedWallet() {
  const customerId = document.getElementById("customerId").value;
  console.log("fetch vaulted wallet for customerId: ", customerId);
  window.location.href = `/vaultedSubscription?customerID=${customerId}`;
}

function getStartTime() {
  const currentDate = new Date();
  const futureDate = new Date(currentDate);
  futureDate.setDate(currentDate.getDate() + 1);
  const formattedToISO = futureDate.toISOString();
  return formattedToISO;
}
