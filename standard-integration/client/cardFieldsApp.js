const PLAN_ID = "P-5TA4440421944643LM4IEWFI"; // msmaster
// const PLAN_ID = "P-18N054251K828063VM4MCFZQ"; // sandbox

const startTime = getStartTime();

const CARD_FIELDS_REQUEST_OBJ = {
  plan_id: PLAN_ID,
  application_context: {
    brand_name: "walmart",
    locale: "en-US",
    shipping_preference: "SET_PROVIDED_ADDRESS",
    user_action: "CONTINUE",
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
    /* // FOR UNBRANDED:
    payment_source: {
      card: {
        number: "4111111111111111",
        expiry: "2020-02",
        security_code: "121",
        name: "John Doe",
        billing_address: {
          address_line_1: "2211 N First Street",
          address_line_2: "17.3.160",
          admin_area_1: "CA",
          admin_area_2: "San Jose",
          postal_code: "95131",
          country_code: "US",
        },
      },
    },*/
  },
};

// Custom styles object (optional)
const styleObject = {
  input: {
    "font-size": "16 px",
    "font-family": "monospace",
    "font-weight": "lighter",
    color: "blue",
  },
  ".invalid": {
    color: "purple",
  },
  ":hover": {
    color: "orange",
  },
  ".purple": {
    color: "purple",
  },
};

// Create the card fields component and define callbacks
const cardField = paypal.CardFields({
  style: styleObject,
  async createSubscription(data, actions) {
    try {
      console.log("[docs-examples] createSubscription() is called...");
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // use the "body" param to optionally pass additional order information
        body: JSON.stringify({
          plan_id: "P-5TA4440421944643LM4IEWFI", //msmaster,
        }),
      });

      const jsonResponse = await response.json();
      console.log(
        "[docs-examples] createSubscription() response BEFORE buyer approval: ",
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
      console.log("[docs-examples] onApprove() data: ", data);

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
        "[docs-examples] createSubscription() response AFTER buyer approval: ",
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
  async onError(error) {
    // Handle the error object
    console.error(error);
  },
  inputEvents: {
    onChange: function (data) {
      // Handle a change event in any of the fields
      // console.log("onChange data: ", data);
    },
    onFocus: function (data) {
      // Clear any error messages:
      resultMessage("");

      // Handle a focus event in any of the fields
      // console.log("onFocus data: ", data);
    },
    onBlur: function (data) {
      // Handle a blur event in any of the fields
      // console.log("onBlur data: ", data);
    },
    onInputSubmitRequest: function (data) {
      validateAndSubmitForm(data);
    },
  },
});

const validateAndSubmitForm = (data) => {
  console.log("[docs-examples] validateAndSubmitForm() is called with data: ", data);

  // Submit only if the current state of the form is valid
  if (data.isFormValid) {
    resultMessage("Form is submitted...", "blue");

    cardField
      .submit()
      .then(() => {
        // Handle a successful payment
        setTimeout(() => {
          resultMessage("Payment is successful!", "green");
        }, 3000);
      })
      .catch((error) => {
        // Handle an unsuccessful payment
        resultMessage(
          `Unable to process Subscription payments... <br><br>${error}`
        );
      });
  } else {
    // Inform payer that some fields aren't valid
    resultMessage(`Payment info is not complete`);
  }
};

// Define the container for each field and the submit button

// Optional field: cardNameContainer
const cardNameContainer = document.getElementById("card-name-field-container");

const cardNumberContainer = document.getElementById(
  "card-number-field-container"
);
const cardCvvContainer = document.getElementById("card-cvv-field-container");

const cardExpiryContainer = document.getElementById(
  "card-expiry-field-container"
);

const cardFieldsSubmitButton = document.getElementById(
  "card-fields-submit-btn"
);

// Render each field after checking for eligibility
if (cardField.isEligible()) {
  const nameField = cardField.NameField();
  nameField.render(cardNameContainer);
  const numberField = cardField.NumberField();
  numberField.render(cardNumberContainer);
  const cvvField = cardField.CVVField();
  cvvField.render(cardCvvContainer);
  const expiryField = cardField.ExpiryField();
  expiryField.render(cardExpiryContainer);

  // Add click listener to the submit button and call the submit function on the CardField component
  cardFieldsSubmitButton.addEventListener("click", () => {
    cardField.getState().then((data) => {
      validateAndSubmitForm(data);
    });
  });
}

// Example function to show a result to the user. Your site's UI library can be used instead.
function resultMessage(message, textColor = "red") {
  const container = document.querySelector("#result-message");
  container.innerHTML = message;
  container.style.color = textColor;
}

function getStartTime() {
  const currentDate = new Date();
  const futureDate = new Date(currentDate);
  futureDate.setDate(currentDate.getDate() + 1);
  const formattedToISO = futureDate.toISOString();
  return formattedToISO;
}
